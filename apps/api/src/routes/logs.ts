import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { dailyLogUpdateSchema, logsQuerySchema } from '@studysprint/shared';

export async function logsRoutes(fastify: FastifyInstance) {
  // GET /logs
  fastify.get('/logs', async (request, reply) => {
    const { userId } = getCurrentUser();

    const result = logsQuerySchema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const { from, to } = result.data;

    const where: Record<string, unknown> = { userId };

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, string>).gte = from;
      if (to) (where.date as Record<string, string>).lte = to;
    }

    const logs = await prisma.dailyLog.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Parse JSON fields
    return logs.map((log) => ({
      ...log,
      completedTaskIds: JSON.parse(log.completedTaskIds),
    }));
  });

  // GET /logs/:date
  fastify.get<{ Params: { date: string } }>('/logs/:date', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { date } = request.params;

    const log = await prisma.dailyLog.findUnique({
      where: {
        userId_date: { userId, date },
      },
    });

    if (!log) {
      // Return empty log structure for dates without data
      return {
        id: null,
        userId,
        date,
        completedTaskIds: [],
        hoursSpent: 0,
        pipelineApplications: 0,
        pipelineMessages: 0,
        reflectionText: '',
        finalizedAt: null,
        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      ...log,
      completedTaskIds: JSON.parse(log.completedTaskIds),
    };
  });

  // PUT /logs/:date
  fastify.put<{ Params: { date: string } }>('/logs/:date', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { date } = request.params;

    const result = dailyLogUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const updateData: Record<string, unknown> = { ...result.data };
    if (result.data.completedTaskIds) {
      updateData.completedTaskIds = JSON.stringify(result.data.completedTaskIds);
    }

    const log = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId, date },
      },
      update: updateData,
      create: {
        userId,
        date,
        completedTaskIds: updateData.completedTaskIds as string ?? '[]',
        hoursSpent: result.data.hoursSpent ?? 0,
        pipelineApplications: result.data.pipelineApplications ?? 0,
        pipelineMessages: result.data.pipelineMessages ?? 0,
        reflectionText: result.data.reflectionText ?? '',
        finalizedAt: result.data.finalizedAt ? new Date(result.data.finalizedAt) : null,
      },
    });

    return {
      ...log,
      completedTaskIds: JSON.parse(log.completedTaskIds),
    };
  });
}
