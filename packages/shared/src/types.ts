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
  startDate: string; // YYYY-MM-DD
  timezone: string;
  reminderTime: string; // HH:mm
  weeklyGoalApplications: number;
  weeklyGoalMessages: number;
  streakRuleMinTasks: number; // minimum tasks to count as a streak day
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanDay {
  id: string;
  planId: string;
  dayIndex: number; // 1-based
  title: string;
  theme: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskCategory =
  | 'Frontend'
  | 'Backend'
  | 'SQL/DB'
  | 'Redis/Caching'
  | 'System Design'
  | 'Writing'
  | 'Pipeline'
  | 'Review'
  | 'Other';

export interface Task {
  id: string;
  planDayId: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  estimatedMinutes: number;
  required: boolean;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  hoursSpent: number;
  pipelineApplications: number;
  pipelineMessages: number;
  reflectionText: string;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Computed/Generated Types
// ============================================

export type DayStatus = 'done' | 'today' | 'behind' | 'future' | 'partial';

export interface GeneratedDay {
  dayId: string;
  dayIndex: number;
  date: string; // YYYY-MM-DD computed from startDate + dayIndex
  title: string;
  theme: string | null;
  tasks: Task[];
  status: DayStatus;
  progress: DayProgress;
  xp: number; // based on completed tasks
}

export interface DayProgress {
  minutesPlanned: number;
  minutesDone: number;
  percent: number;
  totalTasks: number;
  completedTasks: number;
  requiredTasks: number;
  completedRequiredTasks: number;
}

export interface BehindStatus {
  isBehind: boolean;
  pendingRequiredCount: number;
  pendingList: Array<{
    dayIndex: number;
    date: string;
    task: Task;
  }>;
}

export interface ChartDataPoint {
  date: string;
  dayIndex: number;
  label: string;
}

export interface ProgressChartPoint extends ChartDataPoint {
  cumulative: number;
  target: number;
}

export interface BurndownChartPoint extends ChartDataPoint {
  remaining: number;
  ideal: number;
}

export interface DailyChartPoint extends ChartDataPoint {
  planned: number;
  completed: number;
  hoursSpent: number;
}

export interface ChartsSeries {
  progress: ProgressChartPoint[];
  burndown: BurndownChartPoint[];
  daily: DailyChartPoint[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface SettingsUpdateInput {
  startDate?: string;
  timezone?: string;
  reminderTime?: string;
  weeklyGoalApplications?: number;
  weeklyGoalMessages?: number;
  streakRuleMinTasks?: number;
}

export interface PlanCreateInput {
  name: string;
}

export interface PlanUpdateInput {
  name?: string;
}

export interface PlanDayCreateInput {
  title: string;
  theme?: string;
}

export interface PlanDayUpdateInput {
  title?: string;
  theme?: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  category: TaskCategory;
  estimatedMinutes: number;
  required?: boolean;
  tags?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  estimatedMinutes?: number;
  required?: boolean;
  tags?: string[];
}

export interface DailyLogUpdateInput {
  completedTaskIds?: string[];
  hoursSpent?: number;
  pipelineApplications?: number;
  pipelineMessages?: number;
  reflectionText?: string;
  finalizedAt?: string | null;
}

export interface ReorderInput {
  orderedIds: string[];
}

export interface ExportData {
  version: string;
  exportedAt: string;
  settings: Settings;
  plan: Plan;
  days: PlanDay[];
  tasks: Task[];
  logs: DailyLog[];
}
