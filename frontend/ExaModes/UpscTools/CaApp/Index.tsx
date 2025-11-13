import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type, Chat as GenAIChat } from "@google/genai";
import './Index.css';

declare var marked: any;

// === TYPE DEFINITIONS ===

type TimelineEvent = {
    date: string;
    event: string;
};

type StakeholderAnalysis = {
    name: string;
    role: string;
    interests: string;
    influence: string;
};

type DynamicDimension = {
    dimension_name: string;
    detailed_analysis: string; // Markdown formatted string
    potential_questions: string[];
};

type PrelimsFacts = {
    key_terms_and_definitions: string[];
    reports_and_indices: string[];
    committees_and_bodies: string[];
    legal_and_constitutional_provisions: string[];
    miscellaneous_facts: string[];
};

type DetailedWayForwardPoint = {
    recommendation: string;
    justification: string;
    implementation_challenges: string;
};

type RelatedPyqs = {
    prelims: string[];
    mains: string[];
};

type LegalProvision = {
    provision: string;
    description: string;
};

type CoreIssue = {
    issue: string;
    pros: string[];
    cons: string[];
};

type EthicalDilemma = {
    dilemma: string;
    values_in_conflict: string[];
};

type DataPoint = {
    statistic: string;
    source: string;
    relevance: string;
};

type GovernmentInitiative = {
    name: string;
    objective: string;
    key_features: string[];
};

type InternationalComparison = {
    country_or_org: string;
    approach_or_comparison: string;
};

type WayForwardStructure = {
    short_term: DetailedWayForwardPoint[];
    long_term: DetailedWayForwardPoint[];
};

type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export type ChronoScoutResult = {
    topic: string;
    summary: string;
    timeline: TimelineEvent[];
    historical_context: string;
    constitutional_and_legal_provisions: LegalProvision[];
    government_initiatives: GovernmentInitiative[];
    key_stakeholders_analysis: StakeholderAnalysis[];
    dynamic_dimensions: DynamicDimension[];
    prelims_facts: PrelimsFacts;
    core_issue_analysis: CoreIssue[];
    ethical_dilemmas: EthicalDilemma[];
    technological_dimensions: string[];
    international_perspective: InternationalComparison[];
    key_data_and_statistics: DataPoint[];
    future_outlook: string;
    keywords: string[];
    way_forward: WayForwardStructure;
    related_pyqs: RelatedPyqs;
};


