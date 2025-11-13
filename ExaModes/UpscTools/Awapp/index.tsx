import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat as GenAIChat } from "@google/genai";
import { 
    EvaluationResult, 
    ContentPart, 
    ChatMessage,
    evaluateAnswerSheet,
    generateModelAnswer,
    createFollowUpChat,
    formatResultAsMarkdown
} from './awapp';
import './Index.css';

declare var marked: any;

export type { EvaluationResult };

const ScoreGauge: React.FC<{ score: number; maxScore: number; wordCount: number }> = ({ score, maxScore, wordCount }) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    let barColorClass = 'score-gauge-fill-good';
    if (percentage < 75) barColorClass = 'score-gauge-fill-medium';
    if (percentage < 40) barColorClass = 'score-gauge-fill-low';

    return (
        <div className="score-container">
            <div className="score-header">
                <p className="score-text">Marks Scored: <strong>{score} / {maxScore}</strong></p>
                <p className="word-count-text">Word Count: {wordCount}</p>
            </div>
            <div className="score-gauge" aria-label={`Score: ${score} out of ${maxScore}`}>
                <div 
                    className={`score-gauge-fill ${barColorClass}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const FeedbackBox: React.FC<{ title: string; items: string[]; type: 'strengths' | 'weaknesses' | 'suggestions' }> = ({ title, items, type }) => {
    const icons = {
        strengths: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        ),
        weaknesses: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        ),
        suggestions: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.09 8.26 20 9.27 15.55 13.97 16.91 20.02 12 17.27 7.09 20.02 8.45 13.97 4 9.27 9.91 8.26 12 2z"></path></svg>
        ),
    };

    if (!items || items.length === 0) return null;

    return (
        <div className={`feedback-box ${type}-box`}>
            <h3>{icons[type]} {title}</h3>
            <ul>
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

const ExportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onDownloadMarkdown: () => void;
    isDownloading: boolean;
}> = ({ isOpen, onClose, onDownloadMarkdown, isDownloading }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="modal-content download-modal-content" onClick={e => e.stopPropagation()}>
                <h2>Export Evaluation</h2>
                <p className="modal-subtitle">Choose a format to download your report.</p>
                <div className="modal-actions">
                    <button onClick={onDownloadMarkdown} className="action-button primary modal-button" disabled={isDownloading}>
                         {isDownloading ? 'Exporting...' : 'Download as Markdown (.md)'}
                    </button>
                </div>
                 <div className="modal-actions">
                     <button onClick={onClose} className="action-button secondary modal-button">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const ComparisonView: React.FC<{ userAnswer: string, modelAnswer: string }> = ({ userAnswer, modelAnswer }) => {
    return (
        <div className="comparison-container">
            <div className="comparison-panel">
                <h3>Your Answer</h3>
                <div
                    className="comparison-content markdown-content"
                    dangerouslySetInnerHTML={{ __html: marked.parse(userAnswer || ' ') }}
                />
            </div>
            <div className="comparison-panel">
                <h3>Model Answer</h3>
                 <div
                    className="comparison-content markdown-content"
                    dangerouslySetInnerHTML={{ __html: marked.parse(modelAnswer || ' ') }}
                />
            </div>
        </div>
    );
};

interface AccordionItemProps {
    result: EvaluationResult;
    index: number;
    ai: GoogleGenAI;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ result, index, ai }) => {
    const [isOpen, setIsOpen] = useState(index === 0);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'analysis' | 'model'>('overview');
    
    const [modelAnswerContent, setModelAnswerContent] = useState<ContentPart[] | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const modelAnswer = useMemo(() => {
        if (!modelAnswerContent) return null;
        return modelAnswerContent.map(part => {
            if (part.type === 'text') return part.content;
            return `\n${part.prompt}\n`;
        }).join('');
    }, [modelAnswerContent]);

    const handleGenerateModelAnswer = async () => {
        if (!ai) return;
        setIsGenerating(true);
        setGenerationError(null);
        try {
            const content = await generateModelAnswer(ai, result.question);
            setModelAnswerContent(content);
        } catch (err) {
            console.error("Error generating model answer:", err);
            setGenerationError("Sorry, an error occurred while generating the model answer. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const [isComparing, setIsComparing] = useState(false);

    const userAnswer = React.useMemo(() => 
        result.section_breakdown.map(s => s.user_answer_text || '').join('\n\n'), 
        [result.section_breakdown]
    );
    
    const toggleRow = (rowIndex: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowIndex)) {
                newSet.delete(rowIndex);
            } else {
                newSet.add(rowIndex);
            }
            return newSet;
        });
    };

    const handleDownloadMarkdown = () => {
        setIsDownloading(true);
        const markdownContent = formatResultAsMarkdown(result, modelAnswer);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Evaluation-Report_Q${index + 1}_${result.question.substring(0, 20).replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
        setIsExportModalOpen(false);
    };

    return (
        <div className="accordion-item">
            <button className="accordion-header" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
                <span className="accordion-title">{`Q${index + 1}: ${result.question}`}</span>
                <span className="accordion-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            {isOpen && (
                 <div className="accordion-content">
                    <div className="accordion-main-content">
                        <nav className="tabs-nav">
                            <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''} role="tab">Overview</button>
                            <button onClick={() => setActiveTab('breakdown')} className={activeTab === 'breakdown' ? 'active' : ''} role="tab">Section Breakdown</button>
                            <button onClick={() => setActiveTab('analysis')} className={activeTab === 'analysis' ? 'active' : ''} role="tab">Detailed Analysis</button>
                            <button onClick={() => setActiveTab('model')} className={activeTab === 'model' ? 'active' : ''} role="tab">Model Answer</button>
                        </nav>

                        <div className="tab-content" role="tabpanel">
                            {activeTab === 'overview' && (
                                <div className="tab-pane">
                                    <ScoreGauge score={result.score} maxScore={result.max_score} wordCount={result.word_count} />
                                    <div className="evaluation-grid">
                                        <FeedbackBox title="Overall Strengths" items={result.strengths} type="strengths" />
                                        <FeedbackBox title="Overall Weaknesses" items={result.weaknesses} type="weaknesses" />
                                    </div>
                                    <FeedbackBox title="Overall Suggestions to Improve" items={result.suggestions} type="suggestions" />
                                </div>
                            )}
                             {activeTab === 'breakdown' && result.section_breakdown && result.section_breakdown.length > 0 && (
                                <div className="tab-pane">
                                    <div className="breakdown-table-container">
                                        <table className="breakdown-table">
                                            <thead>
                                                <tr>
                                                    <th>Section</th>
                                                    <th>Marks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.section_breakdown.map((section, sIndex) => {
                                                    const isExpanded = expandedRows.has(sIndex);
                                                    return (
                                                        <React.Fragment key={sIndex}>
                                                            <tr className="breakdown-row-main" onClick={() => toggleRow(sIndex)} aria-expanded={isExpanded}>
                                                                <td>
                                                                    <div className="section-cell-wrapper">
                                                                         <span className={`row-toggle-icon ${isExpanded ? 'expanded' : ''}`}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                                        </span>
                                                                        {section.section_name}
                                                                    </div>
                                                                </td>
                                                                <td className="marks-cell">{section.marks_awarded} / {Math.round(result.max_score / result.section_breakdown.length)}</td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr className="breakdown-row-details">
                                                                    <td colSpan={2}>
                                                                        <div className="section-details-wrapper">
                                                                            <div className="user-answer-text-container">
                                                                                <h4>Your Answer (this section)</h4>
                                                                                <div
                                                                                    className="user-answer-text markdown-content"
                                                                                    dangerouslySetInnerHTML={{ __html: marked.parse(section.user_answer_text || '<em>No text extracted for this section.</em>') }}
                                                                                />
                                                                            </div>
                                                                            <div className="details-grid">
                                                                                <div className="detail-category">
                                                                                    <h4>Strengths</h4>
                                                                                    <ul>
                                                                                        {section.strengths.map((item, i) => (
                                                                                            <li key={i}>
                                                                                                <span className="marks-badge positive">{item.marks > 0 ? `+${item.marks}` : item.marks}</span>
                                                                                                <span>{item.point}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                                <div className="detail-category">
                                                                                    <h4>Weaknesses</h4>
                                                                                    <ul>
                                                                                        {section.weaknesses.map((item, i) => (
                                                                                            <li key={i}>
                                                                                                <span className={`marks-badge ${item.marks < 0 ? 'negative' : 'neutral'}`}>{item.marks}</span>
                                                                                                <span className="weakness-point">{item.point}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                                <div className="detail-category">
                                                                                    <h4>Suggestions</h4>
                                                                                    <ul>{section.suggestions.map((item, i) => <li key={i}>{item}</li>)}</ul>
                                                                                </div>
                                                                                {section.value_addition && section.value_addition.length > 0 && (
                                                                                    <div className="detail-category value-addition-category">
                                                                                        <h4 className="value-addition-header">
                                                                                            <div className="header-content">
                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                                                                                                Value Addition
                                                                                            </div>
                                                                                            <span className="info-tooltip" title="AI-generated insights based on recent Google Search results.">ⓘ</span>
                                                                                        </h4>
                                                                                        <ul>{section.value_addition.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: marked.parse(item) }} />)}</ul>
                                                                                    </div>
                                                                                )}
                                                                                {section.deep_dive_analysis && (
                                                                                    <div className="detail-category deep-dive-category">
                                                                                        <h4>
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v1a2.5 2.5 0 0 1-5 0v-1A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.32 10.97a3.5 3.5 0 1 1-8.64 0"/><path d="M6 14c-2 3-2 5 2 5"/><path d="M18 14c2 3 2 5-2 5"/><path d="M12 14v7.5"/><path d="M9.5 7.5c-1.28-1.72-1.28-4.22 0-6"/><path d="M14.5 7.5c-1.28-1.72-1.28-4.22 0-6"/></svg>
                                                                                            Deep-Dive Analysis
                                                                                        </h4>
                                                                                        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(section.deep_dive_analysis) }} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'analysis' && (
                                <div className="tab-pane">
                                    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.detailed_analysis) }} />
                                </div>
                            )}
                             {activeTab === 'model' && (
                                <div className="tab-pane model-answer-tab">
                                    {!modelAnswerContent && !isGenerating && !generationError && (
                                        <div className="model-answer-prompt">
                                            <h3>Generate a Model Answer</h3>
                                            <p>Get a comprehensive, well-structured answer written by the AI to compare with your own.</p>
                                            <button onClick={handleGenerateModelAnswer} disabled={isGenerating} className="action-button primary">
                                                Generate Model Answer
                                            </button>
                                        </div>
                                    )}
                                    {isGenerating && <div className="loading-indicator"><div></div><div></div><div></div></div>}
                                    {generationError && <div className="error" role="alert">{generationError}</div>}
                                    {modelAnswerContent && (
                                        <>
                                            <div className="model-answer-actions">
                                                <button onClick={() => setIsComparing(!isComparing)} className="action-button secondary" disabled={!userAnswer.trim()}>
                                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"></path><path d="M8 12H4"></path><path d="M12 8H4"></path><path d="M20 14v4a2 2 0 0 1-2 2H9.83a2 2 0 0 1-1.41-.59l-2.83-2.82a2 2 0 0 1 0-2.82l2.83-2.83a2 2 0 0 1 1.41-.58H18a2 2 0 0 1 2 2Z"></path><path d="M14 18h-4"></path><path d="M16 14h-4"></path></svg>
                                                    {isComparing ? 'Show Model Answer Only' : 'Compare with Your Answer'}
                                                </button>
                                            </div>
                                            
                                            {isComparing ? (
                                                userAnswer.trim() ? (
                                                    <ComparisonView userAnswer={userAnswer} modelAnswer={modelAnswer!} />
                                                ) : (
                                                    <div className="model-answer-container">
                                                        <p>Could not extract your answer text to perform a comparison.</p>
                                                        <button onClick={() => setIsComparing(false)} className="action-button primary">Go Back</button>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="model-answer-content-container">
                                                    {modelAnswerContent.map((part, index) => {
                                                        if (part.type === 'text') {
                                                            const highlightedContent = part.content.replace(
                                                                /\+\+([\s\S]+?)\+\+/g,
                                                                (match, content) => `<strong>${content.trim()}</strong>`
                                                            );
                                                            return <div key={index} className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(highlightedContent) }} />;
                                                        }
                                                        if (part.type === 'diagram') {
                                                            return (
                                                                <div key={index} className="diagram-placeholder">
                                                                    {part.prompt}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="accordion-footer">
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            disabled={isDownloading}
                            className="action-button secondary"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="spinner-small"></div>
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    <span>Export Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
             {isExportModalOpen && (
                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    onDownloadMarkdown={handleDownloadMarkdown}
                    isDownloading={isDownloading}
                />
            )}
        </div>
    );
};

const ProgressBar: React.FC<{ percentage: number; status: string }> = ({ percentage, status }) => {
    return (
        <div className="card progress-container" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Evaluation Progress">
            <p className="progress-status">{status}</p>
            <div className="progress-bar-track">
                <div 
                    className="progress-bar-fill" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export const MainsApp: React.FC<{
    onEvaluationComplete?: (results: EvaluationResult[]) => void;
    initialData?: EvaluationResult[] | null;
}> = ({ onEvaluationComplete, initialData }) => {
    const [answerSheetFile, setAnswerSheetFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[] | null>(initialData || null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const [progress, setProgress] = useState<{ percentage: number; status: string } | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    
    const [strictness, setStrictness] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [deepDive, setDeepDive] = useState<boolean>(false);

    const [chat, setChat] = useState<GenAIChat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

    const chatHistoryRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI. Please check your API key setup.");
        }
    }, []);

    useEffect(() => {
        if (initialData) {
            setEvaluationResults(initialData);
        }
    }, [initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (allowedTypes.includes(file.type)) {
                setAnswerSheetFile(file);
                setError(null);
                setEvaluationResults(null);
                setChat(null);
                setChatHistory([]);
            } else {
                setError("Please upload a valid PDF, JPG, or PNG file.");
                setAnswerSheetFile(null);
            }
        }
        e.target.value = '';
    };
    
    const handleEvaluate = async () => {
        if (!answerSheetFile) {
            setError('Please upload your answer sheet file first.');
            return;
        }
        if (!aiRef.current) {
            setError('AI service is not initialized. Please refresh the page.');
            return;
        }

        setLoading(true);
        setError(null);
        setEvaluationResults(null);
        setChat(null);
        setChatHistory([]);
        
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        try {
            const results = await evaluateAnswerSheet(
                aiRef.current,
                answerSheetFile,
                strictness,
                deepDive,
                setProgress,
                progressIntervalRef
            );
            
            if (onEvaluationComplete) {
                onEvaluationComplete(results);
            }
            setEvaluationResults(results);

        } catch (err) {
            console.error(err);
            setError('An error occurred while evaluating the answer sheet. The AI might have had trouble parsing the file. Please ensure it is clear and legible.');
        } finally {
            setLoading(false);
            setProgress(null);
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        }
    };
    
    useEffect(() => {
        if (evaluationResults && aiRef.current) {
            const { chat: newChat, initialHistory } = createFollowUpChat(aiRef.current, evaluationResults);
            setChat(newChat);
            setChatHistory(initialHistory);
        }
    }, [evaluationResults]);


    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || !chat || isChatLoading) return;
        
        const message = chatInput.trim();
        setChatInput('');
        
        const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
        setChatHistory(updatedHistory);
        setIsChatLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message });
            let modelResponse = '';
            
            setChatHistory(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', content: modelResponse };
                    return newHistory;
                });
            }
        } catch (err) {
            console.error(err);
            setChatHistory(prev => [...prev, { role: 'model', content: 'Sorry, I ran into an error. Please try again.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);


    return (
        <>
            {loading && progress && <ProgressBar percentage={progress.percentage} status={progress.status} />}
            
            {error && <div className="card error" role="alert">{error}</div>}

            {!loading && !evaluationResults && (
                <div className="card aw-config-card">
                    <h2 className="font-serif">Mains Answer Evaluation</h2>
                    <p className="subtitle">Upload your answer sheet to get instant, in-depth feedback from our AI mentor.</p>
                    
                    {/* Section 1: Settings */}
                    <div className="aw-config-section">
                        <div className="section-header">
                            <span className="section-number">1</span>
                            <h3>Configure Evaluation</h3>
                        </div>
                        <div className="settings-panel">
                            <div className="aw-options-container">
                                <div className="form-group">
                                    <label>Strictness Level</label>
                                    <div className="segmented-control">
                                        <button className={strictness === 'Easy' ? 'active' : ''} onClick={() => setStrictness('Easy')}>Easy</button>
                                        <button className={strictness === 'Medium' ? 'active' : ''} onClick={() => setStrictness('Medium')}>Medium</button>
                                        <button className={strictness === 'Hard' ? 'active' : ''} onClick={() => setStrictness('Hard')}>Hard</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Analysis Depth</label>
                                    <div className="checkbox-group">
                                        <input type="checkbox" id="deepDiveCheckbox" checked={deepDive} onChange={(e) => setDeepDive(e.target.checked)} />
                                        <label htmlFor="deepDiveCheckbox">
                                            Deep-Dive
                                            <span className="tooltip-icon" title="Provides more granular feedback and connects your answer to broader syllabus themes.">?</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Upload */}
                    <div className="aw-config-section">
                        <div className="section-header">
                            <span className="section-number">2</span>
                            <h3>Upload Answer Sheet</h3>
                        </div>
                        {answerSheetFile ? (
                            <div className="file-preview-card">
                                <div className="file-preview-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </div>
                                <div className="file-preview-info">
                                    <span className="file-preview-name">{answerSheetFile.name}</span>
                                    <span className="file-preview-size">{(answerSheetFile.size / 1024).toFixed(2)} KB</span>
                                </div>
                                <button onClick={() => setAnswerSheetFile(null)} className="remove-file-button" aria-label="Remove selected file">&times;</button>
                            </div>
                        ) : (
                            <div className="file-upload-area">
                                <input type="file" id="fileUpload" accept="application/pdf,image/jpeg,image/png" onChange={handleFileChange} style={{ display: 'none' }} aria-label="Upload your answer sheet"/>
                                <label htmlFor="fileUpload" className="file-upload-label">
                                    <div className="upload-icon-wrapper">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    </div>
                                    <div>
                                        <span className="upload-text-main">Click to upload or drag & drop</span>
                                        <span className="upload-text-sub block">PDF, PNG, or JPG</span>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>
                    
                    {/* Action button */}
                    <div className="aw-action-section">
                         <button
                            className="action-button primary evaluate-button"
                            onClick={handleEvaluate}
                            disabled={!answerSheetFile}
                            aria-label="Evaluate Answer Sheet"
                        >
                            Evaluate Answer Sheet
                        </button>
                    </div>
                </div>
            )}

            {evaluationResults && evaluationResults.length > 0 && (
                <div className="aw-results-container">
                    <div className="output-section" aria-live="polite">
                        <div className="card">
                            <h2>Evaluation Results</h2>
                            <div className="accordion">
                                {aiRef.current && evaluationResults.map((result, index) => (
                                    <AccordionItem key={index} result={result} index={index} ai={aiRef.current!} />
                                ))}
                            </div>
                        </div>
                         {chat && (
                            <div className="card chat-card">
                                <h2>Follow-up Chat</h2>
                                <p className="chat-subtitle">Ask detailed questions about your performance across all answers.</p>
                                <div className="chat-history" ref={chatHistoryRef}>
                                    {chatHistory.map((msg, index) => (
                                         <div key={index} className={`chat-message-wrapper ${msg.role}-wrapper`}>
                                            <div className="avatar">
                                                {msg.role === 'model' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.09 8.26 20 9.27 15.55 13.97 16.91 20.02 12 17.27 7.09 20.02 8.45 13.97 4 9.27 9.91 8.26 12 2z"></path></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                )}
                                            </div>
                                            <div className={`chat-message ${msg.role}-message`}>
                                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                                            </div>
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="chat-message-wrapper model-wrapper">
                                            <div className="avatar">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.09 8.26 20 9.27 15.55 13.97 16.91 20.02 12 17.27 7.09 20.02 8.45 13.97 4 9.27 9.91 8.26 12 2z"></path></svg>
                                            </div>
                                            <div className="chat-message model-message loading-dots"><span></span><span></span><span></span></div>
                                        </div>
                                    )}
                                </div>
                                <div className="chat-input-area">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                        placeholder="e.g., How can I improve my conclusions?"
                                        aria-label="Chat input for follow-up questions"
                                        disabled={isChatLoading}
                                    />
                                    <button onClick={handleSendChatMessage} disabled={isChatLoading || !chatInput.trim()} aria-label="Send chat message">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};