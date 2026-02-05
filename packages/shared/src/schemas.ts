import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format');
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format');

export const taskCategorySchema = z.enum([
  'Frontend',
  'Backend',
  'SQL/DB',
  'Redis/Caching',
  'System Design',
  'Writing',
  'Pipeline',
  'Review',
  'Other',
]);

// Settings
export const settingsUpdateSchema = z.object({
  startDate: dateSchema.optional(),
  timezone: z.string().min(1).optional(),
  reminderTime: timeSchema.optional(),
  weeklyGoalApplications: z.number().int().min(0).optional(),
  weeklyGoalMessages: z.number().int().min(0).optional(),
  streakRuleMinTasks: z.number().int().min(1).optional(),
});

// Plan
export const planCreateSchema = z.object({
  name: z.string().min(1).max(200),
});

export const planUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

// PlanDay
export const planDayCreateSchema = z.object({
  title: z.string().min(1).max(200),
  theme: z.string().max(200).optional(),
});

export const planDayUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  theme: z.string().max(200).nullable().optional(),
});

// Task
export const taskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  category: taskCategorySchema,
  estimatedMinutes: z.number().int().min(1).max(480),
  required: z.boolean().optional().default(false),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: taskCategorySchema.optional(),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  required: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// DailyLog
export const dailyLogUpdateSchema = z.object({
  completedTaskIds: z.array(z.string()).optional(),
  hoursSpent: z.number().min(0).max(24).optional(),
  pipelineApplications: z.number().int().min(0).optional(),
  pipelineMessages: z.number().int().min(0).optional(),
  reflectionText: z.string().max(5000).optional(),
  finalizedAt: z.string().datetime().nullable().optional(),
});

// Reorder
export const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

// Query params
export const logsQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

// Export/Import
export const exportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  settings: z.any(),
  plan: z.any(),
  days: z.array(z.any()),
  tasks: z.array(z.any()),
  logs: z.array(z.any()),
});
