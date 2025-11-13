import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type, Chat as GenAIChat } from "@google/genai";
import './Index.css';

declare var marked: any;

// === TYPE DEFINITIONS ===
type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

type ReportRecommendation = {
    report_name: string;
    key_recommendations: string[];
};

type DynamicDimension = {
    dimension_name: string;
    detailed_analysis: string; // Markdown formatted
    potential_questions: string[];
    sub_dimensions?: string[];
};

type PrelimsFactoid = {
    category: string;
    facts: string[];
};

export type NotesProResult = {
    topic: string;
    introduction: string;
    dynamic_analysis: DynamicDimension[];
    reports_and_recommendations?: ReportRecommendation[];
    prelims_facts: PrelimsFactoid[];
    keywords: string[];
    way_forward: string[];
    conclusion: string;
    related_pyqs: {
        prelims: string[];
        mains: string[];
    };
    sources?: Array<{ title: string; uri: string; }>;
};

const formatNotesResultAsMarkdown = (result: NotesProResult): string => {
    let content = `# Comprehensive Notes on: ${result.topic}\n\n`;
    content += `## Introduction\n${result.introduction}\n\n`;

    content += `## In-Depth Analysis\n`;
    result.dynamic_analysis.forEach(dim => {
        content += `### ${dim.dimension_name}\n`;
        content += `${dim.detailed_analysis}\n\n`;
    });
    
    if (result.reports_and_recommendations && result.reports_and_recommendations.length > 0) {
        content += `## Key Reports & Recommendations\n`;
        result.reports_and_recommendations.forEach(report => {
            content += `### ${report.report_name}\n- ${report.key_recommendations.join('\n- ')}\n\n`;
        });
    }

    if (result.prelims_facts?.length > 0) {
        content += `## High-Yield Prelims Facts\n`;
        result.prelims_facts.forEach(pf => {
            content += `### ${pf.category}\n- ${pf.facts.join('\n- ')}\n\n`;
        });
    }

    if (result.keywords?.length > 0) content += `## Keywords for Answers\n- ${result.keywords.join(', ')}\n\n`;

    content += `## Way Forward\n${result.way_forward.map(p => `- ${p}`).join('\n')}\n\n`;
    content += `## Conclusion\n${result.conclusion}\n\n`;

    content += `## Related Previous Year Questions (PYQs)\n\n`;
    if(result.related_pyqs?.prelims?.length > 0) content += `### Prelims\n${result.related_pyqs.prelims.map(p => `- ${p}`).join('\n')}\n\n`;
    if(result.related_pyqs?.mains?.length > 0) content += `### Mains\n${result.related_pyqs.mains.map(p => `- ${p}`).join('\n')}\n\n`;

    if (result.sources && result.sources.length > 0) {
        content += `## Sources\n`;
        result.sources.forEach(s => content += `- [${s.title || s.uri}](${s.uri})\n`);
        content += `\n`;
    }

    return content;
};


// === COMPONENTS ===

