import React, { useState } from 'react';
import { X, LayoutGrid } from './icons';
import { ArrowLeft } from 'lucide-react';
import { Mode } from '../types';
import { MODES, SIDEBAR_TOOLS, UPSC_TOOLS_LIST } from '../constants';

// Import all the tools that can be used in the sidebar
import { AlgoLearnApp } from '../ExaModes/UpscTools/AlgoLearnApp/Index.tsx';
import { BrainstormApp } from '../ExaModes/UpscTools/BrainstormApp/Index.tsx';
import { MicroTopicsApp } from '../ExaModes/UpscTools/MicroTopicsApp/Index.tsx';
import { PrelimsApp } from '../ExaModes/UpscTools/Papp/Index.tsx';

interface ToolSidebarProps {
    onClose: () => void;
    // Pass onSwitchMode to allow sidebar tools to change the main view if necessary
    onSwitchMode: (mode: Mode) => void;
}

const ToolDashboard: React.FC<{ onSelectTool: (mode: Mode) => void }> = ({ onSelectTool }) => {
    // Helper to find the description for a tool
    const getToolDescription = (toolId: Mode) => {
        const tool = UPSC_TOOLS_LIST.find(t => t.id === toolId);
        return tool ? tool.description : 'A powerful tool for your UPSC preparation.';
    };

    return (
        <div className="tool-sidebar-list">
            {SIDEBAR_TOOLS.map(toolMode => {
                const details = MODES[toolMode];
                const description = getToolDescription(toolMode);
                return (
                    <button key={toolMode} className="tool-sidebar-item" onClick={() => onSelectTool(toolMode)}>
                        <div className="tool-sidebar-item-icon">
                            {React.cloneElement(details.icon as React.ReactElement, { className: 'w-6 h-6' })}
                        </div>
                        <div className="tool-sidebar-item-text">
                            <span className="tool-sidebar-item-name">{details.name}</span>
                            <p className="tool-sidebar-item-desc">{description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export const ToolSidebar: React.FC<ToolSidebarProps> = ({ onClose, onSwitchMode }) => {
    const [activeTool, setActiveTool] = useState<Mode | null>(null);

    const renderActiveTool = () => {
        const emptyHandler = () => {};
        
        switch(activeTool) {
            case Mode.AlgoLearn:
                return <AlgoLearnApp onAnalysisComplete={emptyHandler} />;
            case Mode.BrainstormBuddy:
                return <BrainstormApp />;
            case Mode.MicroTopicExplorer:
                return <MicroTopicsApp 
                    onGenerateQuiz={(topic) => {
                        // This switches the main view to the Prelims Quiz tool
                        onSwitchMode(Mode.PrelimsQuiz); 
                        onClose();
                    }}
                    onAskChat={(topic) => {
                        // This switches the main view to Study Buddy and alerts the user
                        onSwitchMode(Mode.StudyBuddy);
                        onClose();
                        setTimeout(() => alert(`Switched to Study Buddy. Ask about: ${topic}`), 100);
                    }}
                    onAnalysisComplete={emptyHandler} 
                />;
            case Mode.PrelimsQuiz:
                return <PrelimsApp onQuizComplete={() => setActiveTool(null)} />;
            default:
                return <p className="p-4 text-center text-[var(--text-secondary)]">Tool not supported in sidebar.</p>;
        }
    };

    const toolName = activeTool ? MODES[activeTool].name : "Tools";

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-3 border-b border-[var(--border)] flex-shrink-0">
                <div className="flex items-center gap-2">
                    {activeTool ? (
                        <button onClick={() => setActiveTool(null)} className="p-2 -ml-1 rounded-full hover:bg-[var(--surface-accent)]">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <LayoutGrid className="w-6 h-6 text-[var(--primary)] ml-1" />
                    )}
                    <h2 className="font-semibold text-lg">{toolName}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-accent)]">
                    <X className="w-5 h-5" />
                </button>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto">
                {activeTool ? renderActiveTool() : <ToolDashboard onSelectTool={setActiveTool} />}
            </div>
        </div>
    );
};