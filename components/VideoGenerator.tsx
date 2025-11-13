import React, { useState, useEffect, useRef } from 'react';
import { generateVideoFromImage, generateVideoFromText } from '../services/geminiService';
import { Loader } from './Loader';
import { Paperclip, X } from './icons';

if (typeof window !== 'undefined' && !(window as any).aistudio) {
    (window as any).aistudio = {
        hasSelectedApiKey: async () => true,
        openSelectKey: async () => console.log("Opening API key selection..."),
    };
}

const loadingMessages = [
    "Warming up the digital canvas...", "Teaching pixels to dance...", "Composing a symphony of light and color...",
    "Assembling the dream sequence...", "Waiting for the director's call...", "Rendering cinematic magic...",
    "Finalizing the special effects...", "This can take a few minutes, please wait..."
];

interface VideoGeneratorModalProps {
  onClose: () => void;
  onComplete: (videoUrl: string) => void;
}

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({ onClose, onComplete }) => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const checkApiKey = async () => {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setCurrentLoadingMessage(prev => loadingMessages[(loadingMessages.indexOf(prev) + 1) % loadingMessages.length]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSelectKey = async () => {
        await (window as any).aistudio.openSelectKey();
        setApiKeySelected(true);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt && !imageFile) { setError('Please provide a text prompt or an image.'); return; }

        setIsLoading(true); setError(null); setCurrentLoadingMessage(loadingMessages[0]);

        try {
            const videoUrl = imageFile
                ? await generateVideoFromImage(imageFile, aspectRatio, prompt)
                : await generateVideoFromText(prompt, aspectRatio);
            onComplete(videoUrl);
            onClose();
        } catch (err) {
            const errorMessage = (err as Error).message;
            setError(`Failed to generate video: ${errorMessage}`);
            if (errorMessage.includes("Requested entity was not found")) {
                setError("API Key validation failed. Please select your API key again.");
                setApiKeySelected(false);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        if (!apiKeySelected) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">API Key Required</h2>
                    <p className="mb-6 max-w-md text-[var(--text-secondary)]">
                        Video generation requires you to select your own API key. Ensure your project is set up for billing.
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">Learn more</a>
                    </p>
                    <button onClick={handleSelectKey} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Select API Key
                    </button>
                </div>
            );
        }
        if (isLoading) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[300px]">
                    <Loader />
                    <p className="mt-4 text-lg text-[var(--text-secondary)]">{currentLoadingMessage}</p>
                </div>
            )
        }
        return (
            <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center">Create a Video</h2>
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Prompt</label>
                    <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A neon hologram of a cat driving at top speed" className="w-full p-3 bg-[var(--surface)] rounded-lg focus:ring-2 focus:ring-blue-500 border border-[var(--border)]" rows={3}/>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Starting Image (Optional)</label>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-accent)] rounded-lg hover:bg-[var(--surface-2)] border border-[var(--border)] text-sm">
                                <Paperclip className="w-4 h-4" />
                                <span>{imageFile ? "Change" : "Upload"}</span>
                            </button>
                            {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                        {(['16:9', '9:16'] as const).map(ratio => (
                            <button key={ratio} type="button" onClick={() => setAspectRatio(ratio)} className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${aspectRatio === ratio ? 'border-blue-500 bg-blue-500/10 text-blue-700' : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'}`}>
                                {ratio} {ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                            </button>
                        ))}
                    </div>
                </div>
                {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    Generate Video
                </button>
            </form>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-in fade-in-25">
            <div className="bg-[var(--surface-accent)] rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] z-10">
                    <X className="w-6 h-6"/>
                </button>
                {renderContent()}
            </div>
        </div>
    );
};