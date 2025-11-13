// FIX: Import 'Operation' type for video generation. 'VideosOperation' is not exported.
import { GoogleGenAI, Modality, Type, GenerateContentResponse, Operation } from '@google/genai';
import { Mode, MessageContent, GroundingSource } from '../types';
import { MODES } from '../constants';
import { getAudioContext, decode, decodeAudioData } from './audioUtils';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  let mimeType = file.type;

  const supportedNonTextMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
  ];

  if (!supportedNonTextMimeTypes.includes(mimeType)) {
      // If the MIME type is not a specifically supported binary type,
      // assume it's a text-based file and normalize to text/plain
      // to avoid 'Unsupported MIME type' errors from the Gemini API for types like 'text/x-markdown'.
      mimeType = 'text/plain';
  }

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: mimeType,
    },
  };
};

export async function* generateResponse(
  mode: Mode,
  prompt: string,
  file?: File,
  location?: { latitude: number; longitude: number; },
  modelOverride?: string
): AsyncGenerator<MessageContent, void, undefined> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
  const modelInfo = MODES[mode];
  const modelToUse = modelOverride || modelInfo.model || 'gemini-2.5-flash';
  
  if (!modelToUse) throw new Error("Invalid mode or model not specified.");

  try {
    // Image Generation
    if (mode === Mode.ImageGeneration) {
      const response = await ai.models.generateImages({
        model: modelInfo.model!,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png' },
      });
      const imageUrl = `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
      yield { imageUrl };
      return;
    }

    if (mode === Mode.QuizGeneration) {
      const quizPrompt = `
        You are an expert quiz creator for the UPSC exam. Generate a 3-question multiple-choice quiz on the topic: "${prompt}".
        The questions must be high-quality and analytical.
        Your entire response MUST be a single, valid JSON array of question objects.
        Each object must have the following structure:
        - "question": (string) The full text of the question.
        - "options": (string array) An array of exactly 4 possible answer strings.
        - "correct_answer": (string) The correct answer, which must exactly match one of the options.
        - "explanation": (string) A detailed explanation.
        - "difficulty": (string) One of 'Easy', 'Medium', or 'Hard'.
      `;
      try {
        const response = await ai.models.generateContent({
            model: modelToUse,
            contents: quizPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correct_answer: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
                        },
                        required: ['question', 'options', 'correct_answer', 'explanation', 'difficulty']
                    }
                }
            }
        });
        const quizData = JSON.parse(response.text);
        let markdown = `### Quiz on: ${prompt}\n\n---\n\n`;
        quizData.forEach((q: any, index: number) => {
            markdown += `**Question ${index + 1}:** ${q.question}\n\n`;
            q.options.forEach((opt: string, i: number) => {
                markdown += `${String.fromCharCode(65 + i)}) ${opt}\n`;
            });
            markdown += `\n<details>\n<summary>Show Answer & Explanation</summary>\n\n`;
            markdown += `**Correct Answer:** ${q.correct_answer}\n\n`;
            markdown += `**Explanation:** ${q.explanation}\n\n`;
            markdown += `</details>\n\n---\n\n`;
        });
        yield markdown;
        return;
      } catch (e) {
          console.error("Quiz generation in chat failed:", e);
          yield "Sorry, I couldn't generate a quiz for that topic. Please try again with a different topic.";
          return;
      }
    }

    // Image Editing
    if (mode === Mode.ImageEditing) {
      if (!file) throw new Error("Image editing requires an image file.");
      const imagePart = await fileToGenerativePart(file);
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelInfo.model!,
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          yield { imageUrl };
        }
      }
      return;
    }

    // General Chat / Analysis / Grounding
    let contents: any = { parts: [] };
    if (prompt) contents.parts.push({ text: prompt });
    if (file) contents.parts.push(await fileToGenerativePart(file));

    const config: any = {};
    
    if (modelInfo.systemInstruction) config.systemInstruction = modelInfo.systemInstruction;
    if (mode === Mode.ThinkingMode) config.thinkingConfig = { thinkingBudget: 32768 };
    if (mode === Mode.WebSearch || mode === Mode.InvictusSearch) config.tools = [{ googleSearch: {} }];
    // FIX: 'toolConfig' should be a property of 'config', not a top-level parameter.
    if (mode === Mode.LocalSearch) {
        config.tools = [{ googleMaps: {} }];
        if (location) {
            config.toolConfig = {
                retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } }
            };
        }
    }
    
    const responseStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if(groundingMetadata?.groundingChunks){
            const sources: GroundingSource[] = groundingMetadata.groundingChunks
                .map((c: any) => ({
                    uri: c.web?.uri || c.maps?.uri,
                    title: c.web?.title || c.maps?.title,
                }))
                .filter((s: GroundingSource): s is GroundingSource => !!s.uri);

            if (sources.length > 0) {
                yield { sources };
            }
        }
    }

  } catch (error) {
    console.error(`API Error in mode ${mode}:`, error);
    throw error;
  }
}

// FIX: Use 'Operation' type instead of 'any' for better type safety.
async function pollVideoOperation(operation: Operation): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    let currentOp = operation;
    while (!currentOp.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
    }
    const downloadLink = currentOp.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to produce a download link.");

    const response = await fetch(`${downloadLink}&key=${import.meta.env.VITE_API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export const generateVideoFromText = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio },
    });
    return pollVideoOperation(operation);
};

export const generateVideoFromImage = async (imageFile: File, aspectRatio: '16:9' | '9:16', prompt?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    const imagePart = await fileToGenerativePart(imageFile);
    const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image.",
        image: { imageBytes: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio },
    });
    return pollVideoOperation(operation);
};


export const getTextToSpeech = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received from TTS API.");

    const audioContext = getAudioContext();
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
    
    // Convert AudioBuffer to a WAV file Blob URL
    const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
    return URL.createObjectURL(wavBlob);
};


// Helper to convert raw PCM audio buffer to a WAV Blob
function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i,
        sample,
        offset = 0,
        pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }
    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}