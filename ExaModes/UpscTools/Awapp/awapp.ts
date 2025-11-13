

import { GoogleGenAI, Type, Chat as GenAIChat } from "@google/genai";
import React from 'react';

// === TYPE DEFINITIONS ===

export type PointFeedback = {
    point: string;
    marks: number;
};

export type SectionBreakdown = {
    section_name: string;
    user_answer_text: string;
    marks_awarded: number;
    strengths: PointFeedback[];
    weaknesses: PointFeedback[];
    suggestions: string[];
    value_addition?: string[];
    deep_dive_analysis?: string;
};

export type EvaluationResult = {
    question: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    detailed_analysis: string;
    score: number;
    max_score: number;
    word_count: number;
    section_breakdown: SectionBreakdown[];
};

export type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export type ContentPart = { type: 'text'; content: string } | { type: 'diagram'; prompt: string };


// === UTILITY FUNCTIONS ===

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

export const formatResultAsMarkdown = (result: EvaluationResult, modelAnswer: string | null): string => {
    let content = `# Evaluation Report for: ${result.question}\n\n`;

    content += `## Overall Score\n`;
    content += `- **Marks Scored:** ${result.score} / ${result.max_score}\n`;
    content += `- **Word Count:** ${result.word_count}\n\n`;

    content += `## Overall Strengths\n`;
    result.strengths.forEach(item => content += `- ${item}\n`);
    content += "\n";

    content += `## Overall Weaknesses\n`;
    result.weaknesses.forEach(item => content += `- ${item}\n`);
    content += "\n";

    content += `## Overall Suggestions\n`;
    result.suggestions.forEach(item => content += `- ${item}\n`);
    content += "\n";

    content += `## Detailed Analysis\n${result.detailed_analysis}\n\n`;

    if (result.section_breakdown && result.section_breakdown.length > 0) {
        content += `## Section-by-Section Breakdown\n`;
        result.section_breakdown.forEach(section => {
            content += `### ${section.section_name} (${section.marks_awarded} marks)\n\n`;
            content += `**Your Answer (this section):**\n\`\`\`\n${section.user_answer_text || 'No text extracted.'}\n\`\`\`\n\n`;
            
            if (section.strengths.length > 0) {
                content += `**Strengths:**\n`;
                section.strengths.forEach(item => content += `- **[+${item.marks}]** ${item.point}\n`);
            }
            
            if (section.weaknesses.length > 0) {
                content += `\n**Weaknesses:**\n`;
                section.weaknesses.forEach(item => content += `- **[${item.marks}]** ${item.point}\n`);
            }

            if (section.suggestions.length > 0) {
                content += `\n**Suggestions:**\n`;
                section.suggestions.forEach(item => content += `- ${item}\n`);
            }

            if (section.value_addition && section.value_addition.length > 0) {
                content += `\n**Value Addition Points:**\n`;
                section.value_addition.forEach(item => content += `- ${item}\n`);
            }
            content += "\n---\n";
        });
    }

    if (modelAnswer) {
        content += `## Model Answer\n${modelAnswer}\n\n`;
    }

    return content;
};


// === API & LOGIC FUNCTIONS ===

