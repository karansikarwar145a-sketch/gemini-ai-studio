import React from 'react';
import { Mode } from '../types';
import { ChatView } from './ChatView';

// Import all tools
import { MainsApp } from '../ExaModes/UpscTools/Awapp/index.tsx';
import { PrelimsApp, QuizResult } from '../ExaModes/UpscTools/Papp/Index.tsx';
import { SyllabusApp } from '../ExaModes/UpscTools/SyllabusApp/Index.tsx';
import { PyqApp } from '../ExaModes/UpscTools/Pyqtapp/Index.tsx';
import { EssayApp } from '../ExaModes/UpscTools/EssayApp/Index.tsx';
import { NotesProApp } from '../ExaModes/UpscTools/NotesProApp/Index.tsx';
import { SankalpApp } from '../ExaModes/UpscTools/SankalpApp/Index.tsx';
import { ChronoScoutApp } from '../ExaModes/UpscTools/CaApp/Index.tsx';
import { MicroTopicsApp, MicroTopicsResult } from '../ExaModes/UpscTools/MicroTopicsApp/Index.tsx';
import { AlgoLearnApp } from '../ExaModes/UpscTools/AlgoLearnApp/Index.tsx';
import { MentorCallApp } from '../ExaModes/UpscTools/MentorCallApp/Index.tsx';
import { InterviewApp } from '../ExaModes/UpscTools/Iapp/Index.tsx';
import { ToolsDashboard } from '../ExaModes/ToolsDashboard/Index.tsx';
import { InvictusSearchApp } from '../ExaModes/UpscTools/InvictusSearchApp/Index.tsx';
import { ProjectApp } from '../ProjectApp/Index.tsx';
import { MindmapApp } from '../MindmapApp/Index.tsx';
import { HistoryTimelineApp } from '../ExaModes/UpscTools/HistoryTimelineApp/Index.tsx';
import { MainsGs1AdvanceApp } from '../ExaModes/UpscTools/MainsGs1AdvanceApp/Index.tsx';
import { BrainstormApp } from '../ExaModes/UpscTools/BrainstormApp/Index.tsx';


interface ContentPanelProps {
  mode: Mode;
  initialData?: any;
  onSelectTopicForNotes: (topic: string) => void;
  onQuizComplete: (result: QuizResult) => void;
  onMicroTopicsComplete: (result: MicroTopicsResult) => void;
  onStartQuiz: (topic: string) => void;
  onStartChat: (topic: string) => void;
  onSwitchMode: (mode: Mode) => void;
}

const ToolWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="h-full overflow-y-auto">{children}</div>
);

export const ContentPanel: React.FC<ContentPanelProps> = ({ 
  mode, 
  initialData, 
  onSelectTopicForNotes, 
  onQuizComplete, 
  onMicroTopicsComplete,
  onStartQuiz,
  onStartChat,
  onSwitchMode
}) => {
  
  // A helper to pass empty functions for tools that don't emit events
  const emptyHandler = () => {};

  switch (mode) {
    // Self-layouting full-screen apps (no wrapper)
    case Mode.Projects:
      return <ProjectApp />;
    case Mode.Mindmaps:
      return <MindmapApp />;
    case Mode.SyllabusExplorer:
      return <SyllabusApp 
        onSelectTopicForNotes={onSelectTopicForNotes} 
        onMicroTopicsComplete={onMicroTopicsComplete} 
        onQuizComplete={onQuizComplete} 
      />;
    
    // Default to ChatView for all chat modes (no wrapper)
    case Mode.StudyBuddy:
    case Mode.PrelimsGSPaper1:
    case Mode.PrelimsCSAT:
    case Mode.MainsEssay:
    case Mode.MainsGSPaper1:
    case Mode.MainsGSPaper2:
    case Mode.MainsGSPaper3:
    case Mode.MainsGSPaper4:
    case Mode.CurrentAffairs:
    case Mode.History:
    case Mode.Geography:
      return <ChatView mode={mode} onSwitchMode={onSwitchMode} />;

    // All other tools are wrapped to provide scrolling
    case Mode.Tools:
      return <ToolWrapper><ToolsDashboard onSwitchMode={onSwitchMode} /></ToolWrapper>;
    case Mode.InvictusSearch:
      return <ToolWrapper><InvictusSearchApp /></ToolWrapper>;
    case Mode.MainsAnswerWriting:
      return <ToolWrapper><MainsApp initialData={initialData} onEvaluationComplete={emptyHandler} /></ToolWrapper>;
    case Mode.MainsGS1Advance:
      return <ToolWrapper><MainsGs1AdvanceApp /></ToolWrapper>;
    case Mode.PrelimsQuiz:
      return <ToolWrapper><PrelimsApp initialData={initialData} onQuizComplete={onQuizComplete} initialTopic={initialData?.initialTopic} /></ToolWrapper>;
    case Mode.PyqAnalyzer:
      return <ToolWrapper><PyqApp initialData={initialData} onAnalysisComplete={emptyHandler} /></ToolWrapper>;
    case Mode.EssayArchitect:
      return <ToolWrapper><EssayApp initialData={initialData} onAnalysisComplete={emptyHandler} /></ToolWrapper>;
    case Mode.NotesGenerator:
      return <ToolWrapper><NotesProApp initialData={initialData} initialTopic={initialData?.initialTopic} onAnalysisComplete={emptyHandler} /></ToolWrapper>;
    case Mode.StudyPlanner:
      return <ToolWrapper><SankalpApp initialData={initialData} onPlanComplete={emptyHandler} /></ToolWrapper>;
    case Mode.CurrentAffairsAnalyzer:
      return <ToolWrapper><ChronoScoutApp initialData={initialData} onAnalysisComplete={emptyHandler} /></ToolWrapper>;
    case Mode.MicroTopicExplorer:
      return <ToolWrapper><MicroTopicsApp 
        initialData={initialData} 
        onAnalysisComplete={onMicroTopicsComplete} 
        onGenerateQuiz={onStartQuiz}
        onAskChat={onStartChat}
      /></ToolWrapper>;
    case Mode.AlgoLearn:
      return <ToolWrapper><AlgoLearnApp initialData={initialData} onAnalysisComplete={emptyHandler} /></ToolWrapper>;
    case Mode.BrainstormBuddy:
      return <ToolWrapper><BrainstormApp /></ToolWrapper>;
    case Mode.MentorCall:
      return <ToolWrapper><MentorCallApp initialData={initialData} onCallComplete={emptyHandler} /></ToolWrapper>;
    case Mode.InterviewPractice:
      return <ToolWrapper><InterviewApp initialData={initialData} onInterviewComplete={emptyHandler} /></ToolWrapper>;
    case Mode.HistoryTimeline:
      return <ToolWrapper><HistoryTimelineApp /></ToolWrapper>;

    // Default catch-all
    default:
      return <ChatView mode={mode} onSwitchMode={onSwitchMode} />;
  }
};