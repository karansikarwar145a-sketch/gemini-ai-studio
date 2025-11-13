import React from 'react';
import { Menu, Undo, Redo, FilePlus, Network, Trash2, FilePenLine, Locate, Palette, Download, Sparkles, Zap, FileCode, StickyNote } from '../../components/icons';
import { Loader } from '../../components/Loader';

interface ToolbarProps {
    onNewMap: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isSidebarVisible: boolean;
    onToggleSidebar: () => void;
    onExportPNG: () => void;
    onExportHTML: () => void;
    selectedNodeId: string | null;
    onAddChildNode: () => void;
    onDeleteNode: () => void;
    onEditNode: () => void;
    onEditCard: () => void;
    onCenterView: () => void;
    onExtendNode: () => void;
    isLoadingAI: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
    onNewMap,
    onUndo, onRedo, canUndo, canRedo,
    isSidebarVisible, onToggleSidebar, onExportPNG, onExportHTML,
    selectedNodeId, onAddChildNode, onDeleteNode, onEditNode, onEditCard, onCenterView,
    onExtendNode, isLoadingAI
}) => {
    return (
        <header className="brainstorm-header">
            <div className="header-group left">
                <button className="header-btn" title="Menu"><Menu className="w-5 h-5" /></button>
                <div className="header-btn-separator"></div>
                <div className="header-app-title">
                    <Zap className="w-5 h-5" />
                    <span className="header-title">mindZ</span>
                </div>
                <div className="header-btn-separator"></div>
                <button className="header-btn" onClick={onNewMap} title="New Map"><FilePlus className="w-5 h-5" /></button>
                <button className="header-btn" onClick={onExportPNG} title="Export as PNG"><Download className="w-5 h-5" /></button>
                <button className="header-btn" onClick={onExportHTML} title="Export as HTML"><FileCode className="w-5 h-5" /></button>
            </div>
            <div className="header-group center">
                 <button className="header-btn" onClick={onUndo} disabled={!canUndo} title="Undo"><Undo className="w-5 h-5" /></button>
                <button className="header-btn" onClick={onRedo} disabled={!canRedo} title="Redo"><Redo className="w-5 h-5" /></button>
                <div className="header-btn-separator"></div>
                <button className="header-btn" onClick={onExtendNode} disabled={!selectedNodeId || isLoadingAI} title="Extend with AI">
                    {isLoadingAI ? <Loader /> : <Sparkles className="w-5 h-5" />}
                </button>
                <button className="header-btn" onClick={onAddChildNode} disabled={!selectedNodeId} title="Add Child Node"><Network className="w-5 h-5" /></button>
                <button className="header-btn" onClick={onEditNode} disabled={!selectedNodeId} title="Edit Node Name"><FilePenLine className="w-5 h-5" /></button>
                <button className="header-btn" onClick={onEditCard} disabled={!selectedNodeId} title="Edit Card"><StickyNote className="w-5 h-5" /></button>
                <button className="header-btn" onClick={onDeleteNode} disabled={!selectedNodeId} title="Delete Node"><Trash2 className="w-5 h-5" /></button>
                <div className="header-btn-separator"></div>
                <button className="header-btn" onClick={onCenterView} title="Center View"><Locate className="w-5 h-5" /></button>
            </div>
            <div className="header-group right">
                 <button className="header-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
                    <Palette className="w-5 h-5" />
                 </button>
            </div>
        </header>
    );
};