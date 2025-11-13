import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Chat as GenAIChat } from "@google/genai";
import './Index.css';

declare var marked: any;

// === TYPE DEFINITIONS ===
type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export type AlgoLearnResult = {
    topic: string;
    history: ChatMessage[];
};

type FollowUpResponse = {
    answer: string;
    follow_up_questions: string[];
};

// Define the initial welcome message
const initialMessage: ChatMessage = {
    role: 'model',
    content: "Hello! I am AlgoLearn, your AI tutor. What would you like to learn about today?"
};


export const AlgoLearnApp: React.FC<{
    onAnalysisComplete: (result: AlgoLearnResult) => void;
    initialData?: AlgoLearnResult | null;
}> = ({ onAnalysisComplete, initialData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Chat state
    const [topic, setTopic] = useState(initialData?.topic || 'Algo Learn');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialData?.history || [initialMessage]);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState('');
    
    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatInstanceRef = useRef<GenAIChat | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const messageCountRef = useRef(0);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error(e);
            setError("Could not initialize AI service.");
        }
    }, []);

    useEffect(() => {
        // Only scroll if we are near the bottom, to avoid interrupting user scrolling
        if (chatEndRef.current) {
            const { scrollHeight, clientHeight, scrollTop } = chatEndRef.current.parentElement!;
            if (scrollHeight - scrollTop < clientHeight + 200) {
                 chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
        messageCountRef.current = chatHistory.length;
    }, [chatHistory, isLoading]);

    // Save state on unmount
    useEffect(() => {
        return () => {
            if (onAnalysisComplete && topic && chatHistory.length > 1 && !initialData) {
                onAnalysisComplete({
                    topic: topic,
                    history: chatHistory,
                });
            }
        };
    }, [onAnalysisComplete, topic, chatHistory, initialData]);

    const handleSendMessage = async (messageText: string) => {
        if (!aiRef.current || !messageText.trim()) return;
        
        // If this is the first real message, set it as the topic
        if (chatHistory.length === 1 && chatHistory[0] === initialMessage) {
            setTopic(messageText.trim());
        }

        setIsLoading(true);
        setError(null);
        setSuggestedQuestions([]);
        setChatHistory(prev => [...prev, { role: 'user', content: messageText }]);
        setChatInput(''); // Clear input after sending

        const systemInstruction = `You are 'AlgoLearn', an expert AI tutor on any subject. Your teaching style is concise, accurate, and engaging, similar to Perplexity. For every user query, you MUST respond with a single, valid JSON object and nothing else.

The JSON object must have this exact structure:
{
  "answer": "A clear, concise, and 'to the point' answer to the user's question, formatted in Markdown.",
  "follow_up_questions": [
    "A relevant and insightful follow-up question.",
    "Another interesting follow-up question.",
    "A third follow-up question to deepen understanding."
  ]
}

CRITICAL INSTRUCTIONS:
- Your 'answer' should be direct and avoid unnecessary fluff. Use Markdown for clarity (bolding, lists).
- The 'follow_up_questions' array MUST contain 3 to 4 distinct questions that logically extend the conversation or explore related concepts.
- Do not include any text, comments, or markdown formatting outside of the main JSON object.`;

        if (!chatInstanceRef.current) {
            chatInstanceRef.current = aiRef.current.chats.create({
                model: 'gemini-2.5-flash',
                history: chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] })),
                config: { 
                    systemInstruction,
                    tools: [{ googleSearch: {} }] 
                }
            });
        }
        
        try {
            const response = await chatInstanceRef.current.sendMessage({ message: messageText });
            let jsonString = response.text.trim();
            const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```|({[\s\S]*})/s);
            if (jsonMatch) {
                jsonString = jsonMatch[1] || jsonMatch[2];
            }
            
            const parsedResponse: FollowUpResponse = JSON.parse(jsonString);

            setChatHistory(prev => [...prev, { role: 'model', content: parsedResponse.answer }]);
            setSuggestedQuestions(parsedResponse.follow_up_questions);

        } catch (err: any) {
            console.error(err);
            const errorMessage = "Sorry, an error occurred while generating the response. The AI's reply might have been in an unexpected format. Please try again.";
            setError(errorMessage);
            setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setChatHistory([initialMessage]);
        setTopic('Algo Learn');
        setSuggestedQuestions([]);
        setError(null);
        setIsLoading(false);
        chatInstanceRef.current = null;
    };
    
    const handleFollowUpClick = (question: string) => {
        setChatInput('');
        handleSendMessage(question);
    };
    
    return (
        <div className="algo-learn-chat-container">
            <div className="algo-learn-history">
                <button className="action-button secondary new-topic-button-algo" onClick={handleReset}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                    <span>New Topic</span>
                </button>
                {chatHistory.map((msg, index) => {
                    const isNew = index >= messageCountRef.current;
                     return (
                         <div 
                             key={index} 
                             className={`chat-message-wrapper ${msg.role}-wrapper ${isNew ? 'new-message' : ''}`}
                         >
                            <div className="avatar">
                                {msg.role === 'model' ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.09 8.26 20 9.27 15.55 13.97 16.91 20.02 12 17.27 7.09 20.02 8.45 13.97 4 9.27 9.91 8.26 12 2z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                            </div>
                            <div className={`chat-message ${msg.role}-message`}>
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                            </div>
                        </div>
                    )
                })}
                {isLoading && (
                     <div className="chat-message-wrapper model-wrapper new-message">
                        <div className="avatar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.09 8.26 20 9.27 15.55 13.97 16.91 20.02 12 17.27 7.09 20.02 8.45 13.97 4 9.27 9.91 8.26 12 2z"></path></svg></div>
                        <div className="chat-message model-message pulsing-loader"><div></div><div></div><div></div></div>
                    </div>
                )}
                {!isLoading && suggestedQuestions.length > 0 && (
                    <div className="suggested-questions-container">
                        <h4>Related</h4>
                        <div className="suggested-questions-list">
                            {suggestedQuestions.map((q, i) => (
                                <button 
                                    key={i} 
                                    className="suggested-question" 
                                    onClick={() => handleFollowUpClick(q)}
                                    style={{ animationDelay: `${100 + i * 80}ms`}}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
            <div className="flex-shrink-0 pt-4 pb-2 md:pb-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
                <div className="w-full max-w-3xl mx-auto px-4">
                     <div className="chat-input-box rounded-xl shadow-lg text-left border flex flex-col">
                        <div className="grow-wrap" data-replicated-value={chatInput}>
                            <textarea
                                placeholder="What do you want to learn about?"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage(chatInput))}
                                className="w-full px-5 pt-3 pb-2 text-base placeholder-[var(--text-secondary)] focus:outline-none resize-none bg-transparent"
                                disabled={isLoading}
                                rows={1}
                            />
                        </div>
                        <div className="px-5 pt-2 pb-2 flex justify-end items-center">
                             <button onClick={() => handleSendMessage(chatInput)} disabled={isLoading || !chatInput.trim()} className="send-button w-9 h-9 flex items-center justify-center rounded-lg" aria-label="Send message">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};