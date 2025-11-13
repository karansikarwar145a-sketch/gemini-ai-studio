import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
    UploadCloud, FileText, Trash2, ArrowRight, Sparkles, User, 
    Paperclip, ArrowUp, Wand2, PanelLeft, PanelRight, X, BookOpen,
    ListChecks, DraftingCompass, NotebookText, PlusCircle
} from '../components/icons';
import { Loader } from '../components/Loader';
import './Index.css';

declare var marked: any;

// Type for a source file
type SourceFile = {
    file: File;
    content: string;
};

// Type for a chat message
type ProjectChatMessage = {
    role: 'user' | 'model' | 'system';
    content: string;
};

type ModalContent = {
    title: string;
    content: string;
};

// Helper to convert a File to a Gemini Part
const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    
    let mimeType = file.type;

    // List of MIME types Gemini API supports directly for multi-modal input.
    const supportedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
    ];

    if (!supportedMimeTypes.includes(mimeType) && !mimeType.startsWith('text/')) {
        // If it's not a supported binary type and not a text type, it might be something like 'application/json'.
        // For simplicity and to avoid errors, we'll treat most unknown types that aren't images/pdf as text.
        // The Gemini API is good at interpreting text content from various file types if they are sent as text/plain.
        mimeType = 'text/plain';
    }
    
    // Normalize all text-based MIME types to 'text/plain' to avoid 'Unsupported MIME type' errors.
    if(mimeType.startsWith('text/')) {
        mimeType = 'text/plain';
    }


    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: mimeType,
        },
    };
};


const GeneratedContentModal: React.FC<{
    content: ModalContent;
    onClose: () => void;
}> = ({ content, onClose }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(content.content);
        // Optionally show a "Copied!" message
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{content.title}</h2>
                    <button onClick={onClose} className="modal-close-btn"><X className="w-6 h-6" /></button>
                </div>
                <div className="generated-content-modal">
                    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(content.content) }}></div>
                </div>
                <div className="modal-actions">
                    <button className="modal-button secondary" onClick={handleCopy}>Copy</button>
                    <button className="modal-button primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};


