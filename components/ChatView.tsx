import React, { useState, useRef, useEffect } from 'react';
import { 
    ChevronDown, 
    ArrowUp,
    Sparkles,
    Paperclip,
    X,
    Check,
    ArrowRight,
    Plus,
    LayoutGrid,
} from './icons';
import { Mode, Message, MessageContent } from '../types';
import { MODES, CHAT_INPUT_TOOLS } from '../constants';
import { generateResponse } from '../services/geminiService';
import { MessageDisplay } from './MessageDisplay';
import { Loader } from './Loader';
import { useGeolocation } from '../hooks/useGeolocation';
import { VideoGeneratorModal } from './VideoGenerator';
import { LiveAgent } from './LiveAgent';
import { ToolSidebar } from './ToolSidebar';


const CHAT_MODELS = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable model for complex tasks.' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient for most tasks.' },
];

const EXAMPLE_PROMPTS = [
    "Explain the significance of the 73rd Constitutional Amendment.",
    "Summarize today's key current affairs for prelims.",
    "Create a mind map for the causes of the 1857 revolt.",
    "Differentiate between fiscal policy and monetary policy.",
]

interface ChatViewProps {
    mode: Mode;
    onSwitchMode: (mode: Mode) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ mode, onSwitchMode }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<Mode | null>(null);
    const [isToolPopoverOpen, setIsToolPopoverOpen] = useState(false);
    const [activeTool, setActiveTool] = useState<Mode | null>(null);
    const [isToolSidebarOpen, setIsToolSidebarOpen] = useState(false);

    const modeDetails = MODES[mode];
    const defaultModel = modeDetails.model && CHAT_MODELS.some(m => m.id === modeDetails.model) 
        ? modeDetails.model 
        : 'gemini-2.5-flash';

    const [selectedModel, setSelectedModel] = useState(defaultModel);
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

    const { location, error: locationError } = useGeolocation(activeTool === Mode.LocalSearch);
    const [locationMessage, setLocationMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        setMessages([]);
        setInput('');
        setIsLoading(false);
        setError(null);
        setFile(null);
        setFilePreview(null);
        setActiveTool(null);
        setSelectedModel(defaultModel);
    }, [mode, defaultModel]);
    
    useEffect(() => {
        if (activeTool === Mode.LocalSearch) {
            if (locationError) setLocationMessage(`Location error: ${locationError}`);
            else if (!location) setLocationMessage("Getting your location for local search...");
            else setLocationMessage(null);
        } else {
            setLocationMessage(null);
        }
    }, [activeTool, location, locationError]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { setFile(file); setFilePreview(URL.createObjectURL(file)); }
    };
    const removeFile = () => {
        setFile(null); setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleToolSelect = (toolMode: Mode) => {
        setIsToolPopoverOpen(false);
        if (toolMode === Mode.ImageGeneration || toolMode === Mode.WebSearch || toolMode === Mode.LocalSearch || toolMode === Mode.QuizGeneration) {
             setActiveTool(toolMode);
        } else {
            setActiveModal(toolMode);
        }
    };

    const handleVideoGenerationComplete = (videoUrl: string) => {
        setMessages(prev => [...prev, { role: 'model', content: [{ videoUrl }] }]);
    };

    const handleSubmit = async (promptOverride?: string, toolOverride?: Mode) => {
        const currentTool = activeTool || toolOverride || mode;
        const currentPrompt = promptOverride || input;
        if (!currentPrompt.trim() && !file) return;
        if (isLoading) return;

        setIsLoading(true); setError(null);

        const userMessageContent: MessageContent[] = [];
        if (filePreview) userMessageContent.push({ imageUrl: filePreview });
        if (currentPrompt) userMessageContent.push(currentPrompt);

        setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
        
        const currentFile = file;
        setInput(''); removeFile(); setActiveTool(null);

        setMessages(prev => [...prev, { role: 'model', content: [] }]);
        
        try {
            let fullResponse = ""; let sources: any[] = [];
            const stream = generateResponse(currentTool, currentPrompt, currentFile, location || undefined, selectedModel);

            for await (const chunk of stream) {
                const newContent: MessageContent[] = [];
                if (typeof chunk === 'string') fullResponse += chunk;
                else if (chunk && 'sources' in chunk) sources = sources.concat(chunk.sources);
                else if (chunk && 'imageUrl' in chunk) newContent.push(chunk);

                if (fullResponse) newContent.push(fullResponse);
                if (sources.length > 0) newContent.push({ sources: sources });

                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'model', content: newContent };
                    return updated;
                });
            }
        } catch (e) {
            const errorMessage = `Sorry, something went wrong: ${(e as Error).message}`;
            setError(errorMessage);
             setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'model', content: [errorMessage] };
                return updated;
            });
        } finally { setIsLoading(false); }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    };

    const renderInitialView = () => (
        <div className="flex flex-col items-center text-center my-auto px-4 py-8">
            <h1 className="flex items-center text-4xl md:text-5xl font-serif text-[var(--text-primary)] mb-12">
                <span className="text-5xl md:text-6xl text-[var(--accent)] mr-4">*</span>
                Good afternoon
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {EXAMPLE_PROMPTS.map(prompt => (
                    <button key={prompt} onClick={() => handleSubmit(prompt)} className="group p-4 bg-transparent border border-[var(--border-color)] rounded-lg text-left hover:bg-[var(--surface-2)] transition-all text-[var(--text-secondary)] flex justify-between items-center">
                        <span className="text-sm md:text-base">{prompt}</span>
                        <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </button>
                ))}
            </div>
        </div>
    );
    
    const renderChatInterface = () => (
        <div className="w-full h-full overflow-y-auto pb-4">
             <div className="w-full max-w-4xl mx-auto px-4">
                {messages.map((msg, index) => <div key={index} className="my-6"><MessageDisplay message={msg} /></div>)}
                {isLoading && messages[messages.length - 1]?.role === 'model' && (
                    <div className="my-6 flex justify-start items-end gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full message-bubble-model-icon text-white flex-shrink-0"><Sparkles className="w-5 h-5"/></div>
                        <div className="p-4 max-w-2xl bg-[var(--surface-2)] border border-[var(--border)] rounded-b-xl rounded-tr-xl"><Loader /></div>
                    </div>
                )}
             </div>
            <div ref={messagesEndRef} />
        </div>
    );

    const placeholder = 
        activeTool === Mode.ImageGeneration ? "Describe an image to generate..." :
        activeTool === Mode.WebSearch ? "Search the web..." :
        activeTool === Mode.LocalSearch ? "Search for places nearby..." :
        activeTool === Mode.QuizGeneration ? "Generate a quiz on..." :
        `Message ${modeDetails.name}...`;

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Main Chat Panel */}
            <div className="flex flex-col flex-1 min-w-0 relative">
                {activeModal === Mode.VideoGeneration && <VideoGeneratorModal onClose={() => setActiveModal(null)} onComplete={handleVideoGenerationComplete} />}
                {activeModal === Mode.LiveConversation && <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in-25"><div className="fixed inset-4 md:inset-8 bg-[var(--surface-accent)] rounded-2xl z-50 shadow-2xl"><LiveAgent mode={Mode.LiveConversation} /><button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)]"><X className="w-6 h-6"/></button></div></div>}
                
                {/* Chat Content */}
                <div className="flex-1 w-full flex flex-col min-h-0">
                    <div className="absolute top-4 right-4 z-10 hidden md:block">
                        <button 
                            onClick={() => setIsToolSidebarOpen(prev => !prev)} 
                            className="flex items-center gap-2 bg-[var(--surface)] text-[var(--text-secondary)] px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:text-[var(--text-primary)] transition-all duration-200"
                            title={isToolSidebarOpen ? "Close Tools" : "Open Tools"}
                        >
                            {isToolSidebarOpen ? (
                                <>
                                    <X className="w-5 h-5" />
                                    <span>Close</span>
                                </>
                            ) : (
                                <>
                                    <LayoutGrid className="w-5 h-5" />
                                    <span>Tools</span>
                                </>
                            )}
                        </button>
                    </div>

                    {messages.length === 0 ? renderInitialView() : renderChatInterface()}
                </div>
                
                {/* Chat Input */}
                <div className="flex-shrink-0 pt-4 pb-2 md:pb-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
                    <div className="w-full max-w-3xl mx-auto px-4">
                        {(error || locationMessage) && (
                            <div className="text-center mb-2">
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                {locationMessage && <p className="text-blue-500 text-sm">{locationMessage}</p>}
                            </div>
                        )}
                        
                        {filePreview && (
                            <div className="mb-2 p-2 bg-[var(--surface-accent)] rounded-lg flex items-center justify-between animate-in fade-in duration-300">
                                <div className="flex items-center gap-2"><img src={filePreview} alt="preview" className="w-12 h-12 object-cover rounded" /><span className="text-sm text-[var(--text-secondary)] truncate">{file?.name}</span></div>
                                <button onClick={removeFile} className="p-1 rounded-full hover:bg-[var(--surface-2)]"><X className="w-5 h-5"/></button>
                            </div>
                        )}
                        
                        <div className="chat-input-box rounded-xl shadow-lg text-left border flex flex-col">
                            <div
                                className="grow-wrap max-h-48 overflow-y-auto"
                                data-replicated-value={input}
                            >
                                <textarea
                                    ref={textareaRef}
                                    placeholder={placeholder}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-5 pt-3 pb-2 text-base placeholder-[var(--text-secondary)] focus:outline-none resize-none bg-transparent"
                                />
                            </div>

                            <div className="px-5 pt-2 pb-2 flex justify-between items-center">
                                <div className="flex items-center space-x-1 text-[var(--text-secondary)] relative">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    
                                    <button onClick={() => setIsToolPopoverOpen(p => !p)} className="p-2 hover:bg-[var(--surface-2)] rounded-full" aria-label="Open tools">
                                        <Plus className="w-5 h-5"/>
                                    </button>
                                    
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[var(--surface-2)] rounded-full" aria-label="Attach file"><Paperclip className="w-5 h-5"/></button>

                                    {activeTool && (
                                        <div className="flex items-center gap-2 pl-3 pr-2 py-1 bg-[var(--surface-accent)] rounded-full text-sm font-medium text-[var(--text-primary)] animate-in fade-in duration-200">
                                            {React.cloneElement(MODES[activeTool]!.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                                            <span>{MODES[activeTool]!.name}</span>
                                            <button onClick={() => setActiveTool(null)} className="p-1 hover:bg-[var(--surface-2)] rounded-full">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    
                                    {isToolPopoverOpen && (
                                        <div className="absolute bottom-full mb-2 w-60 bg-[var(--surface)] rounded-lg shadow-xl border border-[var(--border)] z-10 animate-in fade-in duration-150">
                                            {CHAT_INPUT_TOOLS.map(toolMode => {
                                                const details = MODES[toolMode];
                                                return <button key={toolMode} onClick={() => handleToolSelect(toolMode)} className="w-full text-left px-4 py-3 hover:bg-[var(--surface-2)] flex items-center gap-3">
                                                    {React.cloneElement(details.icon as React.ReactElement<{ className?: string }>, {className: 'w-5 h-5 text-[var(--text-secondary)]'})}
                                                    <span className="font-semibold text-[var(--text-primary)]">{details.name}</span>
                                                </button>
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <button onClick={() => setIsModelSelectorOpen(prev => !prev)} className="flex items-center space-x-1 text-[var(--text-secondary)] font-normal px-3 py-1 text-sm hover:bg-[var(--surface-2)] rounded-lg">
                                            <span className="hidden sm:inline">{CHAT_MODELS.find(m => m.id === selectedModel)?.name || 'Select Model'}</span>
                                            <span className="sm:hidden"><Sparkles className="w-4 h-4"/></span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {isModelSelectorOpen && (
                                            <div className="absolute bottom-full right-0 mb-2 w-72 bg-[var(--surface)] rounded-lg shadow-xl border border-[var(--border)] z-10 animate-in fade-in duration-150">
                                                {CHAT_MODELS.map(model => (
                                                    <button key={model.id} onClick={() => { setSelectedModel(model.id); setIsModelSelectorOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[var(--surface-2)] flex items-center justify-between">
                                                        <div><p className="font-semibold text-[var(--text-primary)]">{model.name}</p><p className="text-xs text-[var(--text-secondary)]">{model.description}</p></div>
                                                        {selectedModel === model.id && <Check className="w-5 h-5 text-[var(--accent)]"/>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => handleSubmit()} disabled={isLoading || (!input.trim() && !file)} className="send-button w-9 h-9 flex items-center justify-center rounded-lg hover:bg-opacity-90 transition-all active:scale-95" aria-label="Send message">
                                        {isLoading ? <Loader /> : <ArrowUp className="w-5 h-5"/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tool Sidebar */}
            {isToolSidebarOpen && (
                <div className="w-[480px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col animate-slide-in-from-right">
                    <ToolSidebar onClose={() => setIsToolSidebarOpen(false)} onSwitchMode={onSwitchMode} />
                </div>
            )}
        </div>
    );
};