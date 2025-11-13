import React from 'react';
import { Mode } from './types';
import { 
  MessageSquare, 
  BrainCircuit, 
  Globe, 
  MapPin, 
  Image,
  Film,
  Mic,
  Bot,
  PenSquare,
  Video,
  BookOpen,
  ScrollText,
  Scale,
  Landmark,
  Newspaper,
  Mountain,
  SquarePen,
  FileCheck,
  ListChecks,
  BookCopy,
  SearchCode,
  DraftingCompass,
  NotebookText,
  CalendarDays,
  Binary,
  MessageCircleQuestion,
  Phone,
  Users,
  LayoutGrid,
  Search,
  FolderKanban,
  Zap,
  Clock,
  Layers,
  Wand2,
  FileQuestion,
} from './components/icons';


interface ModeDetails {
  name: string;
  icon: React.ReactElement;
  model?: string;
  systemInstruction?: string;
}

// New simplified sidebar structure
export const SIDEBAR_STRUCTURE = [
  {
    category: 'Projects',
    items: [
      { id: Mode.Projects, name: 'My Project' },
      { id: Mode.Mindmaps, name: 'mindZ' },
    ]
  },
  {
    category: 'ExaModes',
    items: [
      { id: Mode.Tools, name: 'UPSC Toolkit' },
    ]
  }
];

// Data for the new Tools Dashboard
export const TOOLS_DASHBOARD_DATA = [
  {
    title: 'UPSC Tools',
    items: [
      { id: Mode.InvictusSearch, description: 'Search the web for any UPSC topic with AI-powered summaries and sources.' },
      { id: Mode.MainsAnswerWriting, description: 'Get in-depth AI feedback on your handwritten answers.' },
      { id: Mode.MainsGS1Advance, description: 'Get advanced insights, model answers, and strategic analysis for any GS Paper 1 topic.' },
      { id: Mode.PrelimsQuiz, description: 'Generate customized MCQs on any topic, or take a full-length mock test.' },
      { id: Mode.SyllabusExplorer, description: 'Visually explore and interact with the UPSC syllabus.' },
      { id: Mode.PyqAnalyzer, description: 'Analyze trends and patterns from Previous Year Questions.' },
      { id: Mode.EssayArchitect, description: 'Brainstorm and structure compelling essays with multiple frameworks.' },
      { id: Mode.NotesGenerator, description: 'Create comprehensive, multi-dimensional notes from any syllabus topic.' },
      { id: Mode.StudyPlanner, description: 'Generate a personalized study schedule with AI based on your goals.' },
      { id: Mode.CurrentAffairsAnalyzer, description: 'Get a 360-degree analysis of any current affairs topic.' },
      { id: Mode.MicroTopicExplorer, description: 'Break down any broad topic into a tree of granular micro-topics.' },
      { id: Mode.AlgoLearn, description: 'Learn any topic with a Socratic, step-by-step AI tutor.' },
      { id: Mode.BrainstormBuddy, description: 'Generate ideas, questions, and different perspectives on any topic.' },
      { id: Mode.MentorCall, description: 'Have a live 1:1 doubt-solving audio call with an AI mentor.' },
      { id: Mode.InterviewPractice, description: 'Simulate a UPSC personality test with an AI interview board.' },
      { id: Mode.HistoryTimeline, description: 'Generate and explore an interactive timeline for any historical topic.' },
    ]
  },
  {
    title: 'UPSC Study Modes',
    items: [
      { id: Mode.StudyBuddy, description: 'Your general study assistant for any UPSC topic.' },
      { id: Mode.PrelimsGSPaper1, description: 'Focused chat for Prelims GS Paper 1 syllabus.' },
      { id: Mode.PrelimsCSAT, description: 'Practice and learn concepts for the CSAT paper.' },
      { id: Mode.MainsEssay, description: 'Brainstorm, structure, and refine your essays.' },
      { id: Mode.MainsGSPaper1, description: 'In-depth chat for GS Paper 1 topics.' },
      { id: Mode.MainsGSPaper2, description: 'In-depth chat for GS Paper 2 topics.' },
      { id: Mode.MainsGSPaper3, description: 'In-depth chat for GS Paper 3 topics.' },
      { id: Mode.MainsGSPaper4, description: 'Discuss ethics, integrity, and aptitude concepts.' },
    ]
  },
  {
    title: 'General Knowledge',
    items: [
      { id: Mode.CurrentAffairs, description: 'Summaries and analysis of recent events.' },
      { id: Mode.History, description: 'Discuss topics from Indian history.' },
      { id: Mode.Geography, description: 'Explore concepts in Indian and World geography.' },
    ]
  }
];


