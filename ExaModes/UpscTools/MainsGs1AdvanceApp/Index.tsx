import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './Index.css';
import { Bot, User, ArrowUp } from '../../../components/icons';
import { Loader } from '../../../components/Loader';


declare var marked: any;

// === TYPE DEFINITIONS ===

type AnalysisDimension = {
    dimension: string;
    breakdown: string;
    potential_questions: string[];
};

type ModelAnswer = {
    question: string;
    answer: string;
};

type RelatedPyqs = {
    prelims: string[];
    mains: string[];
};

type ValueAddition = {
    facts_and_data: string[];
    quotes: string[];
    case_studies_or_examples: string[];
    diagram_suggestions: string[];
};

export type MainsGS1AdvanceResult = {
    topic: string;
    analysis: AnalysisDimension[];
    model_answer: ModelAnswer;
    related_pyqs: RelatedPyqs;
    value_addition: ValueAddition;
};

type ChatMessage = {
    role: 'user' | 'model';
    content: string | React.ReactNode;
};

// === HELPER FUNCTIONS ===

const formatResultAsMarkdown = (result: MainsGS1AdvanceResult): string => {
    let content = `# Advanced Analysis for GS Paper 1: ${result.topic}\n\n`;

    content += `## Multi-Dimensional Analysis\n`;
    result.analysis.forEach(item => {
        content += `### ${item.dimension}\n${item.breakdown}\n\n**Potential Questions:**\n- ${item.potential_questions.join('\n- ')}\n\n`;
    });

    content += `## Model Answer\n`;
    content += `**Question:** ${result.model_answer.question}\n\n**Answer:**\n${result.model_answer.answer}\n\n`;

    content += `## Related PYQs\n`;
    content += `### Mains\n- ${result.related_pyqs.mains.join('\n- ')}\n\n`;
    content += `### Prelims\n- ${result.related_pyqs.prelims.join('\n- ')}\n\n`;

    content += `## Value Addition Material\n`;
    content += `### Facts & Data\n- ${result.value_addition.facts_and_data.join('\n- ')}\n\n`;
    content += `### Quotes\n- ${result.value_addition.quotes.join('\n- ')}\n\n`;
    content += `### Case Studies/Examples\n- ${result.value_addition.case_studies_or_examples.join('\n- ')}\n\n`;
    content += `### Diagram Suggestions\n- ${result.value_addition.diagram_suggestions.join('\n- ')}\n\n`;

    return content;
};

// === COMPONENTS ===

