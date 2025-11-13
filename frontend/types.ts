
export enum Mode {
  NewChat = 'NewChat',
  ChatHistory = 'ChatHistory',
  Library = 'Library',
  Projects = 'Projects',
  Mindmaps = 'Mindmaps',
  Tools = 'Tools',
  VideoGeneration = 'VideoGeneration',
  LiveConversation = 'LiveConversation',
  AudioTranscription = 'AudioTranscription',
  Chat = 'Chat',
  StudyBuddy = 'StudyBuddy',
  ThinkingMode = 'ThinkingMode',
  FastMode = 'FastMode',
  WebSearch = 'WebSearch',
  LocalSearch = 'LocalSearch',
  ImageGeneration = 'ImageGeneration',
  ImageEditing = 'ImageEditing',
  ImageAnalysis = 'ImageAnalysis',
  VideoAnalysis = 'VideoAnalysis',
  
  // UPSC CSE Prelims
  PrelimsGSPaper1 = 'PrelimsGSPaper1',
  PrelimsCSAT = 'PrelimsCSAT',

  // UPSC CSE Mains
  MainsEssay = 'MainsEssay',
  MainsGSPaper1 = 'MainsGSPaper1',
  MainsGSPaper2 = 'MainsGSPaper2',
  MainsGSPaper3 = 'MainsGSPaper3',
  MainsGSPaper4 = 'MainsGSPaper4',

  // General Knowledge
  CurrentAffairs = 'CurrentAffairs',
  History = 'History',
  Geography = 'Geography',

  // UPSC Tools
  MainsAnswerWriting = 'MainsAnswerWriting',
  PrelimsQuiz = 'PrelimsQuiz',
  SyllabusExplorer = 'SyllabusExplorer',
  PyqAnalyzer = 'PyqAnalyzer',
  EssayArchitect = 'EssayArchitect',
  NotesGenerator = 'NotesGenerator',
  StudyPlanner = 'StudyPlanner',
  CurrentAffairsAnalyzer = 'CurrentAffairsAnalyzer',
  MicroTopicExplorer = 'MicroTopicExplorer',
  AlgoLearn = 'AlgoLearn',
  MentorCall = 'MentorCall',
  InterviewPractice = 'InterviewPractice',
  InvictusSearch = 'InvictusSearch',
  HistoryTimeline = 'HistoryTimeline',
  MainsGS1Advance = 'MainsGS1Advance',
  BrainstormBuddy = 'BrainstormBuddy',
  QuizGeneration = 'QuizGeneration',
}

// Added GroundingSource type for search results
export type GroundingSource = {
  uri: string;
  title?: string;
};

// Added MessageContent type for various message part types
export type MessageContent =
  | string
  | { imageUrl: string }
  | { videoUrl: string }
  | { audioUrl: string }
  | { sources: GroundingSource[] };

// Added Message interface for chat messages
export interface Message {
  role: 'user' | 'model';
  content: MessageContent[];
}