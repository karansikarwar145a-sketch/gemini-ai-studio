import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Loader } from '../../../components/Loader';
import { X, Search } from '../../../components/icons';
import './Index.css';

declare var marked: any;

export type TimelineEvent = {
    year: number;
    title: string;
    description: string;
};

const PREDEFINED_CATEGORIES = [
    {
        name: 'Ancient History',
        topics: ['Indus Valley Civilization', 'The Mauryan Empire', 'The Gupta Period'],
    },
    {
        name: 'Medieval History',
        topics: ['The Delhi Sultanate', 'The Mughal Empire', 'Vijayanagara Empire'],
    },
    {
        name: 'Modern History',
        topics: ['The Revolt of 1857', 'Indian Freedom Struggle (1885-1919)', 'Gandhian Era (1920-1947)'],
    },
    {
        name: 'Post-Independence',
        topics: ['Integration of Princely States', 'Indo-Pak Wars', 'Economic Reforms of 1991'],
    },
];

const EventDetailModal: React.FC<{ event: TimelineEvent; onClose: () => void; ai: GoogleGenAI | null; }> = ({ event, onClose, ai }) => {
    const [details, setDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchDetails = async () => {
        if (!ai) {
            setError('AI service not available.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const prompt = `Provide a detailed explanation of the historical event "${event.title}" which occurred around the year ${event.year}. Explain its causes, key happenings, consequences, and overall significance in the context of Indian history. Format the response in clear Markdown.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setDetails(response.text);
        } catch (e) {
            setError('Failed to fetch details. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content timeline-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{event.title} ({event.year})</h2>
                    <button onClick={onClose} className="modal-close-btn"><X className="w-6 h-6" /></button>
                </div>
                <div className="timeline-modal-body">
                    <p className="event-initial-description">{event.description}</p>
                    <hr />
                    {details ? (
                        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(details) }}></div>
                    ) : (
                        <div className="learn-more-section">
                            {isLoading ? <Loader /> : error ? <p className="error">{error}</p> : (
                                <button className="action-button primary" onClick={fetchDetails}>
                                    Learn More with AI
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const HistoryTimelineApp: React.FC = () => {
    const [view, setView] = useState<'config' | 'loading' | 'results'>('config');
    const [topic, setTopic] = useState('');
    const [events, setEvents] = useState<TimelineEvent[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service.");
        }
    }, []);

    const handleGenerateTimeline = async (currentTopic: string) => {
        if (!aiRef.current) {
            setError('AI Service not initialized.');
            return;
        }
        setView('loading');
        setTopic(currentTopic);
        setError(null);
        setEvents(null);

        const prompt = `You are a historical expert. For the topic "${currentTopic}", generate a timeline of the 15-20 most significant events. For each event, provide the year, a concise title, and a brief one-sentence description. Return the result as a valid JSON array of objects, sorted chronologically by year.`;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                year: { type: Type.NUMBER },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                            },
                            required: ['year', 'title', 'description']
                        }
                    }
                }
            });

            const generatedEvents = JSON.parse(response.text);
            setEvents(generatedEvents);
            setView('results');

        } catch (err) {
            console.error("Timeline generation failed:", err);
            setError("Failed to generate the timeline. The AI may have returned an invalid response or the topic was too ambiguous. Please try again.");
            setView('config');
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            handleGenerateTimeline(topic.trim());
        }
    };
    
    const handleReset = () => {
        setTopic('');
        setEvents(null);
        setError(null);
        setView('config');
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return (
                    <div className="card timeline-loading-container">
                        <h3>AI is travelling back in time...</h3>
                        <p>Generating a historical timeline for '{topic}'.</p>
                        <div className="loading-indicator"><div></div><div></div><div></div></div>
                    </div>
                );
            case 'results':
                return (
                    <>
                        <header className="timeline-header">
                            <h1 className="font-serif">{topic}</h1>
                            <button onClick={handleReset} className="action-button secondary">New Timeline</button>
                        </header>
                        <div className="timeline-wrapper">
                            <div className="timeline-line"></div>
                            <div className="timeline-events">
                                {events && events.map((event, index) => (
                                    <div key={event.year + event.title} className="timeline-item" style={{ animationDelay: `${index * 100}ms` }}>
                                        <div className="timeline-item-content">
                                            <div className="timeline-year">{event.year}</div>
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-card" onClick={() => setSelectedEvent(event)}>
                                                <h4>{event.title}</h4>
                                                <p>{event.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );
            case 'config':
            default:
                return (
                     <div className="timeline-config-view">
                        <header className="timeline-header">
                            <h1 className="font-serif">History Timeline Generator</h1>
                            <p>Select a pre-defined topic or enter your own to generate an interactive timeline.</p>
                        </header>
                        
                        {error && <p className="error" style={{textAlign: 'center', marginBottom: '1.5rem'}}>{error}</p>}
                        
                        <div className="topic-categories-grid">
                            {PREDEFINED_CATEGORIES.map(category => (
                                <div key={category.name} className="topic-category-card">
                                    <h3>{category.name}</h3>
                                    <div className="topic-buttons-grid">
                                        {category.topics.map(topicName => (
                                            <button key={topicName} className="topic-button" onClick={() => handleGenerateTimeline(topicName)}>
                                                {topicName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="custom-topic-divider">
                            <span>OR</span>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="timeline-form">
                            <div className="form-group">
                                <label htmlFor="topic-input">Generate a timeline for any topic</label>
                                <div className="custom-topic-input-wrapper">
                                    <input
                                        type="text"
                                        id="topic-input"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., The life of Ashoka the Great"
                                    />
                                    <button type="submit" disabled={!topic.trim()}><Search className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </form>
                    </div>
                );
        }
    };

    return (
        <div className="timeline-app-container">
            {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} ai={aiRef.current} />}
            {renderContent()}
        </div>
    );
};
