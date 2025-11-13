import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: 'LiveSession' is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, encode, decodeAudioData } from '../services/audioUtils';
import { Mode } from '../types';
import { Play, StopCircle, Mic } from './icons';

interface LiveAgentProps {
  mode: Mode;
}

export const LiveAgent: React.FC<LiveAgentProps> = ({ mode }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ user: string; model: string; }[]>([]);
  const [currentTurn, setCurrentTurn] = useState({ user: '', model: '' });
  const [status, setStatus] = useState('Idle. Press Start to begin.');

  // FIX: Type the session promise ref as 'any' since 'LiveSession' is not exported.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const enableTranscription = mode === Mode.AudioTranscription;

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsSessionActive(false);
    setStatus('Session ended. Press Start to begin again.');
  }, []);

  const startSession = useCallback(async () => {
    if (isSessionActive) return;
    setStatus('Initializing session...');
    setTranscriptions([]);
    setCurrentTurn({ user: '', model: '' });

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                ...(enableTranscription ? { inputAudioTranscription: {}, outputAudioTranscription: {} } : {}),
            },
            callbacks: {
                onopen: () => {
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
                        const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    setIsSessionActive(true);
                    setStatus('Connected. Start speaking...');
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (enableTranscription && message.serverContent?.inputTranscription) {
                        setCurrentTurn(prev => ({...prev, user: prev.user + message.serverContent!.inputTranscription!.text}));
                    }
                    if (enableTranscription && message.serverContent?.outputTranscription) {
                        setCurrentTurn(prev => ({...prev, model: prev.model + message.serverContent!.outputTranscription!.text}));
                    }
                    if (enableTranscription && message.serverContent?.turnComplete) {
                        setTranscriptions(prev => [...prev, currentTurn]);
                        setCurrentTurn({user: '', model: ''});
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        const currentTime = outputAudioContextRef.current.currentTime;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Live session error:", e);
                    setStatus(`Error: ${e.message}. Please try again.`);
                    stopSession();
                },
                onclose: () => {
                    setStatus('Session closed by server.');
                    stopSession();
                },
            },
        });
    } catch (err) {
        console.error("Failed to start session:", err);
        setStatus(`Error: ${(err as Error).message}`);
    }
  }, [isSessionActive, stopSession, enableTranscription, currentTurn]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <div className="flex flex-col h-full p-6 text-center">
        <div className="flex-shrink-0 mb-6">
            <button
                onClick={isSessionActive ? stopSession : startSession}
                className="px-8 py-3 rounded-full text-white font-semibold transition-transform duration-200 transform hover:scale-105 inline-flex items-center gap-2"
                style={{ background: isSessionActive ? 'linear-gradient(to right, #ef4444, #dc2626)' : 'linear-gradient(to right, #2563eb, #1d4ed8)' }}
            >
                {isSessionActive ? <StopCircle /> : <Play />}
                <span>{isSessionActive ? 'Stop Session' : 'Start Session'}</span>
            </button>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{status}</p>
        </div>

        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-y-auto p-4 space-y-4 text-left">
            {!isSessionActive && transcriptions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                    <Mic className="w-12 h-12" />
                    <p className="mt-2">{enableTranscription ? "Transcriptions will appear here." : "Start a session to talk with Gemini."}</p>
                </div>
            )}
            {enableTranscription && (
                <>
                    {transcriptions.map((turn, index) => (
                        <div key={index} className="p-3 bg-[var(--surface-accent)] rounded-lg">
                            <p><strong className="text-blue-600">You:</strong> {turn.user}</p>
                            <p><strong className="text-purple-600">Gemini:</strong> {turn.model}</p>
                        </div>
                    ))}
                    {isSessionActive && (currentTurn.user || currentTurn.model) && (
                        <div className="p-3 bg-[var(--surface-accent)] rounded-lg">
                           {currentTurn.user && <p><strong className="text-blue-600">You:</strong> {currentTurn.user}<span className="inline-block w-2 h-2 ml-1 bg-blue-500 rounded-full animate-pulse"></span></p>}
                           {currentTurn.model && <p><strong className="text-purple-600">Gemini:</strong> {currentTurn.model}<span className="inline-block w-2 h-2 ml-1 bg-purple-500 rounded-full animate-pulse"></span></p>}
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};