const formatCaResultAsMarkdown = (result: ChronoScoutResult): string => {
    let content = `# ChronoScout Analysis: ${result.topic}\n\n`;
    content += `**Summary:** ${result.summary}\n\n`;

    if (Array.isArray(result.timeline) && result.timeline.length > 0) {
        content += `## Timeline of Key Events\n`;
        result.timeline.forEach(t => content += `- **${t.date}:** ${t.event}\n`);
        content += `\n`;
    }
    
    content += `## Historical Context\n${result.historical_context}\n\n`;

    if (Array.isArray(result.constitutional_and_legal_provisions) && result.constitutional_and_legal_provisions.length > 0) {
        content += `## Constitutional & Legal Provisions\n`;
        result.constitutional_and_legal_provisions.forEach(p => content += `- **${p.provision}:** ${p.description}\n`);
        content += `\n`;
    }
    
    if (Array.isArray(result.government_initiatives) && result.government_initiatives.length > 0) {
        content += `## Government Initiatives & Policies\n`;
        result.government_initiatives.forEach(i => content += `### ${i.name}\n- **Objective:** ${i.objective}\n- **Key Features:**\n  - ${Array.isArray(i.key_features) ? i.key_features.join('\n  - ') : ''}\n\n`);
    }

    if (Array.isArray(result.key_stakeholders_analysis) && result.key_stakeholders_analysis.length > 0) {
        content += `## Key Stakeholders Analysis\n`;
        result.key_stakeholders_analysis.forEach(s => content += `- **${s.name} (${s.role}):**\n  - **Interests:** ${s.interests}\n  - **Influence:** ${s.influence}\n`);
        content += `\n`;
    }

    if (Array.isArray(result.dynamic_dimensions) && result.dynamic_dimensions.length > 0) {
        content += `## Multi-Dimensional Analysis\n`;
        result.dynamic_dimensions.forEach(dim => {
            content += `### ${dim.dimension_name}\n${dim.detailed_analysis}\n`;
            if (Array.isArray(dim.potential_questions) && dim.potential_questions.length > 0) {
                content += `\n**Potential Questions:**\n- ${dim.potential_questions.join('\n- ')}\n`;
            }
            content += `\n`;
        });
    }
    
    if (Array.isArray(result.core_issue_analysis) && result.core_issue_analysis.length > 0) {
        content += `## Core Issue Analysis\n`;
        result.core_issue_analysis.forEach(issue => {
            content += `### ${issue.issue}\n- **Arguments For:**\n  - ${Array.isArray(issue.pros) ? issue.pros.join('\n  - ') : ''}\n- **Arguments Against:**\n  - ${Array.isArray(issue.cons) ? issue.cons.join('\n  - ') : ''}\n\n`;
        });
    }

    if (Array.isArray(result.technological_dimensions) && result.technological_dimensions.length > 0) {
        content += `## Technological Dimensions\n- ${result.technological_dimensions.join('\n- ')}\n\n`;
    }

    if (Array.isArray(result.international_perspective) && result.international_perspective.length > 0) {
        content += `## International Perspective & Global Comparisons\n`;
        result.international_perspective.forEach(i => content += `- **${i.country_or_org}:** ${i.approach_or_comparison}\n`);
        content += `\n`;
    }

    if (result.prelims_facts) {
        content += `## High-Yield Facts for Prelims\n`;
        const prelimsF = result.prelims_facts;
        if (Array.isArray(prelimsF.key_terms_and_definitions) && prelimsF.key_terms_and_definitions.length > 0) content += `### Key Terms\n- ${prelimsF.key_terms_and_definitions.join('\n- ')}\n`;
        if (Array.isArray(prelimsF.legal_and_constitutional_provisions) && prelimsF.legal_and_constitutional_provisions.length > 0) content += `### Legal Provisions mentioned in brief\n- ${prelimsF.legal_and_constitutional_provisions.join('\n- ')}\n`;
        if (Array.isArray(prelimsF.reports_and_indices) && prelimsF.reports_and_indices.length > 0) content += `### Reports & Indices\n- ${prelimsF.reports_and_indices.join('\n- ')}\n`;
        if (Array.isArray(prelimsF.committees_and_bodies) && prelimsF.committees_and_bodies.length > 0) content += `### Committees & Bodies\n- ${prelimsF.committees_and_bodies.join('\n- ')}\n`;
        if (Array.isArray(prelimsF.miscellaneous_facts) && prelimsF.miscellaneous_facts.length > 0) content += `### Miscellaneous\n- ${prelimsF.miscellaneous_facts.join('\n- ')}\n`;
        content += `\n`;
    }

    if (Array.isArray(result.key_data_and_statistics) && result.key_data_and_statistics.length > 0) {
        content += `## Key Data & Statistics\n`;
        result.key_data_and_statistics.forEach(d => content += `- **${d.statistic}** (Source: ${d.source}) - Relevance: ${d.relevance}\n`);
        content += `\n`;
    }
    
    if (result.future_outlook) {
        content += `## Future Outlook\n${result.future_outlook}\n\n`;
    }

    if (Array.isArray(result.keywords) && result.keywords.length > 0) {
        content += `## Keywords & Terminology\n- ${result.keywords.join(', ')}\n\n`;
    }

    if (result.way_forward) {
        content += `## Way Forward\n`;
        if (Array.isArray(result.way_forward.short_term) && result.way_forward.short_term.length > 0) {
            content += `### Short-Term Recommendations\n`;
            result.way_forward.short_term.forEach(wf => content += `- **${wf.recommendation}:** ${wf.justification}\n  - *Implementation Challenges:* ${wf.implementation_challenges}\n`);
        }
        if (Array.isArray(result.way_forward.long_term) && result.way_forward.long_term.length > 0) {
            content += `\n### Long-Term Recommendations\n`;
            result.way_forward.long_term.forEach(wf => content += `- **${wf.recommendation}:** ${wf.justification}\n  - *Implementation Challenges:* ${wf.implementation_challenges}\n`);
        }
        content += `\n`;
    }

    // Safely handle related PYQs
    if (result.related_pyqs) {
        const prelims = result.related_pyqs.prelims;
        const mains = result.related_pyqs.mains;

        const hasPrelims = Array.isArray(prelims) && prelims.length > 0;
        const hasMains = Array.isArray(mains) && mains.length > 0;

        if (hasPrelims || hasMains) {
            content += `## Related Previous Year Questions\n\n`;
        }

        if (hasPrelims) {
            content += `### Prelims\n${prelims.map(p => `- ${p}`).join('\n')}\n\n`;
        }
        if (hasMains) {
            content += `### Mains\n${mains.map(p => `- ${p}`).join('\n')}\n\n`;
        }
    }

    return content;
};