const fetchValueAdditions = async (ai: GoogleGenAI, results: EvaluationResult[]): Promise<EvaluationResult[]> => {
    const model = 'gemini-2.5-flash';
    
    try {
        const enrichedResults = await Promise.all(results.map(async (result) => {
            const sectionNames = result.section_breakdown.map(s => s.section_name);
            if (sectionNames.length === 0) {
                return { ...result, section_breakdown: result.section_breakdown.map(s => ({...s, value_addition: []})) };
            };

            const valueAddPrompt = `
                For the UPSC question: "${result.question}", I need value-addition points for the following sections of an answer: ${sectionNames.join(', ')}.
                For each section, use Google Search to find recent data, relevant statistics, contemporary examples, or case studies that would enhance the answer.
                Return your findings as a single, valid JSON object and nothing else.
                The keys of the object should be the exact section names: "${sectionNames.join('", "')}".
                The value for each key should be an array of strings. Each string must be a specific value-addition point formatted with Markdown to emphasize key terms (e.g., using **bold** for names or stats).
                Example format: { "${sectionNames[0]}": ["A key statistic is that **90% of initiatives** succeed with proper funding.", "The recent **'XYZ' report** highlights this issue."], "${sectionNames[1]}": [] }
            `;
            
            const response = await ai.models.generateContent({
                model,
                contents: valueAddPrompt,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });

            try {
                let responseText = response.text.trim();
                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
                if (jsonMatch) {
                    responseText = jsonMatch[1] || jsonMatch[2];
                }

                const valueAdditions = JSON.parse(responseText);
                const enrichedSectionBreakdown = result.section_breakdown.map(section => ({
                    ...section,
                    value_addition: valueAdditions[section.section_name] || []
                }));
                return { ...result, section_breakdown: enrichedSectionBreakdown };
            } catch (e) {
                console.error("Failed to parse value-addition JSON for question:", result.question, e);
                console.error("LLM Response was:", response.text);
                const fallbackBreakdown = result.section_breakdown.map(section => ({ ...section, value_addition: [] }));
                return { ...result, section_breakdown: fallbackBreakdown };
            }
        }));
        return enrichedResults;
    } catch (err) {
        console.error("Error fetching value additions:", err);
         return results.map(res => ({
            ...res,
            section_breakdown: res.section_breakdown.map(sec => ({ ...sec, value_addition: [] }))
        }));
    }
};

