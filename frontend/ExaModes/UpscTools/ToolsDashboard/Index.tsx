import React from 'react';
import { Mode } from '../../../types';
import { UPSC_TOOLS_LIST, MODES } from '../../../constants';
import './Index.css';

interface ToolsDashboardProps {
  onSwitchMode: (mode: Mode) => void;
}

export const ToolsDashboard: React.FC<ToolsDashboardProps> = ({ onSwitchMode }) => {
  return (
    <div className="tools-dashboard-container">
      <div className="tools-dashboard-header">
        <h1 className="font-serif">UPSC Toolkit</h1>
        <p>A suite of AI-powered tools designed to supercharge your exam preparation.</p>
      </div>
      <div className="tools-grid">
        {UPSC_TOOLS_LIST.map(tool => {
          const toolDetails = MODES[tool.id];
          return (
            <button key={tool.id} className="tool-card" onClick={() => onSwitchMode(tool.id)}>
              <div className="tool-card-icon">
                {/* FIX: Add type assertion to resolve cloneElement overload error, as seen in other components. */}
                {React.cloneElement(toolDetails.icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
              </div>
              <div className="tool-card-content">
                <h3>{toolDetails.name}</h3>
                <p>{tool.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};