// FIX: Export UPSC_TOOLS_LIST for use in the ToolsDashboard component.
export const UPSC_TOOLS_LIST = [
  { id: Mode.InvictusSearch, description: 'Search the web for any UPSC topic with AI-powered summaries and sources.' },
  { id: Mode.MainsAnswerWriting, description: 'Get in-depth AI feedback on your handwritten answers.' },
  { id: Mode.MainsGS1Advance, description: 'Get advanced insights, model answers, and strategic analysis for any GS Paper 1 topic.' },
  { id: Mode.PrelimsQuiz, description: 'Generate customized MCQs on any topic, or take a full-length mock test.' },
  { id: Mode.SyllabusExplorer, description: 'Visually explore and interact with the UPSC syllabus.' },
  { id: Mode.PyqAnalyzer, description: 'Analyze trends and patterns from Previous Year Questions.' },
  { id: Mode.EssayArchitect, description: 'Brainstorm and structure compelling essays with multiple frameworks.' },
  { id: Mode.NotesGenerator, description: 'Create comprehensive, multi-dimensional notes from any syllabus topic.' },
  { id: Mode.StudyPlanner, description: 'Generate a personalized study schedule with AI based on your goals.' },
  { id: Mode.CurrentAffairsAnalyzer, description: 'Get a 360-degree analysis of any current affairs topic.' },
  { id: Mode.MicroTopicExplorer, description: 'Break down any broad topic into a tree of granular micro-topics.' },
  { id: Mode.AlgoLearn, description: 'Learn any topic with a Socratic, step-by-step AI tutor.' },
  { id: Mode.BrainstormBuddy, description: 'Generate ideas, questions, and different perspectives on any topic.' },
  { id: Mode.MentorCall, description: 'Have a live 1:1 doubt-solving audio call with an AI mentor.' },
  { id: Mode.InterviewPractice, description: 'Simulate a UPSC personality test with an AI interview board.' },
  { id: Mode.HistoryTimeline, description: 'Generate and explore an interactive timeline for any historical topic.' },
];

// Tools for the chat input area
export const CHAT_INPUT_TOOLS: Mode[] = [
  Mode.ImageGeneration,
  Mode.VideoGeneration,
  Mode.LiveConversation,
  Mode.WebSearch,
  Mode.LocalSearch,
  Mode.QuizGeneration,
];

// New constant for sidebar tools
export const SIDEBAR_TOOLS: Mode[] = [
  Mode.AlgoLearn,
  Mode.BrainstormBuddy,
  Mode.MicroTopicExplorer,
  Mode.PrelimsQuiz,
];


