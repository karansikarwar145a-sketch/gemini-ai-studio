import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import './Index.css';

// === HELPER FUNCTIONS (Audio Encoding/Decoding) ===
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type Blob = {
    data: string;
    mimeType: string;
};

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const calculateRMS = (data: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    const gain = 10; 
    return Math.max(0, Math.min(1, rms * gain));
};

const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// === TYPE DEFINITIONS ===
type CallState = 'setup' | 'connecting' | 'active' | 'ending' | 'feedback' | 'error';

type DAFDetails = {
    homeState: string;
    schoolingPlace: string;
    gradUniversity: string;
    gradSubject: string;
    postGradSubject: string;
    optionalSubject: string;
    workExperience: string;
    achievements: string;
    servicePreference: string;
    hobbies: string;
};

type TranscriptEntry = {
    speaker: string;
    text: string;
};

type Feedback = {
    overall_assessment: string;
    content_knowledge: string[];
    communication_skills: string[];
    areas_for_improvement: string[];
    final_score: number;
};

export type InterviewResult = {
    dafDetails: DAFDetails;
    transcript: TranscriptEntry[];
    feedback: Feedback;
    max_score: number;
};

const formatInterviewResultAsMarkdown = (result: InterviewResult): string => {
    let content = `# Interview Report\n\n`;
    content += `## DAF Details Provided\n`;
    content += `- **Home State:** ${result.dafDetails.homeState || 'N/A'}\n`;
    content += `- **Graduation Subject:** ${result.dafDetails.gradSubject || 'N/A'}\n`;
    content += `- **Optional Subject:** ${result.dafDetails.optionalSubject || 'N/A'}\n`;
    content += `- **Hobbies:** ${result.dafDetails.hobbies || 'N/A'}\n\n`;

    if (result.feedback) {
        content += `## Final Score\n`;
        content += `**Marks Awarded:** ${result.feedback.final_score} / ${result.max_score}\n\n`;
        content += `## Feedback\n\n`;
        content += `### Overall Assessment\n${result.feedback.overall_assessment}\n\n`;
        content += `### Content & Knowledge\n`;
        result.feedback.content_knowledge.forEach(p => content += `- ${p}\n`);
        content += `\n### Communication & Structure\n`;
        result.feedback.communication_skills.forEach(p => content += `- ${p}\n`);
        content += `\n### Areas for Improvement\n`;
        result.feedback.areas_for_improvement.forEach(p => content += `- ${p}\n`);
        content += `\n`;
    }

    content += `## Full Transcript\n\n`;
    result.transcript.forEach(t => {
        content += `**${t.speaker}:** ${t.text}\n\n`;
    });

    return content;
};

const InterviewScoreDisplay: React.FC<{ score: number, maxScore: number }> = ({ score, maxScore }) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const circumference = 2 * Math.PI * 54; // 54 is the radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="interview-score-display">
            <svg viewBox="0 0 120 120">
                <circle className="score-bg" cx="60" cy="60" r="54" />
                <circle
                    className="score-fg"
                    cx="60"
                    cy="60"
                    r="54"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <div className="score-text">
                <span className="score-value">{score}</span>
                <span className="score-max">/ {maxScore}</span>
            </div>
        </div>
    );
};

const Stepper: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => (
    <div className="stepper-container">
        {steps.map((step, index) => (
            <React.Fragment key={index}>
                <div className={`step-item ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'completed' : ''}`}>
                    <div className="step-circle">{currentStep > index ? '✓' : index + 1}</div>
                    <div className="step-label">{step}</div>
                </div>
                {index < steps.length - 1 && <div className="step-connector"></div>}
            </React.Fragment>
        ))}
    </div>
);

