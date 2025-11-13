import React, { useState } from 'react';
import { Message, MessageContent } from '../types';
import { User, Sparkles, Volume2 } from './icons';
import { getTextToSpeech } from '../services/geminiService';

declare var marked: any;

interface MessageDisplayProps {
  message: Message;
}

const renderContent = (content: MessageContent, index: number, isModel: boolean) => {
    if (typeof content === 'string') {
        const markdownClasses = isModel ? 'markdown-content' : 'markdown-content markdown-content-invert';
        return (
            <div
                key={index}
                className={markdownClasses}
                dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
            />
        );
    }
    if ('imageUrl' in content) {
        return <img key={index} src={content.imageUrl} alt="User content" className="mt-2 rounded-lg max-w-sm shadow-md" />;
    }
    if ('videoUrl' in content) {
        return <video key={index} src={content.videoUrl} controls autoPlay loop className="mt-2 rounded-lg max-w-sm shadow-md" />;
    }
    if ('audioUrl' in content) {
        return <audio key={index} src={content.audioUrl} controls className="mt-2" />;
    }
    if ('sources' in content) {
        return (
            <div key={index} className="mt-4 pt-3 border-t border-[var(--border)]">
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Sources:</h4>
                <div className="flex flex-wrap gap-2">
                    {content.sources.map((source, i) => (
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" key={i} className="text-xs bg-[var(--surface-accent)] text-[var(--text-secondary)] rounded-full px-3 py-1 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors">
                            {source.title || new URL(source.uri).hostname}
                        </a>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};


export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

    const isModel = message.role === 'model';

    const handleSpeak = async () => {
      if (isSpeaking && audioPlayer) {
          audioPlayer.pause();
          audioPlayer.currentTime = 0;
          setIsSpeaking(false);
          setAudioPlayer(null);
          return;
      }

      const textToSpeak = message.content.filter(c => typeof c === 'string').join('\n');
      if (!textToSpeak) return;

      setIsSpeaking(true);
      try {
        const audioUrl = await getTextToSpeech(textToSpeak);
        const audio = new Audio(audioUrl);
        setAudioPlayer(audio);
        audio.play();
        audio.onended = () => {
          setIsSpeaking(false);
          setAudioPlayer(null);
        };
      } catch (error) {
        console.error("TTS Error:", error);
        setIsSpeaking(false);
      }
    };
  
    const icon = isModel 
        ? <div className="w-8 h-8 flex items-center justify-center rounded-full message-bubble-model-icon text-white flex-shrink-0"><Sparkles className="w-5 h-5"/></div>
        : <div className="w-8 h-8 flex items-center justify-center rounded-full message-bubble-user-icon flex-shrink-0"><User className="w-5 h-5"/></div>;

    const messageContainerClasses = isModel
        ? "flex justify-start items-start gap-3"
        : "flex justify-end items-start gap-3";
    
    const messageBubbleClasses = isModel
        ? "message-bubble-model"
        : "message-bubble-user text-white shadow-md";

    if (message.role === 'model' && message.content.length === 0) {
        return null;
    }
    
    return (
        <div className={messageContainerClasses}>
            {isModel && icon}
            <div className={`p-4 max-w-2xl rounded-b-2xl ${isModel ? 'rounded-tr-2xl' : 'rounded-tl-2xl'} ${messageBubbleClasses}`}>
                <div className="space-y-3">
                    {message.content.map((content, index) => renderContent(content, index, isModel))}
                </div>
                {isModel && message.content.some(c => typeof c === 'string') && (
                     <button onClick={handleSpeak} className="text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] rounded-full p-1.5 mt-2 transition-colors">
                        <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-[var(--accent)]' : ''}`}/>
                    </button>
                )}
            </div>
            {!isModel && icon}
        </div>
    );
};