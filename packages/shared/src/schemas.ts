import { z } from 'zod';

// ============================================
// Base Schemas
// ============================================

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format');
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format');

// ============================================
// Settings Schemas
// ============================================

export const settingsUpdateSchema = z.object({
  timezone: z.string().min(1).optional(),
  reminderTime: timeSchema.optional(),
});

// ============================================
// Sprint Schemas
// ============================================

export const sprintTaskSchema = z.object({
  title: z.string().min(1).max(500),
  minutes: z.number().int().min(1).max(480),
  done: z.boolean(),
});

export const sprintResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(6),
  correct: z.number().int().min(0),
});

export const generatedDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  tasks: z.array(z.object({
    title: z.string().min(1).max(500),
    minutes: z.number().int().min(1).max(480),
  })).min(1).max(10),
  resources: z.array(sprintResourceSchema).max(10),
  quizQuestions: z.array(quizQuestionSchema).min(1).max(5),
});

export const generatedSprintPlanSchema = z.object({
  name: z.string().min(1).max(200),
  totalDays: z.number().int().min(1).max(90),
  days: z.array(generatedDaySchema).min(1),
});

// ============================================
// Chat Schemas
// ============================================

export const chatStartSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

export const createSprintFromChatSchema = z.object({
  conversationId: z.string().uuid(),
});

// ============================================
// Sprint Day Schemas
// ============================================

export const sprintDayUpdateSchema = z.object({
  tasks: z.array(sprintTaskSchema).optional(),
});

export const completeSprintDaySchema = z.object({
  tasks: z.array(sprintTaskSchema),
});

export const quizSubmitSchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

// ============================================
// Export/Import Schemas
// ============================================

export const exportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  settings: z.any(),
  sprints: z.array(z.any()),
});
