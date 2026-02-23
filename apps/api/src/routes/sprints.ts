import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import {
  sprintDayUpdateSchema,
  completeSprintDaySchema,
  quizSubmitSchema
} from '@studysprint/shared';

// Helper to parse JSON fields
function parseSprintDay(day: any) {
  return {
    ...day,
    tasks: JSON.parse(day.tasks || '[]'),
    resources: JSON.parse(day.resources || '[]'),
    quizQuestions: JSON.parse(day.quizQuestions || '[]'),
  };
}

// Helper to compute sprint progress
function computeSprintProgress(days: any[]) {
  const completedDays = days.filter(d => d.completedAt).length;
  const totalDays = days.length;
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  return { completedDays, progressPercent };
}

export async function sprintsRoutes(fastify: FastifyInstance) {
  // GET /sprints - List all sprints
  fastify.get('/sprints', async (request, reply) => {
    const { userId } = getCurrentUser();

    const sprints = await prisma.sprint.findMany({
      where: { userId },
      include: { days: true },
      orderBy: { createdAt: 'desc' },
    });

    return sprints.map(sprint => {
      const { completedDays, progressPercent } = computeSprintProgress(sprint.days);
      return {
        ...sprint,
        days: undefined,
        completedDays,
        progressPercent,
      };
    });
  });

  // GET /sprints/:id - Get sprint details
  fastify.get('/sprints/:id', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { id } = request.params as { id: string };

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!sprint) {
      return reply.status(404).send({ error: 'Sprint not found' });
    }

    const parsedDays = sprint.days.map(parseSprintDay);
    const { completedDays, progressPercent } = computeSprintProgress(sprint.days);

    // Determine current day (first non-completed day)
    const currentDayNumber = parsedDays.find(d => !d.completedAt)?.dayNumber || sprint.totalDays;

    return {
      ...sprint,
      days: parsedDays.map(day => ({
        ...day,
        status: day.completedAt ? 'completed' as const :
                day.dayNumber === currentDayNumber ? 'current' as const : 'locked' as const,
      })),
      completedDays,
      progressPercent,
    };
  });

  // DELETE /sprints/:id - Delete sprint
  fastify.delete('/sprints/:id', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { id } = request.params as { id: string };

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId },
    });

    if (!sprint) {
      return reply.status(404).send({ error: 'Sprint not found' });
    }

    await prisma.sprint.delete({ where: { id } });

    return { success: true };
  });

  // GET /sprints/:id/days/:dayNumber - Get day details
  fastify.get('/sprints/:id/days/:dayNumber', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { id, dayNumber } = request.params as { id: string; dayNumber: string };

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId },
      include: {
        days: {
          where: { dayNumber: parseInt(dayNumber) },
        },
      },
    });

    if (!sprint) {
      return reply.status(404).send({ error: 'Sprint not found' });
    }

    if (sprint.days.length === 0) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const day = parseSprintDay(sprint.days[0]);

    // Get all days to determine status
    const allDays = await prisma.sprintDay.findMany({
      where: { sprintId: id },
      orderBy: { dayNumber: 'asc' },
    });

    const currentDayNumber = allDays.find(d => !d.completedAt)?.dayNumber || sprint.totalDays;

    return {
      ...day,
      sprintName: sprint.name,
      status: day.completedAt ? 'completed' as const :
              day.dayNumber === currentDayNumber ? 'current' as const : 'locked' as const,
    };
  });

  // PUT /sprints/:id/days/:dayNumber - Update day progress (tasks)
  fastify.put('/sprints/:id/days/:dayNumber', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { id, dayNumber } = request.params as { id: string; dayNumber: string };

    const result = sprintDayUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId },
      include: {
        days: {
          where: { dayNumber: parseInt(dayNumber) },
        },
      },
    });

    if (!sprint || sprint.days.length === 0) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const day = sprint.days[0];
    const updateData: any = {};

    if (result.data.tasks) {
      updateData.tasks = JSON.stringify(result.data.tasks);
    }

    const updatedDay = await prisma.sprintDay.update({
      where: { id: day.id },
      data: updateData,
    });

    return parseSprintDay(updatedDay);
  });

  // POST /sprints/:id/days/:dayNumber/complete - Complete day
  fastify.post('/sprints/:id/days/:dayNumber/complete', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { id, dayNumber } = request.params as { id: string; dayNumber: string };

    const result = completeSprintDaySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId },
      include: {
        days: {
          where: { dayNumber: parseInt(dayNumber) },
        },
      },
    });

    if (!sprint || sprint.days.length === 0) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const day = sprint.days[0];

    // Check if this is the current day (can't complete future days)
    const allDays = await prisma.sprintDay.findMany({
      where: { sprintId: id },
      orderBy: { dayNumber: 'asc' },
    });

    const currentDayNumber = allDays.find(d => !d.completedAt)?.dayNumber || 1;

    if (day.dayNumber > currentDayNumber) {
      return reply.status(400).send({ error: 'Cannot complete a future day' });
    }

    const updatedDay = await prisma.sprintDay.update({
      where: { id: day.id },
      data: {
        tasks: JSON.stringify(result.data.tasks),
        completedAt: new Date(),
      },
    });

    return parseSprintDay(updatedDay);
  });

  // POST /sprints/:id/days/:dayNumber/quiz - Submit quiz
  fastify.post('/sprints/:id/days/:dayNumber/quiz', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { id, dayNumber } = request.params as { id: string; dayNumber: string };

    const result = quizSubmitSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId },
      include: {
        days: {
          where: { dayNumber: parseInt(dayNumber) },
        },
      },
    });

    if (!sprint || sprint.days.length === 0) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const day = sprint.days[0];
    const quizQuestions = JSON.parse(day.quizQuestions || '[]');
    const answers = result.data.answers;

    // Calculate score
    let correctCount = 0;
    const correct: number[] = [];
    const incorrect: number[] = [];

    quizQuestions.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correct) {
        correctCount++;
        correct.push(idx);
      } else {
        incorrect.push(idx);
      }
    });

    const score = quizQuestions.length > 0
      ? Math.round((correctCount / quizQuestions.length) * 100)
      : 0;

    // Save quiz score
    await prisma.sprintDay.update({
      where: { id: day.id },
      data: { quizScore: score },
    });

    return {
      score,
      total: quizQuestions.length,
      correct,
      incorrect,
    };
  });
}
