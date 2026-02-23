// ============================================
// Core Types for StudySprint
// ============================================

export interface User {
  id: string;
  name: string | null;
  createdAt: Date;
}

export interface Settings {
  id: string;
  userId: string;
  timezone: string;
  reminderTime: string; // HH:mm
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Sprint Types
// ============================================

export interface Sprint {
  id: string;
  userId: string;
  name: string;
  objective: string;
  deadline: string | null; // YYYY-MM-DD
  totalDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SprintWithDays extends Sprint {
  days: SprintDay[];
  completedDays: number;
  progressPercent: number;
}

export interface SprintTask {
  title: string;
  minutes: number;
  done: boolean;
}

export interface SprintResource {
  title: string;
  url: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index of correct answer
}

export interface SprintDay {
  id: string;
  sprintId: string;
  dayNumber: number;
  title: string;
  description: string;
  tasks: SprintTask[];
  resources: SprintResource[];
  quizQuestions: QuizQuestion[];
  completedAt: Date | null;
  quizScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DayStatus = 'completed' | 'current' | 'locked';

export interface SprintDayWithStatus extends SprintDay {
  status: DayStatus;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  sprintId: string | null;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ChatQuickOption {
  label: string;
  value: string;
}

// ============================================
// AI Generated Sprint Plan
// ============================================

export interface GeneratedSprintPlan {
  name: string;
  totalDays: number;
  days: GeneratedDay[];
}

export interface GeneratedDay {
  dayNumber: number;
  title: string;
  description: string;
  tasks: {
    title: string;
    minutes: number;
  }[];
  resources: {
    title: string;
    url: string;
  }[];
  quizQuestions: {
    question: string;
    options: string[];
    correct: number;
  }[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface SettingsUpdateInput {
  timezone?: string;
  reminderTime?: string;
}

export interface ChatStartInput {
  message: string;
}

export interface ChatMessageInput {
  conversationId: string;
  message: string;
}

export interface CreateSprintFromChatInput {
  conversationId: string;
}

export interface SprintDayUpdateInput {
  tasks?: SprintTask[];
}

export interface CompleteSprintDayInput {
  tasks: SprintTask[];
}

export interface QuizSubmitInput {
  answers: number[]; // array of answer indices
}

export interface QuizResult {
  score: number;
  total: number;
  correct: number[];
  incorrect: number[];
}
