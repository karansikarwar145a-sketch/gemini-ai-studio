import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import './Index.css';

// === HELPER FUNCTIONS (Audio Encoding/Decoding) ===
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type Blob = {
    data: string;
    mimeType: string;
};

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const calculateRMS = (data: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    const gain = 10; 
    return Math.max(0, Math.min(1, rms * gain));
};


// === TYPE DEFINITIONS ===
type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

export type TranscriptEntry = {
    speaker: 'Mentor' | 'You';
    text: string;
};

const formatTranscriptAsMarkdown = (transcript: TranscriptEntry[]): string => {
    let content = `# Mentor Call Transcript\n\n`;
    transcript.forEach(entry => {
        content += `**${entry.speaker}:** ${entry.text}\n\n`;
    });
    return content;
};

const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};


// === COMPONENT ===
export const MentorCallApp: React.FC<{
    onCallComplete?: (transcript: TranscriptEntry[]) => void;
    initialData?: TranscriptEntry[] | null;
}> = ({ onCallComplete, initialData }) => {
    const [callState, setCallState] = useState<CallState>(initialData ? 'ended' : 'idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>(initialData || []);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [audioLevels, setAudioLevels] = useState({ user: 0, ai: 0 });
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
    const [language, setLanguage] = useState('en-IN');


    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const durationTimerRef = useRef<number | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const userLevelRef = useRef(0);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI service.");
            setCallState('error');
        }
        
        return () => {
            // Cleanup on unmount
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.close());
            }
            mediaStreamRef.current?.getTracks().forEach(track => track.stop());
            if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
                inputAudioContextRef.current.close();
            }
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
                outputAudioContextRef.current.close();
            }
            if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current);
            }
        };
    }, []);

     useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    useEffect(() => {
        if (callState !== 'active') {
             if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current);
                durationTimerRef.current = null;
            }
            return;
        };
    
        if (isMuted) {
            scriptProcessorRef.current?.disconnect();
             if (durationTimerRef.current) { // Also pause timer when muted
                clearInterval(durationTimerRef.current);
                durationTimerRef.current = null;
            }
        } else {
            if (mediaStreamSourceRef.current && scriptProcessorRef.current && inputAudioContextRef.current?.destination) {
                try { scriptProcessorRef.current.disconnect(); } catch (e) { /* Fails if not connected, that's OK */ }
                mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            }
             if (!durationTimerRef.current) {
                durationTimerRef.current = window.setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            }
        }
    }, [isMuted, callState]);

    useEffect(() => {
        let animationFrameId: number;
        let decayIntervalId: number;

        if (callState === 'active') {
            const animate = () => {
                setAudioLevels(prev => ({ ...prev, user: userLevelRef.current }));
                animationFrameId = requestAnimationFrame(animate);
            };
            animate();

            decayIntervalId = window.setInterval(() => {
                userLevelRef.current *= 0.8; // Decay user level in ref
                setAudioLevels(prev => ({
                    ...prev,
                    ai: Math.max(0, prev.ai * 0.75) // Decay AI level in state
                }));
            }, 50);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(decayIntervalId);
        };
    }, [callState]);


    const handleStartCall = async () => {
        if (!aiRef.current) return;
        setCallState('connecting');
        setError(null);
        setTranscript([]);
        setCallDuration(0);
        setIsMuted(false);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);
            
            let systemInstruction = `You are INVICTUS, a friendly and expert AI mentor for UPSC. The user has started a 1:1 doubt-solving call. Your goal is to listen carefully to their questions and provide clear, concise, and accurate answers. Keep your responses conversational and encouraging.`;

            switch (language) {
                case 'en-IN':
                    systemInstruction += ` Please speak in English with a neutral Indian accent. Start by saying 'Hello! This is INVICTUS. How can I help you with your preparation today?'`;
                    break;
                case 'hi-IN':
                    systemInstruction = `You are INVICTUS, a friendly AI mentor for UPSC. You MUST converse entirely in Hindi. Start the conversation by saying 'Namaste! Main INVICTUS hoon. Aaj main aapki taiyaari mein kaise madad kar sakta hoon?'`;
                    break;
                case 'hinglish':
                    systemInstruction += ` You should be able to understand and respond in a natural mix of Hindi and English (Hinglish), as is common in India. Start by saying 'Hello! This is INVICTUS. How can I help you with your preparation today?'`;
                    break;
                default: // en-US
                    systemInstruction += ` Start by saying 'Hello! This is INVICTUS. How can I help you with your preparation today?'`;
            }

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            userLevelRef.current = calculateRMS(inputData);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        setCallState('active');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of audioSourcesRef.current.values()) {
                                try { source.stop(); } catch (e) { /* already stopped */ }
                                audioSourcesRef.current.delete(source);
                            }
                            if (outputAudioContextRef.current) {
                                nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
                            } else {
                                nextStartTimeRef.current = 0;
                            }
                        }

                        if (message.serverContent?.inputTranscription) {
                            const userText = (currentInputTranscription + message.serverContent.inputTranscription.text).toLowerCase().trim();
                            const endCallPhrases = ["end call", "stop the call", "terminate the call", "end the session"];
                            if (endCallPhrases.some(phrase => userText.includes(phrase))) {
                                setTimeout(() => handleEndCall(), 100);
                                return;
                            }
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            if(currentInputTranscription.trim()) setTranscript(prev => [...prev, { speaker: 'You', text: currentInputTranscription.trim() }]);
                            if(currentOutputTranscription.trim()) setTranscript(prev => [...prev, { speaker: 'Mentor', text: currentOutputTranscription.trim() }]);
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);

                            const audioData = audioBuffer.getChannelData(0);
                            const level = calculateRMS(audioData);
                            setAudioLevels(prev => ({ ...prev, ai: Math.max(prev.ai, level) }));

                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred. Please try again.');
                        setCallState('error');
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction,
                },
            });
        } catch (err) {
            console.error(err);
            setError("Could not access the microphone. Please grant permission and try again.");
            setCallState('error');
        }
    };

    const handleToggleMute = () => setIsMuted(prev => !prev);

    const handleEndCall = async () => {
        setCallState('ended');
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        try { scriptProcessorRef.current?.disconnect(); } catch(e) {}
        
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }

        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }

        if (onCallComplete && !initialData) {
            setTranscript(currentTranscript => {
                onCallComplete(currentTranscript);
                return currentTranscript;
            });
        }
    };

    const handleCopyTranscript = () => {
        const transcriptText = transcript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n\n');
        navigator.clipboard.writeText(transcriptText).then(() => {
            setIsToolsMenuOpen(false); // Close menu after copying
        });
    };

    const handleExport = () => {
        setIsDownloading(true);
        const markdownContent = formatTranscriptAsMarkdown(transcript);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Mentor_Call_Transcript_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };

    const renderIdle = () => (
        <div className="mentor-call-idle-container">
            <div className="idle-orb-container">
                <div className="idle-orb"></div>
            </div>
            <h2>1:1 Mentor Call</h2>
            <p>Have a quick doubt? Start a live audio call with your AI mentor for instant clarification. Your conversation will be transcribed and saved.</p>
             <div className="call-setup-options">
                <label htmlFor="language-select">Language</label>
                <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en-IN">English (Indian Accent)</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="hinglish">Bilingual (Hinglish)</option>
                </select>
            </div>
            <button className="start-call-button" onClick={handleStartCall}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                <span>Start Call</span>
            </button>
        </div>
    );

    const renderActive = () => (
        <div 
            className={`mentor-call-active-container ${isMuted ? 'is-muted' : ''} ${isTranscriptVisible ? 'transcript-visible' : ''}`}
            style={{ 
                '--user-level': audioLevels.user, 
                '--ai-level': audioLevels.ai,
                '--combined-level': Math.max(audioLevels.user, audioLevels.ai)
            } as React.CSSProperties}
        >
            <div className="call-background-particles"></div>
            <div className="call-header">
                <div className="call-status">
                    <div className="pulsating-dot"></div>
                    <span>{isMuted ? 'Muted' : 'Live'}</span>
                </div>
                <div className="call-timer">{formatDuration(callDuration)}</div>
            </div>

            <div className="call-visuals">
                <div className="mentor-call-orb"></div>
                <div className="circular-visualizer">
                    <div className="ring"></div>
                    <div className="ring"></div>
                    <div className="ring"></div>
                </div>
            </div>

            {isTranscriptVisible && (
                <div className="live-transcript-panel">
                     <div className="transcript-content">
                        {transcript.map((entry, index) => (
                            <div key={index} className={`transcript-entry-${entry.speaker.toLowerCase()}`}>
                                <span className="transcript-speaker">{entry.speaker}</span>
                                <span className="transcript-text">{entry.text}</span>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>
            )}
            
            <div className="call-controls-new">
                 <div className="tools-menu-container-new" ref={toolsMenuRef}>
                    <button onClick={() => setIsToolsMenuOpen(prev => !prev)} className="control-button-new" aria-label="Open tools menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                    </button>
                    {isToolsMenuOpen && (
                        <div className="call-tools-menu">
                            <button onClick={() => { setIsTranscriptVisible(prev => !prev); setIsToolsMenuOpen(false); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span>{isTranscriptVisible ? 'Hide Transcript' : 'Show Transcript'}</span>
                            </button>
                             <button onClick={handleCopyTranscript}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy Transcript</span>
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={handleToggleMute} className="control-button-new" aria-label={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> :
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    }
                </button>
                <button onClick={handleEndCall} className="control-button-new end-call-btn" aria-label="End call">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <g transform="translate(12 12) rotate(135) scale(0.85) translate(-12 -12)">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </g>
                    </svg>
                </button>
            </div>
        </div>
    );

    const renderEnded = () => (
        <div className="card mentor-call-ended-container">
            <h2>Call Summary</h2>
            <div className="transcript-review-wrapper">
                <div className="transcript-header">
                    <h4>Call Transcript</h4>
                    <span>Duration: {formatDuration(callDuration)}</span>
                </div>
                <div className="transcript-container review">
                    {transcript.length > 0 ? transcript.map((entry, index) => (
                        <div key={index} className={`transcript-entry-${entry.speaker.toLowerCase()}`}>
                            <div className="transcript-speaker">{entry.speaker}</div>
                            <div className="transcript-text">{entry.text}</div>
                        </div>
                    )) : <p className="transcript-placeholder">The call ended before any conversation was transcribed.</p>}
                </div>
            </div>
            <div className="results-actions">
                <button className="action-button secondary" onClick={handleExport} disabled={isDownloading || transcript.length === 0}>
                    {isDownloading ? 'Exporting...' : 'Export Transcript'}
                </button>
                <button className="action-button primary" onClick={() => { setCallState('idle'); setTranscript([]); }}>Start a New Call</button>
            </div>
        </div>
    );

    return (
        <div className="mentor-call-container">
            {callState === 'idle' && renderIdle()}
            {callState === 'connecting' && <div className="card" style={{textAlign: 'center'}}><p>Connecting and accessing microphone...</p><div className="loading-indicator" style={{margin: '1rem auto'}}><div></div><div></div><div></div></div></div>}
            {callState === 'active' && renderActive()}
            {callState === 'ended' && renderEnded()}
            {callState === 'error' && <div className="card error"><p>{error}</p><button className="action-button secondary" onClick={() => setCallState('idle')}>Try Again</button></div>}
        </div>
    );
};