const AnalysisInProgress: React.FC<{ topic: string, isDeepResearch: boolean }> = ({ topic, isDeepResearch }) => {
    const [statusIndex, setStatusIndex] = useState(0);
    const [simulatedQuery, setSimulatedQuery] = useState('');
    const [foundSources, setFoundSources] = useState<string[]>([]);
    
    const steps = useMemo(() => [
        `Deconstructing topic: "${topic}"`,
        "Identifying key analytical dimensions...",
        "Searching Google for recent developments...",
        "Analyzing governmental policies...",
        "Cross-referencing with UPSC PYQs...",
        "Structuring comprehensive notes...",
        "Compiling high-yield facts for Prelims...",
        "Finalizing analysis and conclusion..."
    ], [topic]);

    const deepResearchSteps = useMemo(() => [
        `Deconstructing Core Concepts of "${topic}"`,
        "Formulating Advanced Search Queries...",
        "Analyzing Academic Journals via Google Scholar...",
        "Cross-referencing Governmental Reports from PIB & PRS...",
        "Identifying Conflicting Viewpoints from Editorials...",
        "Synthesizing Arguments into a Multi-dimensional Framework...",
        "Generating Potential Mains Questions for Each Dimension...",
        "Compiling Granular Data Points and Relevant Statistics...",
        "Structuring a Robust 'Way Forward'...",
        "Finalizing Exhaustive Deep-Dive Notes..."
    ], [topic]);

    const simulatedQueries = [
        `historical context of "${topic}"`,
        `socio-economic impact of "${topic}"`,
        `latest supreme court rulings on "${topic}"`,
        `"${topic}" government policies and schemes`,
        `ethical dimensions of "${topic}"`,
        `international best practices for "${topic}"`,
        `"${topic}" NITI Aayog report`,
    ];

    const simulatedSources = [
        "pib.gov.in",
        "thehindu.com",
        "indianexpress.com",
        "prsindia.org",
        "jstor.org",
        "epw.in",
        "orfonline.org",
        "rbi.org.in",
        "wikipedia.org",
        "worldbank.org",
        "niti.gov.in",
    ];

    const currentSteps = isDeepResearch ? deepResearchSteps : steps;
    const progressPercentage = Math.min(((statusIndex + 1) / currentSteps.length) * 100, 100);

    useEffect(() => {
        if (isDeepResearch) {
            const interval = setInterval(() => {
                setStatusIndex(prev => {
                    const nextIndex = prev + 1;
                    if (nextIndex < currentSteps.length) {
                        setSimulatedQuery(simulatedQueries[nextIndex % simulatedQueries.length].replace('[topic]', topic));
                        
                        if (nextIndex > 1) { // Start adding sources after the first step
                             setFoundSources(prevSources => {
                                const newSource = simulatedSources[Math.floor(Math.random() * simulatedSources.length)];
                                if (!prevSources.includes(newSource)) {
                                    return [...prevSources, newSource];
                                }
                                return prevSources;
                            });
                        }
                    }
                    return nextIndex;
                });
            }, 2500);
            return () => clearInterval(interval);
        } else {
             const interval = setInterval(() => {
                setStatusIndex(prev => prev + 1);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isDeepResearch, currentSteps.length]);
    
     if (!isDeepResearch) {
        return (
             <div className="notes-pro-loading-container">
                <div className="loading-visual">
                    <div className="loading-orb"></div>
                    <div className="loading-sparkle"></div>
                    <div className="loading-sparkle"></div>
                    <div className="loading-sparkle"></div>
                </div>
                <h3>AI is working...</h3>
                <div className="loading-status-carousel">
                    {steps.map((step, index) => (
                        <p key={index} className={index === (statusIndex % steps.length) ? 'active' : ''}>{step}</p>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="card deep-research-progress">
            <div className="drp-header">
                <h3>Deep Research in Progress...</h3>
                <div className="drp-progress-bar-container">
                    <div className="drp-progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
            <div className="drp-single-column-content">
                <p className="drp-main-status">{currentSteps[statusIndex % currentSteps.length]}</p>
                
                <div className="drp-current-action">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span>{simulatedQuery || 'Initializing search...'}</span>
                </div>
                
                {foundSources.length > 0 && (
                    <div className="drp-sources-section">
                        <h4>Sources Analyzed</h4>
                        <div className="drp-sources-grid">
                            {foundSources.map((source, index) => (
                                <span key={index} className="drp-source-tag">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                    {source}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AnalysisConfig: React.FC<{
    onGenerate: (topic: string, isDeepResearch: boolean) => void;
    isLoading: boolean;
    initialTopic?: string | null;
}> = ({ onGenerate, isLoading, initialTopic }) => {
    const [topic, setTopic] = useState(initialTopic || '');
    const [isDeepResearch, setIsDeepResearch] = useState(false);

    useEffect(() => {
        if (initialTopic) {
            setTopic(initialTopic);
        }
    }, [initialTopic]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onGenerate(topic.trim(), isDeepResearch);
        }
    };

    return (
        <div className="card pyq-config-container">
            <h2>Notes Pro</h2>
            <div className="notes-pro-mode-tabs">
                <button className={`mode-tab-button ${!isDeepResearch ? 'active' : ''}`} onClick={() => setIsDeepResearch(false)}>
                    Simple Notes
                </button>
                <button className={`mode-tab-button ${isDeepResearch ? 'active' : ''}`} onClick={() => setIsDeepResearch(true)}>
                    Deep Research
                </button>
            </div>
            <p className="subtitle">
                {isDeepResearch
                    ? "Uses Gemini 2.5 Pro for an exhaustive, multi-dimensional analysis suitable for complex topics. Generation takes longer."
                    : "Generate comprehensive notes, enriched with the latest data and relevant PYQs using Gemini Flash."
                }
            </p>
            <form onSubmit={handleSubmit} className="pyq-config-form">
                 <div className="form-group">
                    <label htmlFor="topic-input">Syllabus Topic</label>
                    <textarea
                        id="topic-input"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g., 'Judicial Review', 'Insolvency and Bankruptcy Code', 'Climate Change'"
                        rows={3}
                        required
                    />
                </div>
                <button type="submit" className="action-button primary" disabled={isLoading || !topic.trim()}>
                    {isLoading ? 'Generating Notes...' : 'Generate Notes'}
                </button>
            </form>
        </div>
    );
};


const SimpleNoteSection: React.FC<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    tag?: string; 
    actions?: React.ReactNode;
}> = ({ title, isOpen, onToggle, children, tag, actions }) => {
    return (
        <div className="accordion-item">
            <button className="accordion-header" onClick={onToggle} aria-expanded={isOpen}>
                <span className="accordion-title">
                    {title}
                    {tag && <span className="pyq-badge" style={{marginLeft: '0.5rem', verticalAlign: 'middle'}}>{tag}</span>}
                </span>
                {actions && <div className="accordion-actions" onClick={e => e.stopPropagation()}>{actions}</div>}
                <span className="accordion-icon">{isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                )}</span>
            </button>
            {isOpen && (
                <div className="accordion-content">
                    <div className="accordion-main-content">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const SimpleView: React.FC<{ 
    result: NotesProResult;
    onExpandDimension: (dimensionName: string) => void;
    expandingDimension: string | null;
    expandedSubDimension: string | null;
}> = ({ result, onExpandDimension, expandingDimension, expandedSubDimension }) => {
    const [openSection, setOpenSection] = useState<string | null>('Introduction');

    const toggleSection = (sectionTitle: string) => {
        setOpenSection(prev => prev === sectionTitle ? null : sectionTitle);
    };

    return (
        <div className="accordion" style={{marginTop: '2rem'}}>
            <SimpleNoteSection title="Introduction" isOpen={openSection === 'Introduction'} onToggle={() => toggleSection('Introduction')}>
                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.introduction) }} />
            </SimpleNoteSection>
            
            <SimpleNoteSection title="In-Depth Analysis" isOpen={openSection === 'In-Depth Analysis'} onToggle={() => toggleSection('In-Depth Analysis')}>
                {result.dynamic_analysis.map(dim => {
                    const isExpanded = expandedSubDimension === dim.dimension_name;
                    return (
                        <div className="report-subsection" key={dim.dimension_name}>
                            <div className="dimension-header">
                                <h4>{dim.dimension_name}</h4>
                                <button className="action-button secondary expand-button" onClick={() => onExpandDimension(dim.dimension_name)} disabled={!!expandingDimension}>
                                    {expandingDimension === dim.dimension_name 
                                        ? <div className="spinner-small" /> 
                                        : (isExpanded && dim.sub_dimensions) ? 'Collapse' : 'Expand'
                                    }
                                </button>
                            </div>
                            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(dim.detailed_analysis) }} />
                            {isExpanded && dim.sub_dimensions && (
                                <div className="sub-dimensions-container">
                                    <h5>Sub-Dimensions</h5>
                                    <ul>
                                        {dim.sub_dimensions.map((sub, i) => <li key={i}>{sub}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </SimpleNoteSection>

            {result.reports_and_recommendations && result.reports_and_recommendations.length > 0 &&
                <SimpleNoteSection title="Key Reports & Recommendations" isOpen={openSection === 'Key Reports & Recommendations'} onToggle={() => toggleSection('Key Reports & Recommendations')}>
                     <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {result.reports_and_recommendations.map((item, i) => (
                            <div className="key-concept-item" key={i}>
                                <h4 style={{marginTop: 0}}>{item.report_name}</h4>
                                <ul style={{paddingLeft: '1.25rem', margin: 0}}>{item.key_recommendations.map((rec, j) => <li key={j} style={{marginBottom: '0.5rem'}}>{rec}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                </SimpleNoteSection>
            }
            
            {result.prelims_facts?.length > 0 &&
                <SimpleNoteSection title="High-Yield Prelims Facts" isOpen={openSection === 'High-Yield Prelims Facts'} onToggle={() => toggleSection('High-Yield Prelims Facts')}>
                     {result.prelims_facts.map((item, i) => (
                        <div className="report-subsection" key={i}>
                            <h4>{item.category}</h4>
                            <ul>{item.facts.map((f, j) => <li key={j}>{f}</li>)}</ul>
                        </div>
                    ))}
                </SimpleNoteSection>
            }
            
             {result.keywords?.length > 0 &&
                <SimpleNoteSection title="Keywords" isOpen={openSection === 'Keywords'} onToggle={() => toggleSection('Keywords')}>
                    <ul className="keyword-list">{result.keywords.map((k, i) => <li key={i}>{k}</li>)}</ul>
                </SimpleNoteSection>
            }

            <SimpleNoteSection title="Way Forward" isOpen={openSection === 'Way Forward'} onToggle={() => toggleSection('Way Forward')}>
                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.way_forward.map(p => `- ${p}`).join('\n')) }} />
            </SimpleNoteSection>

             <SimpleNoteSection title="Conclusion" isOpen={openSection === 'Conclusion'} onToggle={() => toggleSection('Conclusion')}>
                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.conclusion) }} />
            </SimpleNoteSection>
            
            <SimpleNoteSection title="Related PYQs" isOpen={openSection === 'Related PYQs'} onToggle={() => toggleSection('Related PYQs')}>
                <div className="pyq-box">
                    {result.related_pyqs?.mains?.length > 0 && (
                        <>
                            <h5>Mains</h5>
                            <ul className="pyq-list">
                                {result.related_pyqs.mains.map((q, i) => <li key={`mains-${i}`}>{q}</li>)}
                            </ul>
                        </>
                    )}
                     {result.related_pyqs?.prelims?.length > 0 && (
                        <>
                            <h5 style={{marginTop: result.related_pyqs?.mains?.length > 0 ? '1.5rem' : '0' }}>Prelims</h5>
                            <ul className="pyq-list">
                                {result.related_pyqs.prelims.map((q, i) => <li key={`prelims-${i}`}>{q}</li>)}
                            </ul>
                        </>
                     )}
                     {(!result.related_pyqs || (result.related_pyqs.prelims?.length === 0 && result.related_pyqs.mains?.length === 0)) && (
                        <p>No specific PYQs found for this exact topic in the recent past.</p>
                     )}
                </div>
            </SimpleNoteSection>

            {result.sources && result.sources.length > 0 &&
                <SimpleNoteSection title="Sources" isOpen={openSection === 'Sources'} onToggle={() => toggleSection('Sources')}>
                    <ul className="sources-list">
                        {result.sources.map((source, i) => (
                            <li key={i}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer">
                                    {source.title || new URL(source.uri).hostname}
                                </a>
                            </li>
                        ))}
                    </ul>
                </SimpleNoteSection>
            }
        </div>
    );
};

const AnalysisResults: React.FC<{
    result: NotesProResult;
    onReset: () => void;
    onUpdateResult: (result: NotesProResult) => void;
    ai: GoogleGenAI;
}> = ({ result, onReset, onUpdateResult, ai }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [expandingDimension, setExpandingDimension] = useState<string | null>(null);
    const [expandedSubDimension, setExpandedSubDimension] = useState<string | null>(null);

    // Follow-up Chat states
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isChatFullscreen, setIsChatFullscreen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView();
    }, [chatHistory, isChatLoading]);


    const handleExpandDimension = async (dimensionNameToExpand: string) => {
        const dimension = result.dynamic_analysis.find(d => d.dimension_name === dimensionNameToExpand);
        if (dimension?.sub_dimensions) {
            setExpandedSubDimension(prev => prev === dimensionNameToExpand ? null : dimensionNameToExpand);
            return;
        }

        setExpandingDimension(dimensionNameToExpand);
        try {
            const prompt = `Given the main topic "${result.topic}" and the dimension "${dimensionNameToExpand}", generate a list of 3-5 more granular sub-dimensions that fall under it. Return as a JSON array of simple strings. Example: ["Sub-dimension A", "Sub-dimension B"]`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            });
            const subDimensions = JSON.parse(response.text);

            const newResult = { ...result };
            const newDynamicAnalysis = newResult.dynamic_analysis.map(dim => 
                dim.dimension_name === dimensionNameToExpand 
                    ? { ...dim, sub_dimensions: subDimensions } 
                    : dim
            );
            
            onUpdateResult({ ...newResult, dynamic_analysis: newDynamicAnalysis });
            setExpandedSubDimension(dimensionNameToExpand);

        } catch (err) {
            console.error("Failed to expand dimension", err);
            alert("Failed to expand dimension. Please try again.");
        } finally {
            setExpandingDimension(null);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        const message = chatInput.trim();
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', content: message }]);
        setIsChatLoading(true);
    
        const context = formatNotesResultAsMarkdown(result);
        const systemInstruction = `You are an expert UPSC mentor specializing in deep analysis. The user is reviewing a set of AI-generated notes on the topic "${result.topic}". The full notes are provided below as context. Your primary role is to answer the user's follow-up questions.
    
**CRITICAL INSTRUCTIONS:**
1.  **Answer from Context:** Base your answers primarily on the provided notes context.
2.  **Expand and Deepen:** When the user asks to "expand a dimension," "introduce more dimensions," or asks for more detail, you MUST provide a more granular breakdown, generate new sub-dimensions, or provide a deeper analysis.
3.  **Use Web Search for Updates:** For questions requiring the latest information, key reports, or recommendations, you MUST use Google Search to provide the most up-to-date and relevant answers.
4.  **Clarity and Structure:** Format your responses using clear Markdown (headings, lists, bold text) for readability.
    
CONTEXT:
${context}`;
    
        const historyForGenAI = chatHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
    
        const contents = [...historyForGenAI, { role: 'user', parts: [{ text: message }] }];
    
        try {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents,
                config: {
                    systemInstruction,
                    tools: [{ googleSearch: {} }]
                }
            });
            
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
        } catch (error) {
            console.error("Follow-up chat error:", error);
            setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, an error occurred. Please try again." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleExport = () => {
        setIsDownloading(true);
        const markdownContent = formatNotesResultAsMarkdown(result);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Notes_${result.topic.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };

    return (
        <>
            <div className="notes-pro-results-container">
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Notes Pro: {result.topic}</h2>
                    <p className="subtitle" style={{ maxWidth: '650px', margin: '0 auto 2rem auto' }}>{result.introduction}</p>
                </div>

                <SimpleView 
                    result={result} 
                    onExpandDimension={handleExpandDimension} 
                    expandingDimension={expandingDimension} 
                    expandedSubDimension={expandedSubDimension}
                />
                
                <div className="results-actions" style={{ marginTop: '2rem', justifyContent: 'center' }}>
                    <button className="action-button secondary" onClick={handleExport} disabled={isDownloading}>
                        {isDownloading ? 'Exporting...' : 'Export Notes'}
                    </button>
                    <button className="action-button primary" onClick={onReset}>Generate New Notes</button>
                </div>
            </div>
            
             <div className={`notes-pro-chat-container ${isChatFullscreen ? 'fullscreen' : ''}`}>
                <h3>
                    Follow-up Chat
                    <button 
                        className="fullscreen-toggle-btn" 
                        onClick={() => setIsChatFullscreen(!isChatFullscreen)}
                        title={isChatFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                        {isChatFullscreen 
                            ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                        }
                    </button>
                </h3>
                <p className="chat-subtitle">Ask clarifying questions or request more details about the analysis.</p>
                <div className="chat-history">
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
                    <div ref={chatEndRef} />
                </div>
                <div className="chat-input-area">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        placeholder="e.g., Explain the 'Ethical Dimension' in more detail..."
                        disabled={isChatLoading}
                    />
                    <button onClick={handleSendChatMessage} disabled={isChatLoading || !chatInput.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </>
    );
};


export const NotesProApp: React.FC<{
    onAnalysisComplete?: (result: NotesProResult) => void;
    initialData?: NotesProResult | null;
    initialTopic?: string | null;
}> = ({ onAnalysisComplete, initialData, initialTopic }) => {
    const [analysisResult, setAnalysisResult] = useState<NotesProResult | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentAnalysisConfig, setCurrentAnalysisConfig] = useState<{topic: string, isDeepResearch: boolean} | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service. Please check your API key setup.");
        }
    }, []);

    const handleGenerateAnalysis = async (topic: string, isDeepResearch: boolean) => {
        if (!aiRef.current) {
            setError('AI Service not initialized.');
            return;
        }
        setCurrentAnalysisConfig({ topic, isDeepResearch });
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        const model = isDeepResearch ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        
        const config: any = {
            tools: [{ googleSearch: {} }],
        };

        if (isDeepResearch) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        const standardPrompt = `You are a UPSC subject matter expert creating comprehensive notes. Your task is to generate a 360-degree view of the topic, suitable for both Prelims and Mains.

**Topic for Notes:** "${topic}"

**CORE DIRECTIVE: DYNAMIC DIMENSIONAL ANALYSIS**
1.  **Identify Domain:** First, identify the primary domain of the topic (e.g., Polity, Economy, Science & Tech, History, Social Issue, IR).
2.  **Generate Dynamic Dimensions:** Based on the domain, generate 5-7 **highly relevant analytical dimensions** to provide a complete view. **DO NOT use a fixed, generic template.** The dimensions must be specific and logical for the given topic. For example:
    *   If the topic is 'Artificial Intelligence', dimensions could be 'Core Technology & Principles', 'Applications Across Sectors', 'Economic Impact', 'Ethical & Social Dilemmas', 'Global Regulatory Landscape'.
    *   If the topic is 'Bhakti Movement', dimensions could be 'Socio-Religious Context and Origins', 'Key Philosophies and Proponents', 'Impact on Regional Literature and Art', 'Role in Social Reform', 'Legacy and Relevance Today'.
3.  **Detailed Content:** For each dimension, provide a detailed analysis formatted using **Markdown** (headings, sub-headings, lists). You MUST also generate potential Mains questions for each dimension. Use Google Search extensively to ensure all information is accurate, up-to-date, and includes specific data, examples, committee names, etc.
4.  **Optional Section: Reports & Recommendations:** If the topic is related to policy, governance, social issues, economy, or similar domains, you MUST include a \`reports_and_recommendations\` section. Use Google Search to find 2-4 major national or international reports, committee recommendations, or landmark judicial rulings relevant to the topic. For each, provide the name and list its key recommendations or findings. If the topic is purely historical or conceptual (e.g., 'The Bhakti Movement'), you MUST provide an empty array \`[]\` for this field.
5.  **Strict JSON Output:** Your entire response MUST be a single, valid JSON object and nothing else. Do not include any text, comments, or markdown formatting (like \`\`\`json\`) outside of this JSON structure. Your response must conform to this exact JSON structure:
{
    "topic": "The user-provided topic string",
    "introduction": "A concise, engaging introduction to the topic.",
    "dynamic_analysis": [
        {
            "dimension_name": "Name of the analytical dimension (e.g., 'Economic Impact')",
            "detailed_analysis": "A detailed analysis for this dimension, formatted with Markdown.",
            "potential_questions": [
                "A potential Mains question related to this dimension."
            ]
        }
    ],
    "reports_and_recommendations": [
        {
            "report_name": "Name of the report or committee (e.g., '2nd ARC Report')",
            "key_recommendations": [
                "A key recommendation or finding."
            ]
        }
    ],
    "prelims_facts": [
        {
            "category": "Category of facts (e.g., 'Key Constitutional Articles')",
            "facts": [
                "A specific, high-yield fact for Prelims."
            ]
        }
    ],
    "keywords": [
        "A relevant keyword for answer writing."
    ],
    "way_forward": [
        "A specific, actionable point for the way forward."
    ],
    "conclusion": "A balanced and forward-looking conclusion.",
    "related_pyqs": {
        "prelims": [
            "A relevant Prelims PYQ."
        ],
        "mains": [
            "A relevant Mains PYQ."
        ]
    }
}`;

        const deepResearchPrompt = `You are a world-class UPSC exam analyst and subject matter expert, leveraging the advanced reasoning capabilities of Gemini 2.5 Pro. Your task is to perform an exhaustive "deep research" analysis of a given topic, generating comprehensive, multi-dimensional notes suitable for a top-ranking aspirant.

**Topic for Deep Research:** "${topic}"

**CRITICAL DIRECTIVES:**
1.  **Dynamic & Context-Aware Dimensional Analysis:**
    *   First, deeply analyze the core nature of the topic. Is it primarily political, economic, social, technological, ethical, historical, or a combination?
    *   Based on this analysis, you MUST generate at least 8-10 highly relevant, specific, and analytical dimensions. **Avoid generic PESTLE dimensions.** The dimensions must be tailored to the nuances of "${topic}". For example, for 'Artificial Intelligence', instead of just 'Technological', use dimensions like 'Algorithmic Bias and Fairness', 'Impact on Geopolitics and Warfare', 'Philosophical and Existential Questions'.
    *   For each dimension, provide a detailed, well-structured analysis using **Markdown**. Use headings, sub-headings, and bullet points. Your analysis must be substantiated with facts, examples, and data.
    *   For each dimension, also generate 1-2 potential Mains questions that could be asked from that specific dimension.

2.  **Comprehensive Coverage:** Your analysis must include both positive and negative aspects, challenges and opportunities, and historical and future perspectives.
3.  **Extensive Research:** You MUST use Google Search extensively to find the latest data, reports, committee recommendations, Supreme Court judgments, and international best practices relevant to the topic.
4.  **Strict JSON Output:** Your entire response MUST be a single, valid JSON object and nothing else. Do not include any text, comments, or markdown formatting (like \`\`\`json\`) outside of this JSON structure.
5.  **JSON Structure**: The output must conform to the provided schema. Ensure all fields are populated with rich, detailed content.`;

        const prompt = (isDeepResearch ? deepResearchPrompt : standardPrompt) + `\n\nYour JSON response must be structured like this:
        {
            "topic": "string",
            "introduction": "string",
            "dynamic_analysis": [
                {
                    "dimension_name": "string",
                    "detailed_analysis": "string (Markdown)",
                    "potential_questions": ["string"]
                }
            ],
            "reports_and_recommendations": [
                {
                    "report_name": "string",
                    "key_recommendations": ["string"]
                }
            ],
            "prelims_facts": [
                {
                    "category": "string",
                    "facts": ["string"]
                }
            ],
            "keywords": ["string"],
            "way_forward": ["string"],
            "conclusion": "string",
            "related_pyqs": {
                "prelims": ["string"],
                "mains": ["string"]
            }
        }`;


        try {
            const response = await aiRef.current.models.generateContent({ model, contents: prompt, config });
            
            if (!response || !response.text) {
                throw new Error("The AI returned an empty or invalid response. This can happen due to safety filters or if the topic is too complex. Please try rephrasing your topic.");
            }

            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web) || [];
            // FIX: Explicitly typed the Map generic to help TypeScript infer the correct type for .values(), which was being inferred as unknown[].
            const uniqueSources: Array<{ title: string; uri: string; }> = Array.from(
                new Map<string, { title: string; uri: string; }>(groundingChunks.map((item: any) => [item.web.uri, { uri: item.web.uri, title: item.web.title || new URL(item.web.uri).hostname }]))
                .values()
            );

            let jsonString = response.text.trim();
            const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            if (jsonMatch) {
                jsonString = jsonMatch[1] || jsonMatch[2];
            }

            const resultData: NotesProResult = JSON.parse(jsonString);
            const finalResult = { ...resultData, topic, sources: uniqueSources };

            setAnalysisResult(finalResult);

            if (onAnalysisComplete) {
                onAnalysisComplete(finalResult);
            }

        } catch (err: any) {
            console.error("Notes Pro Failed:", err);
            let errorMessage = "Sorry, an error occurred while generating the notes. Please try again later.";
            if (err.message && err.message.includes('empty or invalid response')) {
                errorMessage = err.message;
            } else if (err.message && err.message.includes('JSON')) {
                 errorMessage = "The AI returned an invalid format. Please try again, as this can sometimes be a temporary issue.";
            } else if (err.toString().includes('400')) {
                errorMessage = `The request to the AI failed. It's possible the topic was too broad or ambiguous. Please try again with a more specific topic. (Error: ${err.message})`;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
        setCurrentAnalysisConfig(null);
    };

    return (
        <div className="pyq-container">
            {error && <div className="card error" role="alert">{error}</div>}
            
            {isLoading && currentAnalysisConfig ? (
                <AnalysisInProgress topic={currentAnalysisConfig.topic} isDeepResearch={currentAnalysisConfig.isDeepResearch} />
            ) : analysisResult && aiRef.current ? (
                <AnalysisResults result={analysisResult} onReset={handleReset} onUpdateResult={setAnalysisResult} ai={aiRef.current}/>
            ) : (
                <AnalysisConfig onGenerate={handleGenerateAnalysis} isLoading={isLoading} initialTopic={initialTopic} />
            )}
        </div>
    );
};