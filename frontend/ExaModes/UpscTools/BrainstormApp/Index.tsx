import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './Index.css';

declare var marked: any;

type BrainstormResult = {
    key_questions: string[];
    different_perspectives: string[];
    analogies_and_metaphors: string[];
    counterarguments: string[];
};

export const BrainstormApp: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BrainstormResult | null>(null);

    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service.");
        }
    }, []);

    const handleGenerate = async () => {
        if (!aiRef.current || !topic.trim()) {
            setError('Please enter a topic to brainstorm.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        const prompt = `You are an expert brainstorming assistant. For the topic "${topic}", generate a set of brainstorming points. Provide key questions to ask, different perspectives to consider (e.g., historical, economic, social), analogies or metaphors to explain the topic, and potential counterarguments or alternative views. Return the result as a single, valid JSON object.`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            key_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            different_perspectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                            analogies_and_metaphors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            counterarguments: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['key_questions', 'different_perspectives', 'analogies_and_metaphors', 'counterarguments']
                    }
                }
            });

            const parsedResult: BrainstormResult = JSON.parse(response.text);
            setResult(parsedResult);
        } catch (err) {
            console.error(err);
            setError("An error occurred while generating brainstorming ideas. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setResult(null);
        setError(null);
        setIsLoading(false);
        setTopic('');
    };

    if (isLoading) {
        return (
             <div className="card" style={{textAlign: 'center'}}>
                <h2>Generating Ideas...</h2>
                <p>The AI is brainstorming on '{topic}'. Please wait.</p>
                <div className="loading-indicator" style={{margin: '2rem auto'}}><div></div><div></div><div></div></div>
            </div>
        );
    }

    if (error) {
         return (
            <div className="card error" role="alert">
                <p>{error}</p>
                <button className="action-button secondary" onClick={() => { setError(null); setIsLoading(false); }}>Try Again</button>
            </div>
        );
    }

    if (result) {
        return (
            <div className="brainstorm-container">
                <div className="brainstorm-results-container">
                    <h2>Brainstorming: {topic}</h2>
                    <div className="brainstorm-grid">
                        <div className="brainstorm-card">
                            <h3>Key Questions</h3>
                            <ul>{result.key_questions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                        <div className="brainstorm-card">
                            <h3>Different Perspectives</h3>
                            <ul>{result.different_perspectives.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                        <div className="brainstorm-card">
                            <h3>Analogies & Metaphors</h3>
                            <ul>{result.analogies_and_metaphors.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                        <div className="brainstorm-card">
                            <h3>Counterarguments</h3>
                            <ul>{result.counterarguments.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        </div>
                    </div>
                    <div className="results-actions">
                        <button className="action-button primary" onClick={handleReset}>Brainstorm New Topic</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card brainstorm-config-container">
            <h2>Brainstorm Buddy</h2>
            <p className="subtitle">Enter a topic to generate key questions, different perspectives, analogies, and counterarguments to deepen your understanding.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="brainstorm-form">
                <div className="form-group">
                    <label htmlFor="topic">Topic to Brainstorm</label>
                    <textarea 
                        id="topic" 
                        value={topic} 
                        onChange={e => setTopic(e.target.value)} 
                        rows={2} 
                        placeholder="e.g., 'Federalism in India', 'Climate Change Impact'" 
                    />
                </div>
                <button className="action-button primary large-btn" type="submit">Generate Ideas</button>
            </form>
        </div>
    );
};
