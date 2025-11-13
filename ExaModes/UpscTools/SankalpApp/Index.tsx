import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import './Index.css';

declare var marked: any;

export type SankalpResult = {
    topic: string; // The goal
    plan: string; // Markdown plan
};

const formatResultAsMarkdown = (result: SankalpResult): string => {
    let content = `# Study Plan: ${result.topic}\n\n`;
    content += result.plan;
    return content;
};


export const SankalpApp: React.FC<{
    onPlanComplete: (result: SankalpResult) => void;
    initialData?: SankalpResult | null;
}> = ({ onPlanComplete, initialData }) => {
    const [result, setResult] = useState<SankalpResult | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Form state
    const [availableTime, setAvailableTime] = useState('4 hours on weekdays, 8 hours on weekends');
    const [strengths, setStrengths] = useState('Polity, Modern History');
    const [weaknesses, setWeaknesses] = useState('Economy, Ancient History');
    const [goal, setGoal] = useState('Revise the entire GS Paper 1 syllabus in the next 30 days.');

    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service.");
        }
    }, []);

    const handleGenerate = async () => {
        if (!aiRef.current || !goal.trim()) {
            setError('Please define your primary goal.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        const prompt = `
            You are an expert UPSC mentor and strategist named 'Sankalp'. Your task is to create a detailed, practical, and personalized study plan for an aspirant based on their specific inputs. The plan must be structured, actionable, and formatted in clean Markdown.

            **Aspirant's Inputs:**
            - **Primary Goal:** ${goal}
            - **Available Time:** ${availableTime}
            - **Strengths:** ${strengths}
            - **Weaknesses:** ${weaknesses}

            **CRITICAL INSTRUCTIONS:**
            1.  **Analyze Inputs:** Carefully consider all inputs to create a balanced plan. Allocate more time to weak areas while ensuring strengths are revised. The plan must be realistic given the available time.
            2.  **MANDATORY TABLE FORMAT:** You **MUST** present the core schedule in a clear, day-by-day Markdown table. The table is the most important part of the output. It must have the following columns EXACTLY: \`Day\`, \`Time Slot\`, \`Duration\`, \`Focus\`, \`Subject/Topic\`, and \`Task/Objective\`.
                - \`Day\`: The day number (e.g., Day 1, Day 2) or date.
                - \`Time Slot\`: A specific time range (e.g., 09:00 AM - 11:00 AM).
                - \`Duration\`: The duration of the slot (e.g., 2h).
                - \`Focus\`: The type of activity. Use one of these specific terms: 'New Learning', 'Revision', 'Practice', 'Break', 'Current Affairs'.
                - \`Subject/Topic\`: The specific subject or topic to be covered.
                - \`Task/Objective\`: A concise, actionable goal for the session (e.g., "Read Chapter 3-4 of Laxmikanth", "Solve 20 PYQs on Preamble").
            3.  **Example Markdown Table Row:**
                | Day   | Time Slot           | Duration | Focus         | Subject/Topic    | Task/Objective                          |
                |-------|---------------------|----------|---------------|------------------|-----------------------------------------|
                | Day 1 | 09:00 AM - 11:00 AM | 2h       | New Learning  | Indian Polity    | Read Chapters 1-2 on Historical Background |
            4.  **Integrate Revision & Breaks:** The plan must include dedicated slots for revision of previously covered topics and short breaks between study sessions.
            5.  **Provide Strategy:** After the table, include a brief 'Strategy & Tips' section with 2-3 actionable tips based on the user's inputs.
            6.  **Output Format:** Your entire output should be a single Markdown string. Start with a main heading for the plan, followed by the table, and then the strategy section.
        `;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });

            const planResult: SankalpResult = {
                topic: goal,
                plan: response.text,
            };
            setResult(planResult);
            if (onPlanComplete && !initialData) {
                onPlanComplete(planResult);
            }

        } catch (err) {
            console.error(err);
            setError("An error occurred while generating the plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setResult(null);
        setError(null);
        setIsLoading(false);
    };

    const handleExport = () => {
        if (!result) return;
        setIsDownloading(true);
        const markdownContent = formatResultAsMarkdown(result);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sankalp_Plan_${result.topic.replace(/\s+/g, '_').substring(0, 20)}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };
    
    if (isLoading) {
        return (
             <div className="card" style={{textAlign: 'center'}}>
                <h2>Generating Your Personalized Plan...</h2>
                <p>Sankalp is crafting a schedule based on your inputs. Please wait.</p>
                <div className="loading-indicator" style={{margin: '2rem auto'}}><div></div><div></div><div></div></div>
            </div>
        )
    }

    if (error) {
         return (
            <div className="card error" role="alert">
                <p>{error}</p>
                <button className="action-button secondary" onClick={() => { setError(null); setIsLoading(false); }}>Try Again</button>
            </div>
        )
    }

    if (result) {
        return (
            <div className="card sankalp-results-container">
                <h2>Your Study Plan: {result.topic}</h2>
                <div className="sankalp-plan-content markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.plan) }}></div>
                <div className="results-actions">
                    <button className="action-button secondary" onClick={handleExport} disabled={isDownloading}>{isDownloading ? "Exporting..." : "Export Plan"}</button>
                    <button className="action-button primary" onClick={handleReset}>Create New Plan</button>
                </div>
            </div>
        )
    }

    return (
        <div className="card sankalp-config-container">
            <h2>Sankalp: Personalized Study Planner</h2>
            <p className="subtitle">Tell the AI your goals and constraints to generate a dynamic study plan tailored just for you.</p>
            <div className="sankalp-form">
                <div className="form-group span-2">
                    <label htmlFor="goal">What is your primary goal for this study plan?</label>
                    <textarea id="goal" value={goal} onChange={e => setGoal(e.target.value)} rows={3} placeholder="e.g., Revise the entire GS Paper 1 syllabus in the next 30 days." />
                </div>
                 <div className="form-group">
                    <label htmlFor="availableTime">How much time can you study?</label>
                    <input type="text" id="availableTime" value={availableTime} onChange={e => setAvailableTime(e.target.value)} placeholder="e.g., 4 hours on weekdays, 8 on weekends" />
                </div>
                 <div className="form-group">
                    <label htmlFor="strengths">What are your strong subjects/areas?</label>
                    <input type="text" id="strengths" value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="e.g., Polity, Modern History" />
                </div>
                <div className="form-group">
                    <label htmlFor="weaknesses">What are your weak subjects/areas?</label>
                    <input type="text" id="weaknesses" value={weaknesses} onChange={e => setWeaknesses(e.target.value)} placeholder="e.g., Economy, Ancient History" />
                </div>
                <div className="form-group span-2">
                    <button className="action-button primary large-btn" onClick={handleGenerate}>Generate Plan</button>
                </div>
            </div>
        </div>
    );
};