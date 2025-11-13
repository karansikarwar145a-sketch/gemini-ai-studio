import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ContentPanel } from './components/ContentPanel';
import { Mode } from './types';
import { MODES } from './constants';
import { Menu } from './components/icons';
// Import types for handlers
import { MicroTopicsResult } from './ExaModes/UpscTools/MicroTopicsApp/Index.tsx';
import { QuizResult } from './ExaModes/UpscTools/Papp/Index.tsx';


const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>(Mode.StudyBuddy);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light');

  // New state to pass initial data to tools
  const [toolInitialData, setToolInitialData] = useState<any>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleNewChat = () => {
    setActiveMode(Mode.StudyBuddy); // Reset to default mode on new chat
    setChatKey(prev => prev + 1);
    setToolInitialData(null); // Clear tool data
    setIsMobileSidebarOpen(false); // Close mobile sidebar on new chat
  };
  
  const switchMode = (mode: Mode) => {
    // When switching to a different tool via the sidebar, clear any lingering initial data
    if (mode !== activeMode) {
      setToolInitialData(null); 
    }
    setActiveMode(mode);
    setIsMobileSidebarOpen(false);
  };
  
  // Handlers for inter-tool communication
  const handleSelectTopicForNotes = (topic: string) => {
    setToolInitialData({ initialTopic: topic });
    setActiveMode(Mode.NotesGenerator);
  };

  const handleQuizComplete = (result: QuizResult) => {
    setToolInitialData(result);
    setActiveMode(Mode.PrelimsQuiz);
  };
  
  const handleMicroTopicsComplete = (result: MicroTopicsResult) => {
    setToolInitialData(result);
    setActiveMode(Mode.MicroTopicExplorer);
  };

  const handleStartQuiz = (topic: string) => {
    setToolInitialData({ initialTopic: topic });
    setActiveMode(Mode.PrelimsQuiz);
  };

  const handleStartChat = (topic: string) => {
    setActiveMode(Mode.StudyBuddy);
    // A simple alert to guide the user, as we don't want to overcomplicate ChatView
    setTimeout(() => alert(`Switched to Study Buddy. You can now ask about: ${topic}`), 100);
  };

  const activeModeDetails = MODES[activeMode];

  return (
    <div className="flex h-screen w-screen bg-[var(--background)] text-[var(--text-primary)] font-sans overflow-hidden">
      <Sidebar 
        activeMode={activeMode} 
        setActiveMode={switchMode}
        isCollapsed={isDesktopSidebarCollapsed}
        setIsCollapsed={setIsDesktopSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onNewChat={handleNewChat}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="flex-1 flex flex-col relative transition-all duration-300 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-3 border-b main-header flex-shrink-0">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2">
                <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-[var(--text-primary)]">{activeModeDetails.name}</h1>
            <div className="w-6"/>
        </header>

        <div className="flex-1 min-h-0">
          <ContentPanel 
            mode={activeMode} 
            key={chatKey} // Only remount on "New Chat"
            initialData={toolInitialData}
            onSelectTopicForNotes={handleSelectTopicForNotes}
            onQuizComplete={handleQuizComplete}
            onMicroTopicsComplete={handleMicroTopicsComplete}
            onStartQuiz={handleStartQuiz}
            onStartChat={handleStartChat}
            onSwitchMode={switchMode}
          />
        </div>
      </main>
    </div>
  );
};

export default App;