export const ProjectApp: React.FC = () => {
    const [sources, setSources] = useState<SourceFile[]>([]);
    const [view, setView] = useState<'upload' | 'studio'>('upload');
    const [activeTab, setActiveTab] = useState<'chat' | 'studio'>('chat');
    
    const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState(false);
    
    const [modalContent, setModalContent] = useState<ModalContent | null>(null);

    const aiRef = useRef<GoogleGenAI | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addSourceFileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try { 
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } 
        catch (e) { setError('Could not initialize AI service.'); }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleFileChange = async (files: FileList | null): Promise<number> => {
        if (!files || files.length === 0) return 0;
        
        setError(null);
        
        const filesToParse = Array.from(files);
        const supportedFiles = filesToParse.filter(file => 
            file.type.startsWith('text/') || 
            file.type === 'application/pdf' ||
            ['.md', '.json', '.csv'].some(ext => file.name.endsWith(ext))
        );
        const unsupportedFiles = filesToParse.filter(file => !supportedFiles.includes(file));

        if (unsupportedFiles.length > 0) {
            const unsupportedNames = unsupportedFiles.map(f => f.name).join(', ');
            setError(`Unsupported file types: ${unsupportedNames}. Please upload text-based files like TXT, MD, JSON, CSV, or PDF.`);
        }

        if (supportedFiles.length === 0) return 0;

        const existingFiles = new Set(sources.map(s => `${s.file.name}-${s.file.size}`));

        const parsePromises = supportedFiles.map(file => new Promise<SourceFile | null>((resolve) => {
            if (existingFiles.has(`${file.name}-${file.size}`)) {
                resolve(null);
                return;
            }
            
            // For PDFs, we don't read content on the client. We'll process the file object directly when sending to the API.
            if (file.type === 'application/pdf') {
                resolve({ file, content: `[PDF File: ${file.name}]` }); // Content is a placeholder for display.
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => resolve({ file, content: e.target?.result as string });
            reader.onerror = () => resolve({ file, content: `[Error reading text file ${file.name}]` });
            reader.readAsText(file);
        }));

        const results = await Promise.all(parsePromises);
        const newSources = results.filter((s): s is SourceFile => s !== null);
        
        setSources(prev => [...prev, ...newSources]);
        return newSources.length;
    };


    const handleRemoveSource = (fileName: string) => {
        setSources(prev => prev.filter(s => s.file.name !== fileName));
    };

    const handleStart = () => {
        if (sources.length === 0) {
            setError('Please upload at least one source file.');
            return;
        }
        setMessages([]);
        setView('studio');
        setActiveTab('chat');
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoading || !aiRef.current) return;
        
        const message = chatInput.trim();
        setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: message }]);
        setIsLoading(true);
        setError(null);

        const sourceParts = await Promise.all(
            sources.map(sourceFile => fileToGenerativePart(sourceFile.file))
        );

        const systemInstruction = `You are an expert research assistant. The user has provided several documents as sources. Your task is to answer the user's questions based **only** on the information contained in these sources. When you use information from a source, you MUST cite it at the end of the sentence by mentioning the file name in brackets, like this: [filename.txt]. If the answer cannot be found in the provided sources, you must explicitly state that. Do not use outside knowledge.`;
        
        const historyForAPI = [
             { role: 'user' as const, parts: [
                { text: `Here are the source documents I will be asking questions about. Please analyze them.`}, 
                ...sourceParts
            ]},
             { role: 'model' as const, parts: [{ text: 'Thank you. I have read the documents and am ready for your questions.' }] }
        ];
        
        messages.forEach(msg => {
            if (msg.role !== 'system') { historyForAPI.push({ role: msg.role as 'user' | 'model', parts: [{ text: msg.content }] }); }
        });
        
        const contents = [...historyForAPI, { role: 'user' as const, parts: [{ text: message }] }];

        try {
            const stream = await aiRef.current.models.generateContentStream({ model: 'gemini-2.5-flash', contents, config: { systemInstruction } });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', content: modelResponse };
                    return newHistory;
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage = "Sorry, I've encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', content: errorMessage}])
        } finally { setIsLoading(false); }
    };

    const handleStudioAction = async (action: 'quiz' | 'mindmap' | 'notes') => {
        if (isLoading || !aiRef.current) return;
        
        setIsLoading(true);
        setError(null);

        const sourceParts = await Promise.all(
            sources.map(sourceFile => fileToGenerativePart(sourceFile.file))
        );

        let promptText = '';
        let title = '';

        switch(action) {
            case 'quiz':
                title = 'Generated Quiz';
                promptText = `Based on the provided documents, generate a 5-question multiple-choice quiz. The questions should test understanding of the key facts and concepts. Format the output as a clean markdown list. For each question, provide the correct answer on the line immediately after the options, prefixed with '**Answer:**'.`;
                break;
            case 'mindmap':
                title = 'Generated Mindmap';
                promptText = `Based on the provided documents, generate a hierarchical mindmap in Markdown format. Use nested lists and bold text to represent the structure. Start with the central topic and branch out to key concepts and sub-topics.`;
                break;
            case 'notes':
                title = 'Generated Notes';
                promptText = `Based on the provided documents, generate a set of concise, well-structured summary notes. Use Markdown for headings, lists, and bold text to highlight key information.`;
                break;
        }

        const contents = {
            parts: [
                ...sourceParts,
                { text: promptText }
            ]
        };

        try {
            const response = await aiRef.current.models.generateContent({ model: 'gemini-2.5-flash', contents });
            setModalContent({ title, content: response.text });
        } catch (err) {
            console.error(err);
            setError("Sorry, an error occurred while generating the content.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddSources = async (files: FileList | null) => {
        const addedCount = await handleFileChange(files);
        if (addedCount > 0) {
            setMessages(prev => [...prev, { role: 'system', content: `${addedCount} new source(s) added.` }]);
        }
    };

    // Drag & Drop Handlers
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };

    if (view === 'upload') {
        return (
            <div className="project-app-container">
                <div className="upload-view-container">
                    <h1 className="font-serif">My Project Space</h1>
                    <p className="subtitle">Upload your documents to create a knowledge base, then ask questions or generate summaries about them.</p>
                    <input type="file" multiple ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden" accept=".txt,.md,.json,.csv,.pdf" />
                    <div className={`drop-zone ${isDragging ? 'dragging' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                        <UploadCloud className="w-12 h-12 text-gray-400" />
                        <p><strong>Click to upload</strong> or drag and drop</p>
                        <p className="text-sm text-gray-500">TXT, MD, JSON, CSV, or PDF files</p>
                    </div>
                    {sources.length > 0 && <div className="file-list"><h4>Sources ({sources.length})</h4>{sources.map(s => (<div key={s.file.name} className="file-item"><FileText className="w-5 h-5 text-gray-500" /><span className="file-name">{s.file.name}</span><span className="file-size">{(s.file.size / 1024).toFixed(2)} KB</span><button onClick={() => handleRemoveSource(s.file.name)} className="remove-btn"><Trash2 className="w-4 h-4" /></button></div>))}</div>}
                    {error && <p className="error-message">{error}</p>}
                    <button className="start-chat-btn" onClick={handleStart} disabled={sources.length === 0}>Start <ArrowRight className="w-5 h-5" /></button>
                </div>
            </div>
        );
    }

    return (
        <div className={`project-app-container chat-studio-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isSourcesDrawerOpen ? 'drawer-open' : ''}`}>
            {modalContent && <GeneratedContentModal content={modalContent} onClose={() => setModalContent(null)} />}
            <div className="project-drawer-backdrop" onClick={() => setIsSourcesDrawerOpen(false)}></div>
            
            <main className="chat-main-panel">
                <header className="project-mobile-header">
                    <button onClick={() => setIsSourcesDrawerOpen(true)} className="sources-drawer-btn"><BookOpen className="w-5 h-5" /><span>Sources</span></button>
                    <h1 className="font-serif">My Project</h1>
                    <div style={{ width: '80px' }} /> {/* Spacer */}
                </header>

                <div className="project-tabs">
                    <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>Chat</button>
                    <button className={activeTab === 'studio' ? 'active' : ''} onClick={() => setActiveTab('studio')}>Studio</button>
                </div>

                {activeTab === 'chat' && (
                    <div className="chat-content-area">
                        <div className="chat-history">
                            {messages.length === 0 && <div className="chat-welcome-screen"><div className="welcome-icon"><Sparkles className="w-10 h-10" /></div><h2 className="font-serif">Ready to analyze</h2><p>Ask a question about your sources to get started.</p></div>}
                            {messages.map((msg, index) => {
                                if (msg.role === 'system') return <div key={index} className="system-message"><span>{msg.content}</span></div>;
                                return (<div key={index} className={`project-message-wrapper ${msg.role}-wrapper`}><div className="project-avatar">{msg.role === 'model' ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}</div><div className={`project-message-bubble ${msg.role === 'model' ? 'project-model-bubble' : 'project-user-bubble'}`}><div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}></div></div></div>)
                            })}
                            {isLoading && activeTab === 'chat' && <div className="project-message-wrapper model-wrapper"><div className="project-avatar"><Sparkles className="w-5 h-5" /></div><div className="project-message-bubble project-model-bubble"><Loader /></div></div>}
                            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-area-project-wrapper">
                            <div className="project-chat-input-box">
                                <div className="grow-wrap" data-replicated-value={chatInput}><textarea placeholder="Ask a question..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} className="w-full text-base placeholder-[var(--text-secondary)] focus:outline-none resize-none bg-transparent" disabled={isLoading} rows={1}/></div>
                                <div className="chat-input-controls">
                                    <div className="chat-input-buttons-left">
                                        <input 
                                            type="file" 
                                            ref={chatFileInputRef} 
                                            onChange={(e) => handleAddSources(e.target.files)} 
                                            className="hidden" 
                                            accept=".txt,.md,.json,.csv,.pdf" 
                                            multiple
                                        />
                                        <button 
                                            onClick={() => chatFileInputRef.current?.click()} 
                                            className="project-tool-button" 
                                            title="Add Sources"
                                        >
                                            <Paperclip className="w-5 h-5"/>
                                        </button>
                                    </div>
                                    <button onClick={handleSendMessage} disabled={isLoading || !chatInput.trim()} className="send-button" aria-label="Send message">{isLoading ? <Loader /> : <ArrowUp className="w-5 h-5"/>}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'studio' && (
                    <div className="studio-content-area">
                        <div className="studio-header">
                            <h2 className="font-serif">Analysis Studio</h2>
                            <p>Generate summaries, quizzes, and more from your sources.</p>
                        </div>
                        <div className="studio-grid">
                            <button className="studio-card" onClick={() => handleStudioAction('notes')} disabled={isLoading}>
                                <div className="studio-card-icon"><NotebookText /></div>
                                <div className="studio-card-content"><h3>Generate Notes</h3><p>Create a concise summary of all your source documents.</p></div>
                            </button>
                            <button className="studio-card" onClick={() => handleStudioAction('quiz')} disabled={isLoading}>
                                <div className="studio-card-icon"><ListChecks /></div>
                                <div className="studio-card-content"><h3>Generate Quiz</h3><p>Test your knowledge with a multiple-choice quiz based on the sources.</p></div>
                            </button>
                            <button className="studio-card" onClick={() => handleStudioAction('mindmap')} disabled={isLoading}>
                                <div className="studio-card-icon"><DraftingCompass /></div>
                                <div className="studio-card-content"><h3>Create Mindmap</h3><p>Visualize the key concepts and their connections in a mindmap format.</p></div>
                            </button>
                        </div>
                        {isLoading && activeTab === 'studio' && (
                            <div className="studio-loading-indicator">
                                <Loader />
                                <p>AI is generating content...</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <aside className="sources-sidebar-pro">
                <div className="sidebar-header">
                    <h3>Sources</h3>
                    <input type="file" ref={addSourceFileInputRef} onChange={(e) => handleAddSources(e.target.files)} className="hidden" accept=".txt,.md,.json,.csv,.pdf" multiple/>
                    <button className="add-source-btn" onClick={() => addSourceFileInputRef.current?.click()} title="Add more sources">
                        <PlusCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="sources-list-pro">
                    {sources.map(source => (
                        <div key={source.file.name} className="source-item" title={source.file.name}>
                            <FileText className="w-5 h-5 flex-shrink-0" />
                            <span>{source.file.name}</span>
                        </div>
                    ))}
                </div>
                <div className="sidebar-footer">
                     <button onClick={() => setView('upload')} className="back-to-upload-btn">
                        Manage Sources
                    </button>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="collapse-btn" title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                        {isSidebarCollapsed ? <PanelRight className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                    </button>
                </div>
            </aside>
        </div>
    );
};