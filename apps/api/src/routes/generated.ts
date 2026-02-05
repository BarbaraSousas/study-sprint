import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import {
  addDays,
  computeDayProgress,
  computeDayStatus,
  computeDayXP,
  type GeneratedDay,
  type Task,
} from '@studysprint/shared';

export async function generatedRoutes(fastify: FastifyInstance) {
  // GET /plan/active/generated
  fastify.get('/plan/active/generated', async (request, reply) => {
    const { userId } = getCurrentUser();

    // Get settings for startDate
    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return reply.status(404).send({ error: 'Settings not found' });
    }

    // Get active plan
    const plan = await prisma.plan.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'No active plan found' });
    }

    // Get all logs for this user
    const logs = await prisma.dailyLog.findMany({
      where: { userId },
    });

    // Create a map of date -> log
    const logsMap = new Map(
      logs.map((log) => [
        log.date,
        {
          ...log,
          completedTaskIds: JSON.parse(log.completedTaskIds) as string[],
        },
      ])
    );

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Generate days with computed dates and status
    const generatedDays: GeneratedDay[] = plan.days.map((day) => {
      const date = addDays(settings.startDate, day.dayIndex - 1);
      const log = logsMap.get(date);

      const tasks: Task[] = day.tasks.map((task) => ({
        ...task,
        tags: JSON.parse(task.tags),
      }));

      const completedTaskIds = log?.completedTaskIds ?? [];
      const progress = computeDayProgress(tasks, completedTaskIds);
      const status = computeDayStatus({ date, tasks }, log, today);
      const xp = computeDayXP(tasks, completedTaskIds);

      return {
        dayId: day.id,
        dayIndex: day.dayIndex,
        date,
        title: day.title,
        theme: day.theme,
        tasks,
        status,
        progress,
        xp,
      };
    });

    return {
      plan: {
        id: plan.id,
        name: plan.name,
      },
      settings: {
        startDate: settings.startDate,
        timezone: settings.timezone,
        reminderTime: settings.reminderTime,
        weeklyGoalApplications: settings.weeklyGoalApplications,
        weeklyGoalMessages: settings.weeklyGoalMessages,
        streakRuleMinTasks: settings.streakRuleMinTasks,
      },
      days: generatedDays,
      today,
    };
  });
}