const AnalysisResults: React.FC<{
    result: MainsGS1AdvanceResult;
    onReset: () => void;
}> = ({ result, onReset }) => {
    const [activeTab, setActiveTab] = useState<'analysis' | 'model' | 'pyq' | 'value'>('analysis');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleExport = () => {
        setIsDownloading(true);
        const markdownContent = formatResultAsMarkdown(result);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GS1_Advance_Analysis_${result.topic.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };

    return (
        <div className="gs1-advance-results">
            <h2>Advanced Analysis: {result.topic}</h2>

            <nav className="tabs-nav">
                <button onClick={() => setActiveTab('analysis')} className={activeTab === 'analysis' ? 'active' : ''}>Analysis</button>
                <button onClick={() => setActiveTab('model')} className={activeTab === 'model' ? 'active' : ''}>Model Answer</button>
                <button onClick={() => setActiveTab('pyq')} className={activeTab === 'pyq' ? 'active' : ''}>PYQ Corner</button>
                <button onClick={() => setActiveTab('value')} className={activeTab === 'value' ? 'active' : ''}>Value Addition</button>
            </nav>

            <div className="tab-content">
                {activeTab === 'analysis' && (
                    <div className="tab-pane">
                        {result.analysis.map((item, index) => (
                            <div key={index} className="report-subsection" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', background: 'var(--surface-accent)', marginBottom: '1.5rem' }}>
                                <h4>{item.dimension}</h4>
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(item.breakdown) }} />
                                <h5 style={{marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Potential Questions:</h5>
                                <ul>{item.potential_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'model' && (
                    <div className="tab-pane">
                        <div className="model-answer-box">
                            <h4>{result.model_answer.question}</h4>
                            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.model_answer.answer) }} />
                        </div>
                    </div>
                )}
                {activeTab === 'pyq' && (
                    <div className="tab-pane">
                        <div className="pyq-box">
                            {result.related_pyqs.mains.length > 0 && <>
                                <h5>Mains</h5>
                                <ul className="pyq-list">{result.related_pyqs.mains.map((q, i) => <li key={`mains-${i}`}>{q}</li>)}</ul>
                            </>}
                            {result.related_pyqs.prelims.length > 0 && <>
                                <h5 style={{ marginTop: '1.5rem' }}>Prelims</h5>
                                <ul className="pyq-list">{result.related_pyqs.prelims.map((q, i) => <li key={`prelims-${i}`}>{q}</li>)}</ul>
                            </>}
                        </div>
                    </div>
                )}
                {activeTab === 'value' && (
                     <div className="tab-pane">
                        <div className="report-subsection"><h4>Facts & Data</h4><ul>{result.value_addition.facts_and_data.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                        <div className="report-subsection"><h4>Quotes</h4><ul>{result.value_addition.quotes.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                        <div className="report-subsection"><h4>Case Studies / Examples</h4><ul>{result.value_addition.case_studies_or_examples.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                        <div className="report-subsection"><h4>Diagram Suggestions</h4><ul>{result.value_addition.diagram_suggestions.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                    </div>
                )}
            </div>
            
            <div className="results-actions" style={{ marginTop: '2rem' }}>
                <button className="action-button secondary" onClick={handleExport} disabled={isDownloading}>
                    {isDownloading ? 'Exporting...' : 'Export Analysis'}
                </button>
                <button className="action-button primary" onClick={onReset}>New Analysis</button>
            </div>
        </div>
    );
};


export const MainsGs1AdvanceApp: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<MainsGS1AdvanceResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    // New state for chat interface
    const [topic, setTopic] = useState<string>('');
    const [showResultButton, setShowResultButton] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hello! Which topic from GS Paper 1 would you like me to analyze for you today?" }
    ]);
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } catch (e) {
            console.error(e);
            setError("Could not initialize AI service.");
        }
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleGenerateAnalysis = async (topicToAnalyze: string) => {
        if (!aiRef.current) {
            setError('AI Service not initialized.');
            return;
        }
        setIsLoading(true);
        setError(null);
        // Don't clear result immediately, wait for new result
        setShowResultButton(false); // Hide button while loading
        
        // Remove the previous button message and add a loading message
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'model' && typeof lastMessage.content !== 'string') {
                 newMessages.pop(); // Remove the message with the button
            }
            return [...newMessages, {role: 'model', content: `Generating your deep-dive analysis for **"${topicToAnalyze}"**... This may take a moment.`}];
        });

        const prompt = `You are an expert UPSC mentor specializing in GS Paper 1 (Indian Heritage and Culture, History of the World and Society, and Geography). Your task is to perform a deep-dive analysis of a given topic and generate a comprehensive study package for a Mains aspirant.

**Topic:** "${topicToAnalyze}"

**CRITICAL INSTRUCTIONS:**
1.  **Comprehensive Analysis:** You MUST use Google Search to gather up-to-date and relevant information.
2.  **Strict JSON Output:** Your entire response MUST be a single, valid JSON object and nothing else. Do not include any text, comments, or markdown formatting (like \`\`\`json).
3.  **JSON Structure:** The JSON object must have the following structure:
{
  "topic": "The user-provided topic string",
  "analysis": [
    {
      "dimension": "The name of the analytical dimension (e.g., 'Historical Dimension', 'Geographical Factors')",
      "breakdown": "A detailed analysis of this dimension, formatted with Markdown. This should be a comprehensive paragraph.",
      "potential_questions": ["An array of potential Mains questions related to this specific dimension."]
    }
  ],
  "model_answer": {
    "question": "A relevant, 250-word Mains-style question based on the topic.",
    "answer": "A well-structured, high-quality model answer to the generated question, formatted with Markdown."
  },
  "related_pyqs": {
    "prelims": ["An array of strings, each being a relevant Prelims PYQ."],
    "mains": ["An array of strings, each being a relevant Mains PYQ."]
  },
  "value_addition": {
    "facts_and_data": ["An array of key statistics or data points."],
    "quotes": ["An array of relevant quotes from famous personalities."],
    "case_studies_or_examples": ["An array of specific examples or case studies."],
    "diagram_suggestions": ["An array of strings describing potential diagrams, flowcharts, or maps."]
  }
}
`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });
            
            let responseText = response.text.trim();
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```|({[\s\S]*})/s);
            if (jsonMatch) {
                responseText = jsonMatch[1] || jsonMatch[2];
            }

            const resultData = JSON.parse(responseText);
            setAnalysisResult(resultData);

        } catch (err: any) {
            console.error("GS1 Advance Tool Failed:", err);
            const errorMsg = "An error occurred generating the analysis. The topic may be too broad or the AI service is currently unavailable. Please try again.";
            setError(errorMsg);
            setMessages(prev => [...prev, {role: 'model', content: errorMsg}]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopicSubmit = () => {
        if (!userInput.trim() || isLoading) return;

        const submittedTopic = userInput.trim();
        setTopic(submittedTopic);
        setUserInput('');
        setShowResultButton(true);

        const showResultBtn = (
            <button
                className="action-button primary"
                onClick={() => handleGenerateAnalysis(submittedTopic)}
                style={{ marginTop: '1rem' }}
            >
                Show Result
            </button>
        );

        setMessages([
            ...messages,
            { role: 'user', content: submittedTopic },
            { role: 'model', content: <>Ok, I will prepare an advanced analysis for <strong>"{submittedTopic}"</strong>. When you're ready, click the button below.{showResultBtn}</> }
        ]);
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
        setTopic('');
        setShowResultButton(false);
        setMessages([
             { role: 'model', content: "Let's analyze another topic. What would you like to explore?" }
        ]);
    };
    
    const renderChatInterface = () => (
        <div className="gs1-chat-container">
            <div className="gs1-chat-history">
                {messages.map((msg, index) => (
                    <div key={index} className={`gs1-chat-message-wrapper ${msg.role}-wrapper`}>
                        <div className="gs1-avatar">
                            {msg.role === 'model' ? <Bot /> : <User />}
                        </div>
                        <div className={`gs1-chat-bubble ${msg.role}-bubble`}>
                            {typeof msg.content === 'string' ? <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} /> : msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {!showResultButton && (
                <div className="gs1-chat-input-area">
                    <input 
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Enter a GS Paper 1 topic..."
                        onKeyPress={e => e.key === 'Enter' && handleTopicSubmit()}
                        disabled={isLoading}
                    />
                    <button onClick={handleTopicSubmit} disabled={isLoading || !userInput.trim()}>
                        <ArrowUp />
                    </button>
                </div>
            )}
        </div>
    );
    

    return (
        <div className="gs1-advance-container">
            {error && !analysisResult && <div className="card error" role="alert" style={{margin: '1rem'}}>{error}</div>}
            
            {analysisResult && !isLoading ? (
                <AnalysisResults result={analysisResult} onReset={handleReset} />
            ) : (
                renderChatInterface()
            )}
        </div>
    );
};