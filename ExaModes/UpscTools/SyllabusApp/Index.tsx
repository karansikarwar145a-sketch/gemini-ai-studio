
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type, Chat as GenAIChat } from "@google/genai";
import './Index.css';
import { prelimsGsPaper1Data } from './prelimsGsPaper1Data';
import { prelimsCsatData } from './prelimsCsatData';
import { gsPaper1Data } from './gsPaper1Data';
import { gsPaper2Data } from './gsPaper2Data';
import { gsPaper3Data } from './gsPaper3Data';
import { gsPaper4Data } from './gsPaper4Data';
import { SyllabusTopic, SyllabusPaper } from './types';
import { MicroTopicsResult, MicroTopic } from '../MicroTopicsApp/Index.tsx';
import { PrelimsApp, QuizResult } from '../Papp/Index.tsx';

declare var marked: any;

// === TYPE DEFINITIONS ===
type SyllabusChatRole = 'user' | 'model';
type SyllabusChatMessage = {
    role: SyllabusChatRole;
    content: string;
};

// A helper function to filter the syllabus tree
const filterTree = (nodes: SyllabusTopic[], term: string): SyllabusTopic[] => {
    if (!term.trim()) return nodes;
    const lowercasedTerm = term.toLowerCase();

    return nodes.map((node): SyllabusTopic | null => {
        const children = node.children ? filterTree(node.children, term) : [];
        
        if (node.name.toLowerCase().includes(lowercasedTerm) || children.length > 0) {
            return { ...node, children: children.length > 0 ? children : undefined };
        }
        return null;
    }).filter((node): node is SyllabusTopic => node !== null);
};

