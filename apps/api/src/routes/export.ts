import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { exportDataSchema } from '@studysprint/shared';

export async function exportRoutes(fastify: FastifyInstance) {
  // GET /export
  fastify.get('/export', async (request, reply) => {
    const { userId } = getCurrentUser();

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return reply.status(404).send({ error: 'Settings not found' });
    }

    // Get active plan with days and tasks
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

    // Get all logs
    const logs = await prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    // Flatten days and tasks
    const days = plan.days.map((day) => ({
      id: day.id,
      planId: day.planId,
      dayIndex: day.dayIndex,
      title: day.title,
      theme: day.theme,
      createdAt: day.createdAt,
      updatedAt: day.updatedAt,
    }));

    const tasks = plan.days.flatMap((day) =>
      day.tasks.map((task) => ({
        ...task,
        tags: JSON.parse(task.tags),
      }))
    );

    const logsFormatted = logs.map((log) => ({
      ...log,
      completedTaskIds: JSON.parse(log.completedTaskIds),
    }));

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      plan: {
        id: plan.id,
        userId: plan.userId,
        name: plan.name,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
      days,
      tasks,
      logs: logsFormatted,
    };
  });

  // POST /import
  fastify.post('/import', async (request, reply) => {
    const { userId } = getCurrentUser();

    const result = exportDataSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const data = result.data;

    // Use a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete existing data
      await tx.dailyLog.deleteMany({ where: { userId } });
      await tx.task.deleteMany({
        where: {
          planDay: {
            plan: { userId },
          },
        },
      });
      await tx.planDay.deleteMany({
        where: {
          plan: { userId },
        },
      });
      await tx.plan.deleteMany({ where: { userId } });

      // Update settings
      await tx.settings.update({
        where: { userId },
        data: {
          startDate: data.settings.startDate,
          timezone: data.settings.timezone,
          reminderTime: data.settings.reminderTime,
          weeklyGoalApplications: data.settings.weeklyGoalApplications,
          weeklyGoalMessages: data.settings.weeklyGoalMessages,
          streakRuleMinTasks: data.settings.streakRuleMinTasks,
        },
      });

      // Create plan
      const plan = await tx.plan.create({
        data: {
          userId,
          name: data.plan.name,
          isActive: true,
        },
      });

      // Create a map of old day IDs to new day IDs
      const dayIdMap = new Map<string, string>();

      // Create days
      for (const day of data.days) {
        const newDay = await tx.planDay.create({
          data: {
            planId: plan.id,
            dayIndex: day.dayIndex,
            title: day.title,
            theme: day.theme,
          },
        });
        dayIdMap.set(day.id, newDay.id);
      }

      // Create a map of old task IDs to new task IDs
      const taskIdMap = new Map<string, string>();

      // Create tasks
      for (const task of data.tasks) {
        const newDayId = dayIdMap.get(task.planDayId);
        if (!newDayId) continue;

        const newTask = await tx.task.create({
          data: {
            planDayId: newDayId,
            title: task.title,
            description: task.description,
            category: task.category,
            estimatedMinutes: task.estimatedMinutes,
            required: task.required,
            tags: JSON.stringify(task.tags),
            order: task.order,
          },
        });
        taskIdMap.set(task.id, newTask.id);
      }

      // Create logs with updated task IDs
      for (const log of data.logs) {
        const newCompletedTaskIds = log.completedTaskIds
          .map((id: string) => taskIdMap.get(id))
          .filter(Boolean);

        await tx.dailyLog.create({
          data: {
            userId,
            date: log.date,
            completedTaskIds: JSON.stringify(newCompletedTaskIds),
            hoursSpent: log.hoursSpent,
            pipelineApplications: log.pipelineApplications,
            pipelineMessages: log.pipelineMessages,
            reflectionText: log.reflectionText,
            finalizedAt: log.finalizedAt ? new Date(log.finalizedAt) : null,
          },
        });
      }
    });

    return { success: true, message: 'Import completed successfully' };
  });

  // POST /reset
  fastify.post('/reset', async (request, reply) => {
    const { userId } = getCurrentUser();

    // Delete all user data except user and settings
    await prisma.$transaction(async (tx) => {
      await tx.dailyLog.deleteMany({ where: { userId } });
      await tx.task.deleteMany({
        where: {
          planDay: {
            plan: { userId },
          },
        },
      });
      await tx.planDay.deleteMany({
        where: {
          plan: { userId },
        },
      });
      await tx.plan.deleteMany({ where: { userId } });

      // Reset settings to defaults
      await tx.settings.update({
        where: { userId },
        data: {
          startDate: new Date().toISOString().split('T')[0],
          timezone: 'America/Sao_Paulo',
          reminderTime: '09:00',
          weeklyGoalApplications: 10,
          weeklyGoalMessages: 20,
          streakRuleMinTasks: 1,
        },
      });
    });

    return { success: true, message: 'Data reset successfully. Please re-seed the database if you want sample data.' };
  });
}