export const MODES: Record<Mode, ModeDetails> = {
  // Foundational Modes
  [Mode.Projects]: {
    name: 'Projects',
    icon: <FolderKanban />,
  },
  [Mode.Mindmaps]: {
    name: 'mindZ',
    icon: <Zap />,
  },
  [Mode.Chat]: {
    name: 'General Chat',
    icon: <MessageSquare />,
    model: 'gemini-2.5-flash',
  },
  [Mode.StudyBuddy]: {
    name: 'Study Buddy',
    icon: <BrainCircuit />,
    model: 'gemini-2.5-pro',
    systemInstruction: "You are an expert study assistant for the UPSC exam. Provide detailed, accurate, and structured answers suitable for exam preparation. Cite sources when possible.",
  },

  // UPSC Prelims
  [Mode.PrelimsGSPaper1]: { name: 'Prelims GS Paper 1', icon: <BookOpen />, model: 'gemini-2.5-pro', systemInstruction: 'Focus on topics relevant to UPSC Prelims General Studies Paper 1: History of India, Indian and World Geography, Indian Polity and Governance, Economic and Social Development, Environmental ecology, Bio-diversity and Climate Change, and General Science.' },
  [Mode.PrelimsCSAT]: { name: 'Prelims CSAT', icon: <ScrollText />, model: 'gemini-2.5-pro', systemInstruction: 'You are a tutor for UPSC Prelims CSAT (Paper 2). Focus on comprehension, logical reasoning, analytical ability, decision making, problem-solving, and basic numeracy.' },
  
  // UPSC Mains
  [Mode.MainsEssay]: { name: 'Mains Essay', icon: <SquarePen />, model: 'gemini-2.5-pro', systemInstruction: 'Act as an evaluator for UPSC Mains Essay paper. Help brainstorm ideas, structure arguments, and refine language for essay topics.' },
  [Mode.MainsGSPaper1]: { name: 'Mains GS Paper 1', icon: <Landmark />, model: 'gemini-2.5-pro', systemInstruction: 'You are an expert on UPSC Mains GS Paper 1. Cover Indian Heritage and Culture, History and Geography of the World and Society in detail.' },
  [Mode.MainsGSPaper2]: { name: 'Mains GS Paper 2', icon: <Scale />, model: 'gemini-2.5-pro', systemInstruction: 'You are an expert on UPSC Mains GS Paper 2. Cover Governance, Constitution, Polity, Social Justice and International relations.' },
  [Mode.MainsGSPaper3]: { name: 'Mains GS Paper 3', icon: <Globe />, model: 'gemini-2.5-pro', systemInstruction: 'You are an expert on UPSC Mains GS Paper 3. Cover Technology, Economic Development, Bio diversity, Environment, Security and Disaster Management.' },
  [Mode.MainsGSPaper4]: { name: 'Mains GS Paper 4', icon: <BrainCircuit />, model: 'gemini-2.5-pro', systemInstruction: 'You are an expert on UPSC Mains GS Paper 4, which is Ethics, Integrity, and Aptitude. Discuss case studies and theoretical concepts related to ethics.' },
  
  // General Knowledge
  [Mode.CurrentAffairs]: { name: 'Current Affairs', icon: <Newspaper />, model: 'gemini-2.5-pro', systemInstruction: 'Provide summaries and analysis of recent current events relevant to the UPSC examination.' },
  [Mode.History]: { name: 'History', icon: <Landmark />, model: 'gemini-2.5-pro', systemInstruction: 'Focus on Indian History from ancient to modern times, as relevant for the UPSC syllabus.' },
  [Mode.Geography]: { name: 'Geography', icon: <Mountain />, model: 'gemini-2.5-pro', systemInstruction: 'Focus on Indian and World Geography, including physical, social, and economic aspects as per the UPSC syllabus.' },

  // Tool Modes (for chat input)
  [Mode.WebSearch]: {
    name: 'Web Search',
    icon: <Globe />,
    model: 'gemini-2.5-flash',
  },
  [Mode.LocalSearch]: {
    name: 'Local Search',
    icon: <MapPin />,
    model: 'gemini-2.5-flash',
  },
  [Mode.ImageGeneration]: {
    name: 'Image Generation',
    icon: <Image />,
    model: 'imagen-4.0-generate-001',
  },
  [Mode.VideoGeneration]: { 
    name: 'Video Generation', 
    icon: <Film /> 
  },
  [Mode.LiveConversation]: { 
    name: 'Live Conversation', 
    icon: <Mic /> 
  },
  [Mode.QuizGeneration]: {
    name: 'Generate Quiz',
    icon: <FileQuestion />,
    model: 'gemini-2.5-flash',
  },
  [Mode.ImageEditing]: {
    name: 'Image Editing',
    icon: <PenSquare />,
    model: 'gemini-2.5-flash-image',
  },
  [Mode.ImageAnalysis]: {
    name: 'Image Analysis',
    icon: <Image />,
    model: 'gemini-2.5-flash',
  },
   [Mode.VideoAnalysis]: { 
    name: 'Video Analysis', 
    icon: <Video /> 
  },
   [Mode.AudioTranscription]: { 
    name: 'Audio Transcription', 
    icon: <Mic /> 
  },
  [Mode.ThinkingMode]: {
    name: 'Deep Analysis',
    icon: <Bot />,
    model: 'gemini-2.5-pro',
  },
  [Mode.FastMode]: {
    name: 'Quick Answers',
    icon: <MessageSquare />,
    model: 'gemini-2.5-flash',
  },
  
  // New UPSC Tools
  [Mode.InvictusSearch]: { name: 'Invictus Search', icon: <Search /> },
  [Mode.MainsAnswerWriting]: { name: 'Mains Answer Writing', icon: <FileCheck /> },
  [Mode.MainsGS1Advance]: { name: 'Mains GS1 Advance', icon: <Layers /> },
  [Mode.PrelimsQuiz]: { name: 'Prelims Quiz Generator', icon: <ListChecks /> },
  [Mode.SyllabusExplorer]: { name: 'Syllabus Explorer', icon: <BookCopy /> },
  [Mode.PyqAnalyzer]: { name: 'PYQ Analyzer', icon: <SearchCode /> },
  [Mode.EssayArchitect]: { name: 'Essay Architect', icon: <DraftingCompass /> },
  [Mode.NotesGenerator]: { name: 'Notes Pro', icon: <NotebookText /> },
  [Mode.StudyPlanner]: { name: 'Sankalp Study Planner', icon: <CalendarDays /> },
  [Mode.CurrentAffairsAnalyzer]: { name: 'Current Affairs 360', icon: <Newspaper /> },
  [Mode.MicroTopicExplorer]: { name: 'Micro-Topic Explorer', icon: <Binary /> },
  [Mode.AlgoLearn]: { name: 'AlgoLearn Tutor', icon: <MessageCircleQuestion /> },
  [Mode.BrainstormBuddy]: { name: 'Brainstorm Buddy', icon: <Wand2 /> },
  [Mode.MentorCall]: { name: '1:1 Mentor Call', icon: <Phone /> },
  [Mode.InterviewPractice]: { name: 'Interview Simulator', icon: <Users /> },
  [Mode.Tools]: { name: 'UPSC Toolkit', icon: <LayoutGrid /> },
  [Mode.HistoryTimeline]: { name: 'History Timeline', icon: <Clock /> },

  // Deprecated/Unused Modes
  [Mode.NewChat]: { name: 'New Chat', icon: <div /> },
  [Mode.ChatHistory]: { name: 'Chat History', icon: <div /> },
  [Mode.Library]: { name: 'Library', icon: <div /> },
};