// === MAIN COMPONENTS ===

const AnalysisConfig: React.FC<{
    onGenerate: (topic: string) => void;
    isLoading: boolean;
}> = ({ onGenerate, isLoading }) => {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onGenerate(topic.trim());
        }
    };

    return (
        <div className="card pyq-config-container">
            <h2>ChronoScout: Current Affairs Analyst</h2>
            <p className="subtitle">Get a 360-degree strategic breakdown of any current affairs topic for both Prelims and Mains.</p>
            <form onSubmit={handleSubmit} className="pyq-config-form">
                <div className="form-group">
                    <label htmlFor="topic-input">Current Affairs Topic</label>
                    <textarea
                        id="topic-input"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g., 'Israel-Palestine Conflict', 'Uniform Civil Code', 'G20 Summit Outcomes'"
                        rows={3}
                        required
                    />
                </div>
                <button type="submit" className="action-button primary" disabled={isLoading || !topic.trim()}>
                    {isLoading ? 'Analyzing...' : 'Generate Analysis'}
                </button>
            </form>
        </div>
    );
};


const GeneratedContentModal: React.FC<{ title: string; content: string; onCopy: () => void; onClose: () => void; }> = ({ title, content, onCopy, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{title}</h2>
                <div className="generated-content-modal">
                    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(content) }}></div>
                </div>
                <div className="modal-actions">
                    <button className="modal-button secondary" onClick={onCopy}>Copy</button>
                    <button className="modal-button primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