// === COMPONENT ===
export const InterviewApp: React.FC<{
    onInterviewComplete?: (result: InterviewResult) => void;
    initialData?: InterviewResult | null;
}> = ({ onInterviewComplete, initialData }) => {
    const [callState, setCallState] = useState<CallState>(initialData ? 'feedback' : 'setup');
    const [dafDetails, setDafDetails] = useState<DAFDetails>(initialData?.dafDetails || {
        homeState: '', schoolingPlace: '', gradUniversity: '', gradSubject: '', postGradSubject: '', optionalSubject: '', workExperience: '', achievements: '', servicePreference: '', hobbies: ''
    });
    const [language, setLanguage] = useState('en-IN');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>(initialData?.transcript || []);
    const [feedback, setFeedback] = useState<Feedback | null>(initialData?.feedback || null);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [isFeedbackPlaying, setIsFeedbackPlaying] = useState(false);
    
    // UI state optimized for animation
    const [orbLevels, setOrbLevels] = useState({ interviewer: 0, user: 0 });

    // New state for multi-step form
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ["Personal & Academic", "Career Details", "Profile & Preferences", "Finalize"];

    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const durationTimerRef = useRef<number | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const isFeedbackPlayingRef = useRef(false);
    const orbLevelsRef = useRef({ interviewer: 0, user: 0 });

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service.");
            setCallState('error');
        }
        
        return () => {
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.close());
            }
            mediaStreamRef.current?.getTracks().forEach(track => track.stop());
            if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') { inputAudioContextRef.current.close(); }
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') { outputAudioContextRef.current.close(); }
            if (durationTimerRef.current) { clearInterval(durationTimerRef.current); }
        };
    }, []);

    useEffect(() => {
        isFeedbackPlayingRef.current = isFeedbackPlaying;
    }, [isFeedbackPlaying]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    useEffect(() => {
        let animationFrameId: number;
        if (callState === 'active') {
            const animate = () => {
                // Apply decay
                orbLevelsRef.current.user *= 0.9;
                orbLevelsRef.current.interviewer *= 0.9;
                
                // Update state from the ref
                setOrbLevels({
                    user: orbLevelsRef.current.user,
                    interviewer: orbLevelsRef.current.interviewer,
                });

                animationFrameId = requestAnimationFrame(animate);
            };
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [callState]);

    useEffect(() => {
        if (callState !== 'active') {
             if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
            return;
        };
    
        if (isMuted) {
            scriptProcessorRef.current?.disconnect();
            if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
        } else {
            if (mediaStreamSourceRef.current && scriptProcessorRef.current && inputAudioContextRef.current?.destination) {
                try { scriptProcessorRef.current.disconnect(); } catch (e) {}
                mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            }
            if (!durationTimerRef.current) {
                durationTimerRef.current = window.setInterval(() => { setCallDuration(prev => prev + 1); }, 1000);
            }
        }
    }, [isMuted, callState]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDafDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };


    const handleStartInterview = async () => {
        if (!aiRef.current) return;
        setCallState('connecting');
        setError(null);
        setTranscript([]);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);


            const dafContext = Object.entries(dafDetails)
                .map(([key, value]) => `- ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value || 'Not provided'}`)
                .join('\n');
            
            let systemInstruction = `You are the Chairman of the UPSC interview board, acting as a highly versatile **one-person panel**. Your persona is that of an experienced, insightful, and fair interviewer who embodies the expertise of multiple specialists. Conduct a deep, comprehensive, and wide-ranging mock interview for a UPSC aspirant.

**CANDIDATE'S DAF CONTEXT:**
${dafContext}

**CRITICAL DIRECTIVES:**
1.  **EMBODY A FULL PANEL:** You must ask questions from a wide variety of domains as if you were a full interview board. Your expertise should seamlessly shift between different subjects.
2.  **COMPREHENSIVE SYLLABUS COVERAGE (MOST IMPORTANT):** Your questions MUST be deep, analytical, and opinion-based, not just factual recall. You are required to cover all possible dimensions of the UPSC syllabus, including but not limited to:
    *   **DAF & Personality:** Personal questions based on the candidate's DAF, including their home state, education, work experience, hobbies, and service preference. Ask situational Reaction Tests.
    *   **Current Affairs (Comprehensive):** You MUST use Google Search to ask questions about significant national and international events, developments, and ongoing issues from the **last 2-3 years**. Your questions should test the candidate's understanding of the evolution of these issues, not just surface-level facts from the past few days.
    *   **General Studies I:** Art & Culture, Modern Indian History, World History, Indian Society, Geography.
    *   **General Studies II:** Polity, Constitution, Governance, Social Justice, International Relations.
    *   **General Studies III:** Indian Economy, Science & Technology, Environment & Ecology, **Disaster Management**, and **Internal Security**.
    *   **General Studies IV:** Ethical theories, dilemmas, and case studies relevant to public service.
    *   **Optional Subject:** Based on the candidate's DAF, ask deep, conceptual questions from their optional subject.
3.  **BE PATIENT & LISTEN:** You MUST listen to the candidate's full response. After they finish speaking, wait for a 4-5 second pause of silence to ensure they have completed their thought before you begin speaking. Do not interrupt.
4.  **PROBING FOLLOW-UP QUESTIONS:** If a candidate's answer is shallow, you MUST ask probing follow-up questions on the SAME topic to test their depth.
5.  **REALISTIC FLOW:** Move between different domains naturally. If a candidate says they don't know an answer, acknowledge it and move on.
6.  **DURATION & NO FEEDBACK:** Aim for a 15-20 minute interview. Do not provide any feedback during the interview.
7.  **START & END:** Begin and end professionally.`;
            
            switch (language) {
                case 'en-IN':
                    systemInstruction += `\n\n**LANGUAGE & STARTING INSTRUCTION:**\nPlease conduct the entire interview in English with a neutral Indian accent. Start by professionally greeting the candidate and asking them to get comfortable.`;
                    break;
                case 'hi-IN':
                    systemInstruction += `\n\n**LANGUAGE & STARTING INSTRUCTION:**\nYou MUST conduct the entire interview in formal Hindi (Shuddh Hindi). Start the conversation by professionally greeting the candidate: 'Namaste! Aaram se baithiye.'`;
                    break;
                case 'hinglish':
                    systemInstruction += `\n\n**LANGUAGE & STARTING INSTRUCTION:**\nYou MUST conduct the interview in a natural, day-to-day Hinglish, the way most urban Indians speak. This means you should seamlessly code-switch and mix Hindi and English words *within the same sentence*. Your speech should be fluid and conversational. For example, instead of 'What is your opinion on this matter?', say 'Toh is matter pe aapka kya opinion hai?'. Instead of saying 'Your answer was good, but it lacked depth', say 'Aapka answer accha tha, but usme thodi depth ki kami thi'. The goal is a natural, mixed language, not just speaking separate sentences in pure Hindi or pure English. Start by professionally greeting the candidate: 'Hello! Please make yourself comfortable.'`;
                    break;
                default: // en-US
                    systemInstruction += `\n\n**LANGUAGE & STARTING INSTRUCTION:**\nPlease conduct the entire interview in standard American English. Start by professionally greeting the candidate and asking them to get comfortable.`;
            }

            const speechConfig = {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Fenrir' }
                }
            };

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                             if (isFeedbackPlayingRef.current) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const userLevel = calculateRMS(inputData);
                            orbLevelsRef.current.user = Math.max(orbLevelsRef.current.user, userLevel);

                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => { session.sendRealtimeInput({ media: pcmBlob }); });
                        };
                        setCallState('active');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.interrupted) {
                            for (const source of audioSourcesRef.current.values()) {
                                try { source.stop(); } catch (e) {}
                                audioSourcesRef.current.delete(source);
                            }
                            if (outputAudioContextRef.current) nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
                        }

                        if (message.serverContent?.inputTranscription) { currentInputTranscription += message.serverContent.inputTranscription.text; }
                        if (message.serverContent?.outputTranscription) { currentOutputTranscription += message.serverContent.outputTranscription.text; }
                        if (message.serverContent?.turnComplete) {
                            const finalUserInput = currentInputTranscription.trim();
                            const finalModelOutput = currentOutputTranscription.trim();
                            
                            if (finalUserInput) setTranscript(prev => [...prev, { speaker: 'You', text: finalUserInput }]);
                            if (finalModelOutput) {
                                setTranscript(prev => [...prev, { speaker: 'Interviewer', text: finalModelOutput }]);
                            }
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            
                            const aiLevel = calculateRMS(audioBuffer.getChannelData(0));
                            orbLevelsRef.current.interviewer = Math.max(orbLevelsRef.current.interviewer, aiLevel);

                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred. Please try again.');
                        setCallState('error');
                    },
                    onclose: (e: CloseEvent) => { console.log('Live session closed.'); },
                },
                config: {
                    responseModalities: [Modality.AUDIO], 
                    inputAudioTranscription: {}, 
                    outputAudioTranscription: {}, 
                    systemInstruction,
                    speechConfig,
                },
            });
        } catch (err) {
            console.error(err);
            setError("Could not access the microphone. Please grant permission and try again.");
            setCallState('error');
        }
    };
    
    const handleEndInterview = async () => {
        setCallState('ending');
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        try { scriptProcessorRef.current?.disconnect(); } catch(e){}
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') { inputAudioContextRef.current.close(); }

        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }

        if (!aiRef.current) return;

        const fullTranscript = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
        const feedbackPrompt = `You are an expert UPSC interview coach acting as the board chairman. You have the full transcript of a mock interview. Your task is to provide a final evaluation. Analyze the candidate's performance based on the transcript, considering clarity, content knowledge, communication, and analytical ability across all the different subjects that were discussed.
  
**CRITICAL INSTRUCTIONS:**
1.  Provide a comprehensive overall assessment.
2.  List specific strengths related to content/knowledge and communication skills separately.
3.  List specific, actionable areas for improvement.
4.  **Assign a final score out of 275 marks.** This score should realistically reflect their performance in a formal UPSC interview setting.
5.  Return your complete analysis as a single, valid JSON object and nothing else.

**Transcript:**
${fullTranscript}`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: feedbackPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            overall_assessment: { type: Type.STRING },
                            content_knowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
                            communication_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            areas_for_improvement: { type: Type.ARRAY, items: { type: Type.STRING } },
                            final_score: { type: Type.NUMBER },
                        },
                        required: ['overall_assessment', 'content_knowledge', 'communication_skills', 'areas_for_improvement', 'final_score']
                    }
                }
            });
            const feedbackResult: Feedback = JSON.parse(response.text);
            setFeedback(feedbackResult);
            setCallState('feedback');
            
            if (onInterviewComplete) {
                onInterviewComplete({ dafDetails, transcript, feedback: feedbackResult, max_score: 275 });
            }
        } catch (err) {
            console.error('Feedback generation failed:', err);
            setError('Could not generate feedback. You can still review the transcript.');
            setCallState('feedback');
        }
    };
    
    const handleGetImmediateFeedback = async () => {
        if (!aiRef.current || transcript.length < 1 || isFeedbackLoading || isFeedbackPlaying) return;

        const lastUserEntry = transcript.slice().reverse().find(e => e.speaker === 'You');
        if (!lastUserEntry) return;

        const lastUserEntryIndex = transcript.lastIndexOf(lastUserEntry);
        const lastAiQuestionEntry = transcript.slice(0, lastUserEntryIndex).reverse().find(e => e.speaker !== 'You');
        if (!lastAiQuestionEntry) return;

        setIsFeedbackLoading(true);

        const prompt = `You are an interview coach. Give immediate, concise, and constructive feedback on the user's answer to a question. The feedback should be spoken. Speak directly to the user.
        Question asked: "${lastAiQuestionEntry.text}"
        User's answer: "${lastUserEntry.text}"
        Now, provide the feedback.`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                setIsFeedbackPlaying(true);
                setIsFeedbackLoading(false);

                const outputCtx = outputAudioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);

                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.start();

                source.onended = () => {
                    setIsFeedbackPlaying(false);
                };
            } else {
                throw new Error("No audio data received from feedback API.");
            }
        } catch (err) {
            console.error("Error getting immediate feedback:", err);
            setIsFeedbackLoading(false);
        }
    };

    const handleExport = () => {
        setIsDownloading(true);
        const resultToExport: InterviewResult = {
            dafDetails: initialData?.dafDetails || dafDetails,
            transcript: initialData?.transcript || transcript,
            feedback: initialData?.feedback || feedback!,
            max_score: initialData?.max_score || 275,
        };
        const markdownContent = formatInterviewResultAsMarkdown(resultToExport);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Interview_Report_${resultToExport.dafDetails.optionalSubject || 'General'}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };

    const handleToggleMute = () => setIsMuted(prev => !prev);
    
     const renderSetup = () => (
        <div className="card interview-setup-container">
            <div className="interview-setup-header">
                <h2 className="font-serif">Mock Interview Simulator</h2>
                <p className="subtitle">Fill in your DAF details for a personalized interview experience.</p>
            </div>
            
            <Stepper currentStep={currentStep} steps={steps} />

            <div className="form-step-content" key={currentStep}>
                {currentStep === 0 && (
                    <div className="daf-form">
                        <div className="form-group"><label htmlFor="homeState">Home State</label><input type="text" id="homeState" name="homeState" value={dafDetails.homeState} onChange={handleInputChange} placeholder="e.g., Uttar Pradesh" /></div>
                        <div className="form-group"><label htmlFor="schoolingPlace">Schooling (City/State)</label><input type="text" id="schoolingPlace" name="schoolingPlace" value={dafDetails.schoolingPlace} onChange={handleInputChange} placeholder="e.g., Lucknow, U.P." /></div>
                        <div className="form-group"><label htmlFor="gradUniversity">Graduation University</label><input type="text" id="gradUniversity" name="gradUniversity" value={dafDetails.gradUniversity} onChange={handleInputChange} placeholder="e.g., Delhi University" /></div>
                        <div className="form-group"><label htmlFor="gradSubject">Graduation Subject</label><input type="text" id="gradSubject" name="gradSubject" value={dafDetails.gradSubject} onChange={handleInputChange} placeholder="e.g., B.A. History" /></div>
                    </div>
                )}
                {currentStep === 1 && (
                     <div className="daf-form">
                        <div className="form-group"><label htmlFor="postGradSubject">Post-Graduation (if any)</label><input type="text" id="postGradSubject" name="postGradSubject" value={dafDetails.postGradSubject} onChange={handleInputChange} placeholder="e.g., M.A. Political Science" /></div>
                        <div className="form-group"><label htmlFor="optionalSubject">Optional Subject</label><input type="text" id="optionalSubject" name="optionalSubject" value={dafDetails.optionalSubject} onChange={handleInputChange} placeholder="e.g., Public Administration" /></div>
                        <div className="form-group daf-span-2"><label htmlFor="workExperience">Work Experience (if any)</label><input type="text" id="workExperience" name="workExperience" value={dafDetails.workExperience} onChange={handleInputChange} placeholder="e.g., 2 years as Software Engineer at XYZ" /></div>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="daf-form">
                        <div className="form-group daf-span-2"><label htmlFor="achievements">Achievements/Hobbies</label><textarea id="achievements" name="achievements" value={dafDetails.achievements} onChange={handleInputChange} placeholder="e.g., Gold Medalist in University, Debating, Trekking" rows={4}></textarea></div>
                        <div className="form-group daf-span-2"><label htmlFor="servicePreference">Service Preference (Top 3)</label><input type="text" id="servicePreference" name="servicePreference" value={dafDetails.servicePreference} onChange={handleInputChange} placeholder="e.g., IAS, IFS, IPS" /></div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="daf-form" style={{display: 'flex', justifyContent: 'center'}}>
                         <div className="call-setup-options">
                            <label htmlFor="language-select">Interview Language</label>
                            <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="en-IN">English (Indian Accent)</option>
                                <option value="en-US">English (US)</option>
                                <option value="hi-IN">Hindi</option>
                                <option value="hinglish">Bilingual (Hinglish)</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="step-navigation">
                {currentStep > 0 ? (
                    <button className="action-button secondary" onClick={handlePrevStep}>Back</button>
                ) : (
                    <div /> /* Placeholder to keep "Next" on the right */
                )}

                {currentStep < steps.length - 1 ? (
                    <button className="action-button primary" onClick={handleNextStep}>Next</button>
                ) : (
                    <button className="action-button primary large" onClick={handleStartInterview}>Start Interview</button>
                )}
            </div>
        </div>
    );
    
    const renderActive = () => (
        <div
            className={`interview-pro-active-container ${isMuted ? 'is-muted' : ''} ${isTranscriptVisible ? 'transcript-visible' : ''}`}
            style={{
                '--user-level': orbLevels.user, 
                '--interviewer-level': orbLevels.interviewer
            } as React.CSSProperties}
        >
            <div className="call-background-particles"></div>
            <div className="call-header">
                <div className="call-status"><div className="pulsating-dot"></div><span>{isMuted ? 'Muted' : 'Live'}</span></div>
                <div className="call-timer">{formatDuration(callDuration)}</div>
            </div>
            <div className="call-visuals">
                <div className="panel-orb-wrapper interviewer-orb">
                    {/* FIX: Cast style object to React.CSSProperties to allow custom properties */}
                    <div className="panel-orb" style={{ '--orb-color': '#818cf8' } as React.CSSProperties}>
                         <div className="circular-visualizer">
                            <div className="ring"></div><div className="ring"></div><div className="ring"></div>
                        </div>
                    </div>
                    <div className="panel-orb-name">Interviewer</div>
                </div>
                <div className="panel-orb-wrapper user-orb">
                    {/* FIX: Cast style object to React.CSSProperties to allow custom properties */}
                    <div className="panel-orb" style={{ '--orb-color': '#6b7280' } as React.CSSProperties}>
                        <div className="circular-visualizer">
                            <div className="ring"></div><div className="ring"></div><div className="ring"></div>
                        </div>
                    </div>
                    <div className="panel-orb-name">You</div>
                </div>
            </div>
            {isTranscriptVisible && (
                <div className="live-transcript-panel">
                     <div className="transcript-content">
                        {transcript.map((entry, index) => (
                            <div key={index} className={`transcript-entry-${entry.speaker.toLowerCase().replace(/\s/g, '-')}`}>
                                <span className="transcript-speaker">{entry.speaker}</span><span className="transcript-text">{entry.text}</span>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>
            )}
            <div className="call-controls-new">
                 <button onClick={() => setIsTranscriptVisible(p => !p)} className="control-button-new" aria-label={isTranscriptVisible ? "Hide Transcript" : "Show Transcript"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button onClick={handleToggleMute} className="control-button-new" aria-label={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> }
                </button>
                <button onClick={handleEndInterview} className="control-button-new end-call-btn" aria-label="End call">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><g transform="translate(12 12) rotate(135) scale(0.85) translate(-12 -12)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></g></svg>
                </button>
                 <button onClick={handleGetImmediateFeedback} className="control-button-new" title="Get Feedback on Last Answer" aria-label="Get Immediate Feedback" disabled={isFeedbackLoading || isFeedbackPlaying || !transcript.some(e => e.speaker === 'You')}>
                    {isFeedbackLoading ? <div className="spinner-small" /> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>}
                </button>
            </div>
        </div>
        );
    
    const renderFeedback = () => (
        <div className="card interview-feedback-container">
            <h2>Interview Report</h2>
            {feedback && (
                <div className="feedback-report">
                    <InterviewScoreDisplay score={feedback.final_score} maxScore={initialData?.max_score || 275} />
                    <div className="feedback-section"><h3>Overall Assessment</h3><p>{feedback.overall_assessment}</p></div>
                    <div className="feedback-grid">
                        <div className="feedback-section"><h4>Content & Knowledge</h4><ul>{feedback.content_knowledge.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                        <div className="feedback-section"><h4>Communication & Structure</h4><ul>{feedback.communication_skills.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                    </div>
                    <div className="feedback-section"><h4>Areas for Improvement</h4><ul>{feedback.areas_for_improvement.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                </div>
            )}
            <div className="accordion" style={{marginTop: '2rem'}}><div className="accordion-item">
                <h3 className="accordion-header" style={{cursor: 'default'}}>Full Transcript</h3>
                <div className="accordion-content">
                    <div className="transcript-container review">
                        {transcript.map((entry, index) => (
                            <div key={index} className={`transcript-entry-${entry.speaker.toLowerCase().replace(/\s/g, '-')}`}>
                                <div className="transcript-speaker">{entry.speaker}</div>
                                <div className="transcript-text">{entry.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div></div>
            <div className="results-actions" style={{marginTop: '2rem'}}>
                <button className="action-button secondary" onClick={handleExport} disabled={isDownloading}>{isDownloading ? 'Exporting...' : 'Export Report'}</button>
                <button className="action-button primary" onClick={() => { setCallState('setup'); setCurrentStep(0); setDafDetails({ homeState: '', schoolingPlace: '', gradUniversity: '', gradSubject: '', postGradSubject: '', optionalSubject: '', workExperience: '', achievements: '', servicePreference: '', hobbies: '' }); setTranscript([]); setFeedback(null); }}>Start New Interview</button>
            </div>
        </div>
    );
    
    return (
        <div className="interview-container">
            {callState === 'setup' && renderSetup()}
            {callState === 'connecting' && <div className="card" style={{textAlign: 'center'}}><p>Connecting and accessing microphone...</p><div className="loading-indicator" style={{margin: '1rem auto'}}><div></div><div></div><div></div></div></div>}
            {callState === 'active' && renderActive()}
            {callState === 'ending' && <div className="card" style={{textAlign: 'center'}}><p>Interview ended. Generating feedback report...</p><div className="loading-indicator" style={{margin: '1rem auto'}}><div></div><div></div><div></div></div></div>}
            {callState === 'feedback' && renderFeedback()}
            {callState === 'error' && <div className="card error"><p>{error}</p><button className="action-button secondary" onClick={() => setCallState('setup')}>Try Again</button></div>}
        </div>
    );
};