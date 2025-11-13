
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './Index.css';

// Type definitions
// FIX: Export the MicroTopic type to make it available for import in other files.
export type MicroTopic = {
    name: string;
    children?: MicroTopic[];
};

export type MicroTopicsResult = {
    topic: string;
    microTopics: MicroTopic[];
};

// Recursive Node Component
const MicroTopicNode: React.FC<{ 
    topic: MicroTopic; 
    level: number;
    onGenerateQuiz: (topic: string) => void;
    onAskChat: (topic: string) => void;
    path: string; // New prop for hierarchical path
}> = ({ topic, level, onGenerateQuiz, onAskChat, path }) => {
    const [isOpen, setIsOpen] = useState(level < 2);
    const hasChildren = topic.children && topic.children.length > 0;
    
    // Construct the full path for the current topic
    const fullTopicPath = path ? `${path} -> ${topic.name}` : topic.name;

    return (
        <div className="micro-topics-node">
            <div className="micro-topics-node-header" onClick={() => hasChildren && setIsOpen(!isOpen)}>
                <div className="micro-topics-node-title">
                    {hasChildren && (
                        <svg className={`micro-topics-node-toggle ${isOpen ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    )}
                    <span style={{ paddingLeft: hasChildren ? 0 : '20px' }}>{topic.name}</span>
                </div>
                <div className="micro-topics-node-actions">
                     <button className="action-button secondary" onClick={(e) => { e.stopPropagation(); onAskChat(fullTopicPath); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span>Ask Chat</span>
                    </button>
                    <button className="action-button secondary" onClick={(e) => { e.stopPropagation(); onGenerateQuiz(fullTopicPath); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span>Generate Quiz</span>
                    </button>
                </div>
            </div>
            {hasChildren && isOpen && (
                <div className="micro-topics-children">
                    {topic.children?.map((child, index) => (
                        <MicroTopicNode 
                            key={child.name + index} 
                            topic={child} 
                            level={level + 1}
                            onGenerateQuiz={onGenerateQuiz}
                            onAskChat={onAskChat}
                            path={fullTopicPath} // Pass down the updated path
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


// Main App Component
export const MicroTopicsApp: React.FC<{
    onAnalysisComplete?: (result: MicroTopicsResult) => void;
    initialData?: MicroTopicsResult | null;
    initialTopic?: string | null;
    onGenerateQuiz: (topic: string) => void;
    onAskChat: (topic: string) => void;
}> = ({ onAnalysisComplete, initialData, initialTopic, onGenerateQuiz, onAskChat }) => {
    const [analysisResult, setAnalysisResult] = useState<MicroTopicsResult | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [topic, setTopic] = useState(initialTopic || '');
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service.");
        }
    }, []);

    const handleGenerate = useCallback(async (currentTopic: string) => {
        if (!aiRef.current) {
            setError('AI Service not initialized.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        // Define a nested schema to a fixed depth to avoid circular references
        const microTopicSchema: any = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
            },
            required: ['name'],
        };

        // Create a nested structure manually to avoid stack overflow from circular references
        const level4 = { ...microTopicSchema }; // depth 4
        const level3 = { ...microTopicSchema, properties: { ...microTopicSchema.properties, children: { type: Type.ARRAY, items: level4 } } }; // depth 3
        const level2 = { ...microTopicSchema, properties: { ...microTopicSchema.properties, children: { type: Type.ARRAY, items: level3 } } }; // depth 2
        const level1 = { ...microTopicSchema, properties: { ...microTopicSchema.properties, children: { type: Type.ARRAY, items: level2 } } }; // depth 1 (root of items)
        
        const prompt = `You are an expert UPSC syllabus deconstructor. Given the following UPSC syllabus topic, break it down into a comprehensive, nested list of micro-topics that an aspirant should study. The breakdown should be detailed and structured. Return the result as a JSON array of objects, where each object has a 'name' (string) and an optional 'children' (an array of the same object type). Do not include the parent topic itself in the response.

Topic: "${currentTopic}"`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: level1 },
                }
            });

            let responseText = response.text.trim();
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```|(\[[\s\S]*\])/s);
            if (jsonMatch) {
                responseText = jsonMatch[1] || jsonMatch[2];
            }
            
            const microTopics = JSON.parse(responseText);
            const resultData: MicroTopicsResult = { topic: currentTopic, microTopics };
            setAnalysisResult(resultData);

            if (onAnalysisComplete) {
                onAnalysisComplete(resultData);
            }
        } catch (err) {
            console.error("Micro-topics generation failed:", err);
            setError("Failed to generate micro-topics. The AI may have returned an invalid response. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [onAnalysisComplete]);
    
    useEffect(() => {
        if (initialTopic && !initialData) {
            handleGenerate(initialTopic);
        }
    }, [initialTopic, initialData, handleGenerate]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            handleGenerate(topic.trim());
        }
    };
    
     const handleReset = () => {
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
        setTopic('');
    };

    if (isLoading) {
        return (
            <div className="card" style={{textAlign: 'center'}}>
                <h2>Generating Micro-Topics...</h2>
                <p>Deconstructing '{topic}' with AI. Please wait.</p>
                <div className="loading-indicator" style={{margin: '2rem auto'}}><div></div><div></div><div></div></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="card error" role="alert">
                <p>{error}</p>
                <button className="action-button secondary" onClick={handleReset}>Try Again</button>
            </div>
        )
    }

    if (analysisResult) {
        return (
            <div className="card micro-topics-container">
                <h2>Micro-Topics for: {analysisResult.topic}</h2>
                <div className="micro-topics-list">
                    {analysisResult.microTopics.map((t, i) => (
                        <MicroTopicNode 
                            key={t.name + i} 
                            topic={t} 
                            level={1} 
                            onGenerateQuiz={onGenerateQuiz} 
                            onAskChat={onAskChat}
                            path={analysisResult.topic}
                        />
                    ))}
                </div>
                <div className="results-actions" style={{marginTop: '2rem'}}>
                    <button className="action-button primary" onClick={handleReset}>Analyze New Topic</button>
                </div>
            </div>
        )
    }

    return (
        <div className="card pyq-config-container">
            <h2>Micro-Topic Explorer</h2>
            <p className="subtitle">Enter any syllabus topic to get a granular, AI-generated breakdown of all related micro-topics.</p>
            <form onSubmit={handleSubmit} className="pyq-config-form">
                <div className="form-group">
                    <label htmlFor="topic-input">Syllabus Topic</label>
                    <textarea
                        id="topic-input"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g., 'Federalism in India', 'Indus Valley Civilization'"
                        rows={2}
                        required
                    />
                </div>
                <button type="submit" className="action-button primary" disabled={isLoading || !topic.trim()}>
                    Generate with AI
                </button>
            </form>
        </div>
    );
};