const AnalysisResults: React.FC<{
    result: ChronoScoutResult;
    ai: GoogleGenAI;
    onReset: () => void;
}> = ({ result, ai, onReset }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    
    // States for interactive features
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState<string | null>(null);
    const [isGeneratingMains, setIsGeneratingMains] = useState(false);
    const [generatedMains, setGeneratedMains] = useState<string | null>(null);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatInstanceRef = useRef<GenAIChat | null>(null);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleExport = () => {
        setIsDownloading(true);
        const markdownContent = formatCaResultAsMarkdown(result);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ChronoScout_Analysis_${result.topic.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };
    
    const handleGenerateQuiz = async () => {
        setIsGeneratingQuiz(true);
        setGeneratedQuiz(null);
        const fullContext = formatCaResultAsMarkdown(result);
        const prompt = `Based on the following detailed analysis of the topic "${result.topic}", generate a 5-question multiple-choice quiz. The questions should test understanding of the key facts, concepts, and implications discussed in the text. Format the output as a clean markdown list. For each question, provide the correct answer on the line immediately after the options, prefixed with '**Answer:**'.\n\nCONTEXT:\n${fullContext}`;
        
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setGeneratedQuiz(response.text);
        } catch (err) {
            setGeneratedQuiz("Error generating quiz.");
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleGenerateMains = async () => {
        setIsGeneratingMains(true);
        setGeneratedMains(null);
        const fullContext = formatCaResultAsMarkdown(result);
        const prompt = `Based on the following detailed analysis of the topic "${result.topic}", generate one relevant and thought-provoking UPSC Mains question. The question should be analytical and reflect the complexity of the topic. The question should be between 150-250 words.\n\nCONTEXT:\n${fullContext}`;
        
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setGeneratedMains(response.text);
        } catch (err) {
            setGeneratedMains("Error generating question.");
        } finally {
            setIsGeneratingMains(false);
        }
    };

     const handleSendChatMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        
        const message = chatInput.trim();
        setChatInput('');
        
        const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
        setChatHistory(updatedHistory);
        setIsChatLoading(true);

        if (!chatInstanceRef.current) {
            const fullContext = formatCaResultAsMarkdown(result);
            const systemInstruction = `You are a helpful AI assistant. The user has just read a detailed analysis on the topic "${result.topic}". Your role is to answer their follow-up questions based on the provided context. Do not invent information. If the answer isn't in the context, say so.\n\nFULL CONTEXT:\n${fullContext}`;
            chatInstanceRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction }
            });
        }

        try {
            const stream = await chatInstanceRef.current.sendMessageStream({ message });
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
            setChatHistory(prev => [...prev, { role: 'model', content: 'Sorry, I ran into an error.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="chrono-scout-results-container">
            {generatedQuiz && (
                <GeneratedContentModal 
                    title="Generated Quiz"
                    content={generatedQuiz}
                    onCopy={() => handleCopy(generatedQuiz)}
                    onClose={() => setGeneratedQuiz(null)}
                />
            )}
            {generatedMains && (
                <GeneratedContentModal 
                    title="Generated Mains Question"
                    content={generatedMains}
                    onCopy={() => handleCopy(generatedMains)}
                    onClose={() => setGeneratedMains(null)}
                />
            )}
            
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>ChronoScout Analysis: {result.topic}</h2>
                <p className="subtitle" style={{ maxWidth: '650px', margin: '0 auto 2rem auto' }}>{result.summary}</p>
            </div>

            <div className="ca-feed-container">
                {Array.isArray(result.dynamic_dimensions) && result.dynamic_dimensions.map((dim, index) => (
                    <div className="ca-feed-card" key={dim.dimension_name} style={{animationDelay: `${index * 0.05}s`}}>
                        <h3>{dim.dimension_name}</h3>
                        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(dim.detailed_analysis) }} />
                    </div>
                ))}
                
                {Array.isArray(result.timeline) && result.timeline.length > 0 && 
                    <div className="ca-feed-card">
                        <h3>Timeline</h3>
                        <ul className="ca-timeline">{result.timeline.map((item, i) => <li key={i}><div className="ca-timeline-date">{item.date}</div><div className="ca-timeline-event">{item.event}</div></li>)}</ul>
                    </div>
                }

                {Array.isArray(result.core_issue_analysis) && result.core_issue_analysis.length > 0 &&
                    <div className="ca-feed-card">
                        <h3>Core Issue Analysis</h3>
                        {result.core_issue_analysis.map((issue, i) => (
                            <div className="ca-core-issue" key={i}>
                                <h4>{issue.issue}</h4>
                                <div className="pros-cons-grid">
                                    <div className="pros-column"><h5>Arguments For</h5><ul>{Array.isArray(issue.pros) && issue.pros.map((p, j) => <li key={j}>{p}</li>)}</ul></div>
                                    <div className="cons-column"><h5>Arguments Against</h5><ul>{Array.isArray(issue.cons) && issue.cons.map((p, j) => <li key={j}>{p}</li>)}</ul></div>
                                </div>
                            </div>
                        ))}
                    </div>
                }

                 {Array.isArray(result.key_stakeholders_analysis) && result.key_stakeholders_analysis.length > 0 &&
                    <div className="ca-feed-card">
                        <h3>Key Stakeholders</h3>
                         <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.key_stakeholders_analysis.map(s => `**${s.name} (${s.role}):**\n- **Interests:** ${s.interests}\n- **Influence:** ${s.influence}`).join('\n\n')) }} />
                    </div>
                }
                
                {result.prelims_facts && Object.values(result.prelims_facts).some(arr => Array.isArray(arr) && arr.length > 0) &&
                    <div className="ca-feed-card">
                        <h3>High-Yield Prelims Facts</h3>
                        {Object.entries(result.prelims_facts).filter(([_, value]) => Array.isArray(value) && value.length > 0).map(([key, value]) => (
                             <div key={key}>
                                <h4>{key.replace(/_/g, ' ')}</h4>
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse((value as string[]).map(p => `- ${p}`).join('\n')) }} />
                            </div>
                        ))}
                    </div>
                }

                 {(result.way_forward && ( (Array.isArray(result.way_forward.short_term) && result.way_forward.short_term.length > 0) || (Array.isArray(result.way_forward.long_term) && result.way_forward.long_term.length > 0))) &&
                    <div className="ca-feed-card">
                        <h3>Way Forward</h3>
                        {Array.isArray(result.way_forward.short_term) && result.way_forward.short_term.length > 0 && (
                             <div>
                                <h4>Short-Term</h4>
                                {result.way_forward.short_term.map((p, i) => <p key={i}><strong>{p.recommendation}:</strong> {p.justification}</p>)}
                            </div>
                        )}
                        {Array.isArray(result.way_forward.long_term) && result.way_forward.long_term.length > 0 && (
                            <div>
                                <h4>Long-Term</h4>
                                {result.way_forward.long_term.map((p, i) => <p key={i}><strong>{p.recommendation}:</strong> {p.justification}</p>)}
                            </div>
                        )}
                    </div>
                }
            </div>


            <div className="ca-feed-card ca-interactive-actions" style={{marginTop: '1.5rem'}}>
                <h3>Next Steps</h3>
                <div className="actions-grid">
                    <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span>{isGeneratingQuiz ? 'Generating...' : 'Generate a 5-Question Quiz'}</span>
                    </button>
                    <button onClick={handleGenerateMains} disabled={isGeneratingMains}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        <span>{isGeneratingMains ? 'Generating...' : 'Generate a Mains Question'}</span>
                    </button>
                </div>
            </div>

             <div className="card ca-follow-up-chat">
                <h3>Follow-up Chat</h3>
                <p className="chat-subtitle">Ask clarifying questions about this topic. The AI has the full context of this analysis.</p>
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
                        placeholder="e.g., Explain the international perspective in more detail..."
                        disabled={isChatLoading}
                    />
                    <button onClick={handleSendChatMessage} disabled={isChatLoading || !chatInput.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>

            <div className="results-actions" style={{ marginTop: '2rem', justifyContent: 'center' }}>
                <button className="action-button secondary" onClick={handleExport} disabled={isDownloading}>
                    {isDownloading ? 'Exporting...' : 'Export Full Analysis'}
                </button>
                <button className="action-button primary" onClick={onReset}>Analyze New Topic</button>
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{ percentage: number; status: string }> = ({ percentage, status }) => {
    return (
        <div className="card progress-container" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Analysis Progress">
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

const AnalysisSkeleton = () => (
    <div className="ca-feed-container skeleton-container">
        {[...Array(6)].map((_, i) => (
            <div className="ca-feed-card" key={i}>
                <div className="skeleton skeleton-subtitle" style={{width: `${Math.random() * 30 + 50}%`}}></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text" style={{width: '60%'}}></div>
            </div>
        ))}
    </div>
);


export const ChronoScoutApp: React.FC<{
    onAnalysisComplete?: (result: ChronoScoutResult) => void;
    initialData?: ChronoScoutResult | null;
}> = ({ onAnalysisComplete, initialData }) => {
    const [analysisResult, setAnalysisResult] = useState<ChronoScoutResult | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const progressIntervalRef = useRef<number | null>(null);


    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service. Please check your API key setup.");
        }
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        }
    }, []);

    const handleGenerateAnalysis = async (topic: string) => {
        if (!aiRef.current) {
            setError('AI Service not initialized.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        // --- Start Progress Simulation ---
        setStatusText("Analyzing topic with ChronoScout...");
        setProgress(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                    return prev;
                }
                const increment = prev < 80 ? Math.floor(Math.random() * 5) + 1 : 1;
                return prev + increment;
            });
        }, 400);
        // --- End Progress Simulation ---


        const prompt = `You are a "UPSC Current Affairs Strategist" with deep domain expertise. Your primary directive is to use Google Search to find the **absolute latest news, data, and analysis** on a given topic, prioritizing information from the last 12-18 months. Your analysis MUST be dynamic and tailored to the nature of the topic.

**Topic for Analysis:** "${topic}"

**CORE DIRECTIVE: DYNAMIC, CONTEXT-AWARE ANALYSIS**
Before generating the JSON, first identify the primary domain of the topic (e.g., International Relations, Polity, Economy, Social Issues, Science & Tech, Culture). Then, tailor the content of your entire analysis based on the following domain-specific instructions. This is not optional.
- **If International Relations:** Your analysis must be India-centric. In 'key_stakeholders_analysis', clearly define who are India's allies, strategic partners, or adversaries in this context. In the relevant dimensions, provide a nuanced analysis of when India should adopt a positive/cooperative stance versus a cautious/critical one. Critically analyze the direct and indirect impacts on India's internal and external security.
- **If Economy:** Focus on the impact on India's GDP, fiscal policy, key sectors, and vulnerable populations. Use recent data from sources like the Economic Survey, RBI reports, etc.
- **If Polity/Governance:** Focus on constitutional provisions, legal frameworks, Supreme Court judgments, and the functioning of democratic institutions. Analyze the impact on citizen's rights and the federal structure.
- **If Social Issues:** Focus on the impact on different sections of society (women, children, marginalized communities), social equity, and justice. Use data from sources like NFHS, NCRB etc.
- **If Culture:** Focus on heritage, societal impact, evolution, and philosophical underpinnings.
- **Interconnectivity:** Throughout your analysis, you MUST identify and explain any significant inter-linkages. For example, if an IR topic has implications for internal security or the economy, detail these connections in the relevant sections.

**CRITICAL INSTRUCTIONS:**
1.  **Extensive & Recent Search:** You MUST use Google Search to find detailed and up-to-date information for every single field in the required JSON structure.
2.  **Strict JSON Output:** Your entire response MUST be a single, valid JSON object. Ensure all property names (keys) are enclosed in double quotes. Do not include any text, comments, or markdown formatting outside of this JSON structure.
3.  **JSON Structure**: The JSON object must conform to this highly detailed structure.
    {
      "topic": "The user-provided topic string",
      "summary": "A concise summary (2-3 sentences) of the topic and its core issue.",
      "timeline": [{"date": "Date of event", "event": "Description of event"}],
      "historical_context": "A narrative paragraph providing essential background information and its connection to any currently trending related news or events.",
      "constitutional_and_legal_provisions": [{"provision": "e.g., Article 14", "description": "A brief explanation of its relevance to the topic."}],
      "government_initiatives": [{"name": "Name of Scheme/Policy", "objective": "Main goal of the initiative.", "key_features": ["Array of key features."]}],
      "key_stakeholders_analysis": [{"name": "Stakeholder name", "role": "Their role", "interests": "What they want to achieve.", "influence": "Their level of power/influence (High/Medium/Low)."}],
      "dynamic_dimensions": [
          {
            "dimension_name": "The name of the first relevant dimension (e.g., 'Geopolitical Dimension')",
            "detailed_analysis": "Your analysis for this dimension. **This MUST be structured using Markdown.** Use headings ('##'), sub-headings ('###'), and bullet points ('-') to create a clear, organized breakdown. **Do not use long, unstructured paragraphs.**",
            "potential_questions": ["An array of potential Mains questions related to this specific dimension."]
          }
      ],
      "prelims_facts": {
          "key_terms_and_definitions": ["Array of important terms and definitions."],
          "reports_and_indices": ["Array of facts from relevant reports/indices."],
          "committees_and_bodies": ["Array identifying key committees or bodies."],
          "legal_and_constitutional_provisions": ["Array of relevant articles, laws, or amendments in brief."],
          "miscellaneous_facts": ["Array of other high-yield facts."]
      },
      "core_issue_analysis": [{"issue": "A central issue within the topic", "pros": ["Array of arguments for/in favor."], "cons": ["Array of arguments against/critical points."]}],
      "ethical_dilemmas": [{"dilemma": "A description of the ethical conflict.", "values_in_conflict": ["e.g., 'National Security vs. Privacy'"]}],
      "technological_dimensions": ["Array of strings discussing the tech angle, e.g., 'Use of AI in surveillance', 'Blockchain for land records.'"],
      "international_perspective": [{"country_or_org": "e.g., 'USA', 'OECD'", "approach_or_comparison": "Description of their approach or a comparison with India."}],
      "key_data_and_statistics": [{"statistic": "A specific, quantifiable data point.", "source": "Source of the data.", "relevance": "Why this statistic is important."}],
      "future_outlook": "A forward-looking paragraph on the future trajectory of this issue.",
      "keywords": ["Array of important keywords/terminology."],
      "way_forward": {
          "short_term": [{"recommendation": "A specific suggestion.", "justification": "Why this is important.", "implementation_challenges": "Potential hurdles."}],
          "long_term": [{"recommendation": "A specific suggestion.", "justification": "Why this is important.", "implementation_challenges": "Potential hurdles."}]
      },
      "related_pyqs": {
        "prelims": ["Array of relevant Prelims PYQs."],
        "mains": ["Array of relevant Mains PYQs."]
      }
    }
`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });
            
            if (!response || !response.text) {
                throw new Error("The AI returned an empty or invalid response. This can happen due to safety filters or if the topic is too complex. Please try rephrasing your topic.");
            }

            let jsonString = response.text.trim();
            const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            if (jsonMatch) {
                jsonString = jsonMatch[1] || jsonMatch[2];
            }

            const resultData: ChronoScoutResult = JSON.parse(jsonString);
            const finalResult = { ...resultData, topic }; // Ensure topic is consistent

            setAnalysisResult(finalResult);

            if (onAnalysisComplete) {
                onAnalysisComplete(finalResult);
            }

        } catch (err: any) {
            console.error("ChronoScout Analysis Failed:", err);
            let errorMessage = "Sorry, an error occurred while generating the analysis. Please try again later.";
            if (err.message && err.message.includes('empty or invalid response')) {
                errorMessage = err.message;
            } else if (err.message && err.message.includes('JSON')) {
                 errorMessage = "The AI returned an invalid format. Please try rephrasing your topic or try again, as this can sometimes be a temporary issue.";
            } else if (err.toString().includes('400')) {
                errorMessage = `The request to the AI failed. It's possible the topic was too broad or ambiguous. Please try again with a more specific topic. (Error: ${err.message})`;
            }
            setError(errorMessage);
        } finally {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setProgress(100);
            setStatusText("Analysis complete!");
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    };
    
    const handleReset = () => {
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <div className="pyq-container">
            {error && <div className="card error" role="alert">{error}</div>}

            {!analysisResult && !isLoading && (
                <AnalysisConfig onGenerate={handleGenerateAnalysis} isLoading={isLoading} />
            )}
            
            {isLoading && (
                 <div className="pyq-container">
                    <ProgressBar percentage={progress} status={statusText} />
                    <AnalysisSkeleton />
                </div>
            )}

            {!isLoading && analysisResult && aiRef.current && (
                <AnalysisResults result={analysisResult} ai={aiRef.current} onReset={handleReset} />
            )}
        </div>
    );
};