export const evaluateAnswerSheet = async (
    ai: GoogleGenAI, 
    answerSheetFile: File,
    strictness: 'Easy' | 'Medium' | 'Hard',
    deepDive: boolean,
    setProgress: React.Dispatch<React.SetStateAction<{ percentage: number, status: string } | null>>,
    progressIntervalRef: React.MutableRefObject<number | null>
): Promise<EvaluationResult[]> => {
    
    setProgress({ percentage: 10, status: 'Reading your file...' });
    const base64File = await fileToBase64(answerSheetFile);

    setProgress({ percentage: 20, status: 'Analyzing with Gemini... This is the longest step.' });
    
    progressIntervalRef.current = window.setInterval(() => {
        setProgress(prev => {
            if (!prev || prev.percentage >= 90) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                return prev;
            }
            return { ...prev, percentage: prev.percentage + 1 };
        });
    }, 400);

    let strictnessDescription = `You are a strict but fair, balanced, and experienced UPSC Mains examiner. Your goal is to provide a realistic and constructive evaluation that accurately reflects the answer's quality. A very good answer should score around 50-60% of the max_score, and only exceptional, flawless answers should score higher. This realism is critical.`;
    if (strictness === 'Easy') {
        strictnessDescription = `You are a lenient and encouraging UPSC examiner. Your goal is to boost confidence. Be generous with marks for any valid attempt and focus feedback primarily on major structural improvements. A good attempt should score around 60-70% of the max_score.`;
    } else if (strictness === 'Hard') {
        strictnessDescription = `You are an extremely strict and critical UPSC Mains examiner, simulating the standards for a top 10 ranker. Scrutinize every detail. Be very conservative with marks, awarding them only for exceptional points that are well-substantiated with data or deep analysis. Feedback should be direct, blunt, and focused on even minor imperfections in structure, content, and expression. A very good answer should score around 40-50% of the max_score.`;
    }

    const deepDiveTextPrompt = deepDive
        ? `8. For each section, you MUST also provide a "deep_dive_analysis" field. This is a string containing a detailed analysis connecting the user's points to broader syllabus themes, suggesting alternative viewpoints, and citing specific examples/data that would elevate the answer.`
        : '';

    const prompt = `
        ${strictnessDescription}

        The user has provided a single document (PDF or image) that contains a series of questions and their corresponding handwritten answers.

        Your task is to:
        1.  Carefully parse the entire document to identify each distinct question and its corresponding handwritten answer.
        2.  **Crucially, for each question, you MUST identify the maximum marks allocated to it.** This information is typically written at the end of the question text (e.g., "[10 marks]", "(15 marks)", "150 words / 10 marks"). You must extract this number accurately. This will be the 'max_score'.
        3.  For each question-and-answer pair, evaluate the answer based on the following balanced UPSC standards:
            *   **Adherence to Directives:** The most important evaluation criterion is how well the answer adheres to the question's directive (e.g., 'critically analyze', 'discuss', 'evaluate'). An answer that merely describes when it should be critically analyzing should receive lower marks.
            *   **Balanced, Point-Based Marking:** For each section of the answer (e.g., Introduction, Body, Conclusion), perform a granular, point-by-point evaluation with these principles:
                *   **Strengths:** Award positive marks based on the quality and relevance of the point. A standard, correct point should receive +1 mark. A point that is exceptionally insightful, well-supported with data, or shows deep analytical skill could receive up to +2 marks, depending on the overall weightage of the question.
                *   **Weaknesses:** Identify weaknesses clearly. However, apply negative marks sparingly. Reserve negative marks (-0.5 to -1) only for significant errors such as **major factual inaccuracies, logical fallacies, or fundamentally misunderstanding the question's directive**. For other weaknesses like **lack of depth, poor structure, or omission of relevant points**, you MUST list them as a weakness but assign **"marks": 0**. This indicates a missed opportunity to score rather than a penalty.
            *   The 'marks_awarded' for a section MUST be the mathematical sum of all positive marks for strengths and negative marks for weaknesses within that section.
            *   **Credit for Diagrams:** If a relevant and well-executed visual aid (diagram, flowchart, map) is present, list it as a strength and assign appropriate positive marks.
        4.  The overall 'score' for the question MUST be the sum of 'marks_awarded' from all its sections. The final score should be balanced and reflect a fair assessment of the answer's quality.
        5.  Provide an overall evaluation including overall strengths, weaknesses, and suggestions that are direct and constructive.
        6.  **Strict and Accurate Word Count:** This is a critical step. You MUST calculate the **exact** word count of the user's handwritten answer.
            *   **Isolate Handwriting:** First, identify and isolate only the handwritten text of the answer, distinguishing it from any printed text on the page.
            *   **Ignore ALL Printed Text:** Explicitly ignore all machine-printed text. This includes the question text, headers, footers, page numbers, margins, or any other template text. Your focus is solely on what the user has written.
            *   **Transcribe and Count:** To ensure accuracy, first transcribe the isolated handwritten text into digital text, and then perform a word count on your transcription. This two-step process is mandatory.
            *   **Evaluate Word Count:** If the answer's word count is significantly over or under the typical limit for the question's marks (e.g., a 10-mark answer being 300 words), this should be flagged as a weakness (with 0 marks).
        7.  Return your complete analysis as a single JSON array.
        ${deepDiveTextPrompt}

        Each object in the array must correspond to one evaluated question and have the following structure:
        - "question": The exact text of the question you identified.
        - "strengths": An array of strings, with each string being a concise OVERALL strength of the answer.
        - "weaknesses": An array of strings, with each string being a concise OVERALL weakness.
        - "suggestions": An array of strings, offering specific, actionable OVERALL suggestions for improvement.
        - "detailed_analysis": A comprehensive OVERALL evaluation of the answer in Markdown format.
        - "score": The final score you assigned (sum of marks from all sections).
        - "max_score": The maximum possible score for the question, which you **MUST** extract from the document text.
        - "word_count": The exact word count of the user's handwritten answer.
        - "section_breakdown": An array of objects, where each object represents a section of the answer. Each object must have:
            - "section_name": The name of the section.
            - "user_answer_text": The actual text written by the user for this specific section, extracted verbatim.
            - "marks_awarded": The sum of marks from the strengths and weaknesses in this section.
            - "strengths": An array of objects. Each object must have "point" (a string describing the strength) and "marks" (a positive number).
            - "weaknesses": An array of objects. Each object must have "point" (a string describing the weakness) and "marks" (a negative number or 0).
            - "suggestions": An array of strings with suggestions for that section.
            ${deepDive ? '- "deep_dive_analysis": "string (A detailed deep-dive analysis as described above)."' : ''}

        Ensure your output is a valid JSON array and nothing else.
    `;
    
    const contents = {
        parts: [
            { text: prompt },
            { inlineData: { mimeType: answerSheetFile.type, data: base64File } }
        ]
    };

    const sectionBreakdownProperties: any = {
        section_name: { type: Type.STRING },
        user_answer_text: { type: Type.STRING },
        marks_awarded: { type: Type.NUMBER },
        strengths: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { point: { type: Type.STRING }, marks: { type: Type.NUMBER } },
                required: ['point', 'marks']
            }
        },
        weaknesses: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { point: { type: Type.STRING }, marks: { type: Type.NUMBER } },
                required: ['point', 'marks']
            }
        },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    };
    if (deepDive) {
        sectionBreakdownProperties['deep_dive_analysis'] = { type: Type.STRING };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        detailed_analysis: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        max_score: { type: Type.NUMBER },
                        word_count: { type: Type.NUMBER },
                        section_breakdown: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: sectionBreakdownProperties,
                                required: ['section_name', 'user_answer_text', 'marks_awarded', 'strengths', 'weaknesses', 'suggestions']
                            }
                        }
                    },
                    required: ['question', 'strengths', 'weaknesses', 'suggestions', 'detailed_analysis', 'score', 'max_score', 'word_count', 'section_breakdown']
                }
            }
        }
    });

    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
    }
    setProgress({ percentage: 95, status: 'Fetching value-addition insights...' });
    
    const resultText = response.text.trim();
    const resultJson = JSON.parse(resultText);
    
    const enrichedResults = await fetchValueAdditions(ai, resultJson);

    setProgress({ percentage: 100, status: 'Evaluation complete!' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return enrichedResults;
};

export const generateModelAnswer = async (ai: GoogleGenAI, question: string): Promise<ContentPart[]> => {
    const prompt = `
        You are an expert content creator for UPSC Mains preparation. Your task is to generate a high-quality, comprehensive model answer for the following question.

        **Question:** "${question}"

        **Instructions:**
        1.  **Analyze the Question's Directive:** First, identify the core directive of the question (e.g., 'critically analyze', 'discuss', 'explain', 'evaluate'). Your entire answer's structure and tone must be tailored to this directive. You MUST explicitly state your approach in the introduction based on this directive and summarize how you've addressed it in the conclusion.
        2.  **Word Count:** The answer must be between 500 and 600 words.
        3.  **Structure:** Follow a clear and logical structure:
            *   **Introduction:** Briefly introduce the topic and state the core argument or scope of the answer, explicitly addressing the question's directive as mentioned above.
            *   **Body:** This should be the main part of the answer. Critically analyze the question from multiple dimensions (e.g., social, political, economic, ethical, technological, environmental). Use headings and subheadings in Markdown to organize the different dimensions.
            *   **Conclusion:** Summarize the key points and provide a forward-looking or balanced concluding statement that directly ties back to the question's core directive.
        4.  **Value Addition (Crucial):**
            *   You **must** use Google Search to find and incorporate the latest information, including:
                *   Relevant statistics and data from credible sources (e.g., government reports, international organizations).
                *   Recent case studies or examples.
                *   Names of relevant committees, reports, or legal judgments.
                *   Contemporary analysis and viewpoints.
        5.  **Incorporate Visuals (Diagrams/Flowcharts):**
            *   Where a diagram or flowchart would be beneficial, you **must** insert a simple, clear textual placeholder in the format: \`[A diagram/flowchart illustrating <concept> can be drawn here.]\`. Do not use any special markdown headings for this.
        6.  **Highlight Key Information:** Identify the most crucial facts, statistics, keywords, or takeaways that a student should memorize. Wrap these specific phrases or sentences in \`++\` symbols. Each highlighted section MUST be on its own line and not be part of another sentence or list item. For example: \`++The Gini coefficient was reported as 0.65 in the latest UN report.++\`. Use this for standout information, not as a replacement for bolding. Your goal is for the final highlighted text to appear semi-bold.
        7.  **Formatting:** Use Markdown for clear formatting (headings, bold text, bullet points).
        8.  **Goal:** The final output should be a model answer that a candidate can study to understand how to build a multi-dimensional, well-supported, and high-scoring answer that includes visual aids. It should be concise but information-dense.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    let answerText = response.text;
    const newContent: ContentPart[] = [];
    
    const parts = answerText.split(/(\[A\s(?:diagram|flowchart)[\s\S]*?\])/g);

    for (const part of parts) {
        if (part.startsWith('[A diagram') || part.startsWith('[A flowchart')) {
            newContent.push({ type: 'diagram', prompt: part });
        } else if (part.trim()) {
            newContent.push({ type: 'text', content: part });
        }
    }

    if (newContent.length === 0) {
         newContent.push({ type: 'text', content: answerText });
    }
    return newContent;
};

export const createFollowUpChat = (ai: GoogleGenAI, evaluationResults: EvaluationResult[]): { chat: GenAIChat, initialHistory: ChatMessage[] } => {
    const model = 'gemini-2.5-flash';

    const fullEvaluationContext = evaluationResults.map((res: EvaluationResult, index: number) => {
        const valueAdditionContext = res.section_breakdown
            .map(sec => {
                if (sec.value_addition && sec.value_addition.length > 0) {
                    return `- For section "${sec.section_name}": ${sec.value_addition.join('; ')}`;
                }
                return null;
            })
            .filter(Boolean)
            .join('\n');

        return `Evaluation for Question ${index + 1} (${res.question}):\n` +
            `Score: ${res.score}/${res.max_score}\n` +
            `Strengths: ${res.strengths.join('; ')}\n` +
            `Weaknesses: ${res.weaknesses.join('; ')}\n` +
            `Suggestions: ${res.suggestions.join('; ')}\n` +
            (valueAdditionContext ? `\nAvailable Value Addition Points:\n${valueAdditionContext}\n` : '') +
            `Detailed Analysis: ${res.detailed_analysis}`;
    }).join('\n\n---\n\n');
    
    const initialModelMessage = "Great! I have the full context of your answers and my evaluation. How can I help you improve further?";
    const initialHistory = [
        { role: 'user', parts: [{ text: `I have just received feedback on my answer sheet. The full context of my answers and the evaluation is provided.` }] },
        { role: 'model', parts: [{ text: initialModelMessage }] }
    ];

    const systemInstruction = `You are a helpful UPSC Mains preparation assistant. You have just provided a detailed evaluation for a user's answer sheet. The full context of the questions and the evaluation has been provided, including specific 'Value Addition' points generated from Google Search. Your role is to answer follow-up questions to help the user understand their mistakes and improve their performance.
**Crucially, when discussing weaknesses or providing suggestions, you should proactively reference the 'Value Addition' points.** Explain how incorporating these specific facts, stats, or examples would have strengthened their answer. For example, if a user asks how to improve their introduction, and a relevant 'Value Addition' point exists, you should say something like, "You could strengthen your introduction by including the recent statistic I found: [mention the specific point]." This makes your advice more concrete and actionable.
**IMPORTANT FORMATTING RULE:** Use standard Markdown for formatting.
- Use headings (e.g., \`## Your Heading\`) for structure.
- Use bold text (\`**important term**\`) to highlight key concepts, definitions, or facts.
- Use lists for clarity.
Your output should be clean, readable, and well-structured markdown.
Context: ${fullEvaluationContext}`;

    const chat = ai.chats.create({ 
        model, 
        history: initialHistory,
        config: {
            systemInstruction
        }
    });
    
    return { chat, initialHistory: [{ role: 'model', content: initialModelMessage }] };
};