import React from 'react';
import { X, MessageCircleQuestion } from './icons';
import { AlgoLearnApp } from '../ExaModes/UpscTools/AlgoLearnApp/Index.tsx';

interface AlgoLearnSidebarProps {
    onClose: () => void;
}

export const AlgoLearnSidebar: React.FC<AlgoLearnSidebarProps> = ({ onClose }) => {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-3 border-b border-[var(--border)] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="w-6 h-6 text-[var(--primary)]" />
                    <h2 className="font-semibold text-lg">AlgoLearn Tutor</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-accent)]">
                    <X className="w-5 h-5" />
                </button>
            </header>
            <div className="flex-1 min-h-0">
                <AlgoLearnApp onAnalysisComplete={() => {}} initialData={null} />
            </div>
        </div>
    );
};