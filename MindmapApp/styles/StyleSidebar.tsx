import React, { useState } from 'react';
import { ChevronDown } from '../../components/icons';

// Define theme colors for swatches
const SWATCH_COLORS: Record<string, string[]> = {
    Default: ['#1F2937', '#E5E7EB', '#D1D5DB', '#9CA3AF'],
    Dawn: ['#78350F', '#FDE68A', '#FCD34D', '#FBBF24'],
    Dusk: ['#D1D5DB', '#374151', '#4B5563', '#6B7280'],
    Ocean: ['#0C4A6E', '#7DD3FC', '#38BDF8', '#0EA5E9'],
};

interface StyleSidebarProps {
    themes: string[];
    activeTheme: string;
    onSetTheme: (theme: string) => void;
    fonts: string[];
    activeFont: string;
    onSetFont: (font: string) => void;
    activeLayout: string;
    onSetLayout: (layout: string) => void;
}

export const StyleSidebar: React.FC<StyleSidebarProps> = ({
    themes, activeTheme, onSetTheme,
    fonts, activeFont, onSetFont,
    activeLayout, onSetLayout,
}) => {
    const [activeTab, setActiveTab] = useState<'style' | 'map'>('style');

    const renderStyleTab = () => (
        <>
            <div className="sidebar-section">
                <h3 className="sidebar-section-title">Theme</h3>
                <div className="theme-picker">
                    {themes.map(theme => (
                        <div
                            key={theme}
                            className={`theme-swatch ${activeTheme === theme ? 'active' : ''}`}
                            onClick={() => onSetTheme(theme)}
                        >
                            <div className="theme-swatch-inner">
                                <div className="theme-swatch-colors">
                                    {(SWATCH_COLORS[theme] || []).map((color, i) => (
                                        <div key={i} className="theme-swatch-color" style={{ backgroundColor: color }}></div>
                                    ))}
                                </div>
                                <div className="theme-swatch-name">{theme}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="sidebar-section">
                <h3 className="sidebar-section-title">Text</h3>
                <div className="dropdown-container">
                    <select value={activeFont} onChange={(e) => onSetFont(e.target.value)}>
                        {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                    <ChevronDown className="dropdown-icon" />
                </div>
                <div className="placeholder-control" style={{ marginTop: '1rem' }}>
                    <label>Text Color</label>
                    <input type="color" value="#334155" disabled />
                </div>
            </div>
             <div className="sidebar-section">
                <h3 className="sidebar-section-title">Branch</h3>
                 <div className="placeholder-control">
                    <label>Branch Color</label>
                    <input type="color" value="#CBD5E0" disabled />
                </div>
            </div>
        </>
    );

    const renderMapTab = () => (
        <div className="sidebar-section">
            <h3 className="sidebar-section-title">Layout</h3>
            <div className="dropdown-container">
                <select value={activeLayout} onChange={(e) => onSetLayout(e.target.value)}>
                    <option>Logic Chart (Right)</option>
                    <option>Tree Chart (Down)</option>
                    <option>Mind Map (Radial)</option>
                    <option>Org Chart (Top Down)</option>
                </select>
                <ChevronDown className="dropdown-icon" />
            </div>
        </div>
    );

    return (
        <aside className="style-sidebar">
            <div className="sidebar-tabs">
                <button className={`sidebar-tab ${activeTab === 'style' ? 'active' : ''}`} onClick={() => setActiveTab('style')}>Style</button>
                <button className={`sidebar-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Map</button>
            </div>
            <div className="sidebar-content">
                {activeTab === 'style' ? renderStyleTab() : renderMapTab()}
            </div>
        </aside>
    );
};