import React, { useState, useMemo } from 'react';
import { Mode } from '../../types';
import { TOOLS_DASHBOARD_DATA, MODES } from '../../constants';
import { Search } from '../../components/icons';
import './Index.css';

interface ToolsDashboardProps {
  onSwitchMode: (mode: Mode) => void;
}

export const ToolsDashboard: React.FC<ToolsDashboardProps> = ({ onSwitchMode }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return TOOLS_DASHBOARD_DATA;
    }
    const lowercasedTerm = searchTerm.toLowerCase();

    return TOOLS_DASHBOARD_DATA
      .map(section => {
        const filteredItems = section.items.filter(item => {
          const toolDetails = MODES[item.id];
          if (!toolDetails) return false;
          
          const nameMatch = toolDetails.name.toLowerCase().includes(lowercasedTerm);
          const descriptionMatch = item.description.toLowerCase().includes(lowercasedTerm);
          
          return nameMatch || descriptionMatch;
        });
        return { ...section, items: filteredItems };
      })
      .filter(section => section.items.length > 0);
  }, [searchTerm]);
  
  const hasResults = filteredData.length > 0;

  return (
    <div className="tools-dashboard-container">
      <div className="tools-dashboard-header">
        <h1 className="font-serif">UPSC Toolkit</h1>
        <p>A suite of AI-powered tools designed to supercharge your exam preparation.</p>
      </div>

      <div className="search-bar-wrapper">
        <div className="search-bar-container">
            <Search className="w-5 h-5" />
            <input
                type="text"
                placeholder="Search for a tool..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {hasResults ? (
        filteredData.map(section => (
          <section key={section.title} className="tool-section">
            <h2 className="tool-section-title">{section.title}</h2>
            <div className="app-grid">
              {section.items.map(tool => {
                const toolDetails = MODES[tool.id];
                if (!toolDetails) return null;
                return (
                  <button 
                    key={tool.id} 
                    className="app-card" 
                    onClick={() => onSwitchMode(tool.id)}
                    title={tool.description}
                  >
                    <div className="app-card-icon">
                      {React.cloneElement(toolDetails.icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
                    </div>
                    <span className="app-card-name">{toolDetails.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      ) : (
        <div className="no-results-container">
            <p>No tools found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};