// === EMBEDDED MICRO-TOPIC COMPONENTS ===
const MicroTopicNode: React.FC<{ 
    topic: MicroTopic; 
    level: number;
    onGenerateQuiz: (topic: string) => void;
    onAskChat: (topic: string) => void;
    path: string;
}> = ({ topic, level, onGenerateQuiz, onAskChat, path }) => {
    const [isOpen, setIsOpen] = useState(level < 2);
    const hasChildren = topic.children && topic.children.length > 0;
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
                            path={fullTopicPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const MicroTopicsResultView: React.FC<{
    result: MicroTopicsResult;
    onGenerateQuiz: (topic: string) => void;
    onAskChat: (topic: string) => void;
    onReset: () => void;
}> = ({ result, onGenerateQuiz, onAskChat, onReset }) => {
    return (
        <div className="card micro-topics-container">
            <h2>Micro-Topics for: {result.topic}</h2>
            <div className="micro-topics-list">
                {result.microTopics.map((t, i) => (
                    <MicroTopicNode 
                        key={t.name + i} 
                        topic={t} 
                        level={1} 
                        onGenerateQuiz={onGenerateQuiz} 
                        onAskChat={onAskChat}
                        path={result.topic}
                    />
                ))}
            </div>
            <div className="results-actions" style={{marginTop: '2rem'}}>
                <button className="action-button primary" onClick={onReset}>Back to Topic Details</button>
            </div>
        </div>
    )
};


// === EMBEDDED CHAT ===
const SyllabusChat: React.FC<{
    topic: string;
    ai: GoogleGenAI;
    onBack: () => void;
}> = ({ topic, ai, onBack }) => {
    const [history, setHistory] = useState<SyllabusChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const chatInstanceRef = useRef<GenAIChat | null>(null);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const systemInstruction = `You are an expert AI mentor for UPSC. The user wants to discuss the syllabus topic: "${topic}". Your goal is to provide comprehensive, accurate, and structured answers to their questions. Use standard Markdown for formatting.`;
        chatInstanceRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
        setHistory([]);
    }, [topic, ai]);
    
    useEffect(() => {
        chatHistoryRef.current?.scrollTo(0, chatHistoryRef.current.scrollHeight);
    }, [history, isLoading]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoading || !chatInstanceRef.current) return;
        const message = chatInput.trim();
        setChatInput('');
        setHistory(prev => [...prev, { role: 'user', content: message }]);
        setIsLoading(true);

        try {
            const stream = await chatInstanceRef.current.sendMessageStream({ message });
            let modelResponse = '';
            setHistory(prev => [...prev, { role: 'model', content: '' }]);
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', content: modelResponse };
                    return newHistory;
                });
            }
        } catch (err) {
            console.error(err);
            setHistory(prev => [...prev, { role: 'model', content: "Sorry, an error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="syllabus-chat-view">
            <div className="syllabus-content-header">
                <button onClick={onBack} className="syllabus-content-back-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    <span>Back</span>
                </button>
                <h3>Chat: {topic}</h3>
            </div>
            <div className="chat-history-embedded" ref={chatHistoryRef}>
                {history.map((msg, index) => (
                    <div key={index} className={`chat-message-wrapper ${msg.role}-wrapper`}>
                        <div className={`chat-message ${msg.role}-message`}>
                            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="chat-message-wrapper model-wrapper">
                        <div className="chat-message model-message loading-dots"><span></span><span></span><span></span></div>
                    </div>
                )}
            </div>
            <div className="chat-input-area-embedded">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} disabled={isLoading || !chatInput.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    );
};


// === SYLLABUS COMPONENTS ===
const SyllabusTreeNode: React.FC<{
    topic: SyllabusTopic;
    level: number;
    selectedTopic: SyllabusTopic | null;
    selectedTopicPath: string;
    onSelect: (topic: SyllabusTopic, path: string) => void;
    onGenerateQuiz: (topic: string) => void;
    onAskChat: (topic: string) => void;
    parentPath: string;
}> = ({ topic, level, selectedTopic, selectedTopicPath, onSelect, onGenerateQuiz, onAskChat, parentPath }) => {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = topic.children && topic.children.length > 0;
    const fullPath = parentPath ? `${parentPath} -> ${topic.name}` : topic.name;
    const isSelected = selectedTopic?.name === topic.name && selectedTopicPath === fullPath;

    const handleNodeClick = () => {
        onSelect(topic, fullPath);
        if (hasChildren) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="syllabus-tree-node">
            <div
                className={`syllabus-tree-node-header ${isSelected ? 'active' : ''}`}
                onClick={handleNodeClick}
                style={{ paddingLeft: `${level * 12}px` }}
            >
                {hasChildren ? (
                    <svg className={`node-toggle-icon ${isOpen ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                ) : (
                    <span className="node-icon-placeholder"></span>
                )}
                <span className="node-title">{topic.name}</span>
                <div className="syllabus-node-actions">
                    <button 
                        title="Ask Chat" 
                        className="syllabus-node-action-btn"
                        onClick={(e) => { e.stopPropagation(); onAskChat(fullPath); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button 
                        title="Generate Quiz" 
                        className="syllabus-node-action-btn"
                        onClick={(e) => { e.stopPropagation(); onGenerateQuiz(fullPath); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                </div>
            </div>
            {hasChildren && isOpen && (
                <div className="syllabus-tree-children">
                    {topic.children?.map((child, index) => (
                        <SyllabusTreeNode
                            key={child.name + index}
                            topic={child}
                            level={level + 1}
                            selectedTopic={selectedTopic}
                            selectedTopicPath={selectedTopicPath}
                            onSelect={onSelect}
                            onGenerateQuiz={onGenerateQuiz}
                            onAskChat={onAskChat}
                            parentPath={fullPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const SyllabusContentView: React.FC<{
    selectedTopic: SyllabusTopic;
    selectedTopicPath: string;
    onSelectTopicForNotes: (topic: string) => void;
    onGenerateQuiz: (topic: string) => void;
    onGenerateMicroTopics: (topic: string) => void;
    onAskChat: (topic: string) => void;
}> = ({ selectedTopic, selectedTopicPath, onSelectTopicForNotes, onGenerateQuiz, onGenerateMicroTopics, onAskChat }) => {
    const breadcrumbItems = selectedTopicPath.split(' -> ');

    return (
        <div className="syllabus-content-details">
            <nav aria-label="breadcrumb" className="syllabus-breadcrumb">
                {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={index}>
                        <span className="breadcrumb-item">{item}</span>
                        {index < breadcrumbItems.length - 1 && <span className="breadcrumb-separator">/</span>}
                    </React.Fragment>
                ))}
            </nav>
            <h2 className="selected-topic-title">{selectedTopic.name}</h2>

            <div className="selected-topic-actions">
                <button className="action-button primary" onClick={() => onGenerateMicroTopics(selectedTopicPath)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.09 8.26 20 9.27 15.55 13.97 16.91 20.02 12 17.27 7.09 20.02 8.45 13.97 4 9.27 9.91 8.26 12 2z"></path></svg>
                    <span>Explore Micro-Topics</span>
                </button>
                 <button className="action-button secondary" onClick={() => onSelectTopicForNotes(selectedTopicPath)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>Generate Notes</span>
                </button>
                <button className="action-button secondary" onClick={() => onGenerateQuiz(selectedTopicPath)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>Generate Quiz</span>
                </button>
                 <button className="action-button secondary" onClick={() => onAskChat(selectedTopicPath)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Ask Chat</span>
                </button>
            </div>
            
            {selectedTopic.children && selectedTopic.children.length > 0 && (
                <div className="sub-topic-section">
                    <h4>Sub-Topics</h4>
                    <div className="sub-topics-grid">
                        {selectedTopic.children.map((child, index) => (
                            <div className="sub-topic-card" key={child.name + index}>
                                <h5>{child.name}</h5>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const SyllabusApp: React.FC<{
    onSelectTopicForNotes: (topic: string) => void;
    onMicroTopicsComplete: (result: MicroTopicsResult) => void;
    onQuizComplete: (result: QuizResult) => void;
}> = ({ onSelectTopicForNotes, onMicroTopicsComplete, onQuizComplete }) => {
    const [syllabusData] = useState<SyllabusPaper[]>([prelimsGsPaper1Data, prelimsCsatData, gsPaper1Data, gsPaper2Data, gsPaper3Data, gsPaper4Data]);
    const [activeTab, setActiveTab] = useState<string>('Prelims GS-I');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<SyllabusTopic | null>(null);
    const [selectedTopicPath, setSelectedTopicPath] = useState<string>('');
    const navPanelRef = useRef<HTMLDivElement>(null);
    const [contentView, setContentView] = useState<'details' | 'quiz' | 'chat' | 'micro-topics-loading' | 'micro-topics-result'>('details');
    const [activeContentTopic, setActiveContentTopic] = useState('');
    const [microTopicsResult, setMicroTopicsResult] = useState<MicroTopicsResult | null>(null);
    const [microTopicsError, setMicroTopicsError] = useState<string | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const activePaperData = useMemo(() => syllabusData.find(p => p.title === activeTab), [activeTab, syllabusData]);
    const filteredSubjects = useMemo(() => activePaperData ? filterTree(activePaperData.subjects, searchTerm) : [], [activePaperData, searchTerm]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try { aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY }); } 
        catch (e) { console.error(e); setMicroTopicsError("Could not initialize AI service."); }
    }, []);

    useEffect(() => {
        setSelectedTopic(null);
        setSelectedTopicPath('');
        setContentView('details');
        setSearchTerm('');
        if (navPanelRef.current) navPanelRef.current.scrollTop = 0;
        if (isMobile) setIsNavExpanded(false);
    }, [activeTab, isMobile]);
    
    const handleSelectTopic = (topic: SyllabusTopic, path: string) => {
        setSelectedTopic(topic);
        setSelectedTopicPath(path);
        setContentView('details');
        if (isMobile) setIsNavExpanded(false);
    };

    const handleStartQuiz = (topicPath: string) => { setActiveContentTopic(topicPath); setContentView('quiz'); if (isMobile) setIsNavExpanded(false); };
    const handleStartChat = (topicPath: string) => { setActiveContentTopic(topicPath); setContentView('chat'); if (isMobile) setIsNavExpanded(false); };
    const handleQuizFinished = (result: QuizResult) => { onQuizComplete(result); setContentView('details'); };

    const handleGenerateMicroTopics = useCallback(async (topicPath: string) => {
        if (!aiRef.current) return;
        setContentView('micro-topics-loading');
        // Rest of the function is unchanged
        const microTopicSchema: any = { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] };
        const level4 = { ...microTopicSchema };
        const level3 = { ...microTopicSchema, properties: { ...microTopicSchema.properties, children: { type: Type.ARRAY, items: level4 } } };
        const level2 = { ...microTopicSchema, properties: { ...microTopicSchema.properties, children: { type: Type.ARRAY, items: level3 } } };
        const level1 = { ...microTopicSchema, properties: { ...microTopicSchema.properties, children: { type: Type.ARRAY, items: level2 } } };
        const prompt = `You are an expert UPSC syllabus deconstructor. Given the following UPSC syllabus topic, break it down into a comprehensive, nested list of micro-topics that an aspirant should study. The breakdown should be detailed and structured. Return the result as a JSON array of objects, where each object has a 'name' (string) and an optional 'children' (an array of the same object type). Do not include the parent topic itself in the response.

Topic: "${topicPath}"`;
        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-pro', contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: level1 } }
            });
            let txt = response.text.trim().match(/```(?:json)?\s*([\s\S]*?)\s*```|(\[[\s\S]*\])/s);
            const microTopics = JSON.parse(txt ? txt[1] || txt[2] : response.text);
            const resultData: MicroTopicsResult = { topic: topicPath, microTopics };
            setMicroTopicsResult(resultData);
            setContentView('micro-topics-result');
            onMicroTopicsComplete(resultData);
        } catch (err) {
            console.error(err);
            setMicroTopicsError("Failed to generate micro-topics.");
            setContentView('details');
        }
    }, [onMicroTopicsComplete]);

    const renderContent = () => {
        if (contentView === 'quiz' && aiRef.current) return (
            <>
                <div className="syllabus-content-header">
                    <button onClick={() => setContentView('details')} className="syllabus-content-back-btn">Back</button>
                    <h3>Quiz: {activeContentTopic}</h3>
                </div>
                <PrelimsApp initialTopic={activeContentTopic} onQuizComplete={handleQuizFinished} initialData={null}/>
            </>
        );
        if (contentView === 'chat' && aiRef.current) return <SyllabusChat topic={activeContentTopic} ai={aiRef.current} onBack={() => setContentView('details')} />;
        if (contentView === 'micro-topics-loading') return <div className="card" style={{margin: 'auto'}}><div className="loading-indicator"><div></div><div></div><div></div></div></div>;
        if (contentView === 'micro-topics-result' && microTopicsResult) return <MicroTopicsResultView result={microTopicsResult} onGenerateQuiz={handleStartQuiz} onAskChat={handleStartChat} onReset={() => setContentView('details')} />;
        
        if (selectedTopic) return <SyllabusContentView selectedTopic={selectedTopic} selectedTopicPath={selectedTopicPath} onSelectTopicForNotes={onSelectTopicForNotes} onGenerateQuiz={handleStartQuiz} onGenerateMicroTopics={handleGenerateMicroTopics} onAskChat={handleStartChat} />;

        return (
            <div className="syllabus-welcome-dashboard">
                <h1 className="font-serif">Syllabus Explorer</h1>
                <p>Select a paper to begin your exploration, or search for a specific topic.</p>
                <div className="paper-selection-grid">
                    {syllabusData.map(paper => (
                        <button key={paper.title} className="paper-card" onClick={() => setActiveTab(paper.title)}>
                            <h3>{paper.title}</h3>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="syllabus-container">
            <div className={`syllabus-nav-container ${isMobile && isNavExpanded ? 'is-nav-expanded' : ''}`}>
                <div className="syllabus-tabs-wrapper">
                    <div className="syllabus-tabs">
                        {syllabusData.map(paper => (
                            <button key={paper.title} className={`syllabus-tab-button ${activeTab === paper.title ? 'active' : ''}`} onClick={() => setActiveTab(paper.title)}>
                                {paper.title}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="syllabus-nav-search">
                    <input type="text" placeholder="Search syllabus..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="syllabus-nav-panel-content" ref={navPanelRef}>
                    {filteredSubjects.map(subject => (
                        <SyllabusTreeNode
                            key={subject.name} topic={subject} level={0}
                            selectedTopic={selectedTopic} selectedTopicPath={selectedTopicPath}
                            onSelect={handleSelectTopic} onGenerateQuiz={handleStartQuiz}
                            onAskChat={handleStartChat} parentPath={activePaperData?.title || ''}
                        />
                    ))}
                </div>
            </div>
            {isMobile && isNavExpanded && <div className="syllabus-content-overlay" onClick={() => setIsNavExpanded(false)}></div>}
            <div className={`syllabus-content-panel ${contentView !== 'details' && !selectedTopic ? 'tool-active' : ''}`}>
                {isMobile && (
                    <div className="syllabus-mobile-header">
                        <button className="syllabus-nav-toggle" onClick={() => setIsNavExpanded(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                         <span className="mobile-header-title">{selectedTopic ? selectedTopic.name : activeTab}</span>
                         <div style={{width: '20px'}}/>
                    </div>
                )}
                {renderContent()}
            </div>
        </div>
    );
};