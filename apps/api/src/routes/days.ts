import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { planDayCreateSchema, planDayUpdateSchema, reorderSchema } from '@studysprint/shared';

export async function daysRoutes(fastify: FastifyInstance) {
  // GET /plans/:planId/days
  fastify.get<{ Params: { planId: string } }>('/plans/:planId/days', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    // Verify ownership
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const days = await prisma.planDay.findMany({
      where: { planId },
      orderBy: { dayIndex: 'asc' },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Parse JSON fields
    return days.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => ({
        ...task,
        tags: JSON.parse(task.tags),
      })),
    }));
  });

  // POST /plans/:planId/days
  fastify.post<{ Params: { planId: string } }>('/plans/:planId/days', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    const result = planDayCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    // Get the next dayIndex
    const lastDay = await prisma.planDay.findFirst({
      where: { planId },
      orderBy: { dayIndex: 'desc' },
    });

    const nextIndex = (lastDay?.dayIndex ?? 0) + 1;

    const day = await prisma.planDay.create({
      data: {
        planId,
        dayIndex: nextIndex,
        title: result.data.title,
        theme: result.data.theme ?? null,
      },
    });

    return day;
  });

  // PUT /days/:dayId
  fastify.put<{ Params: { dayId: string } }>('/days/:dayId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { dayId } = request.params;

    const result = planDayUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const existing = await prisma.planDay.findFirst({
      where: { id: dayId },
      include: {
        plan: true,
      },
    });

    if (!existing || existing.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const day = await prisma.planDay.update({
      where: { id: dayId },
      data: result.data,
    });

    return day;
  });

  // DELETE /days/:dayId
  fastify.delete<{ Params: { dayId: string } }>('/days/:dayId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { dayId } = request.params;

    // Verify ownership
    const existing = await prisma.planDay.findFirst({
      where: { id: dayId },
      include: {
        plan: true,
      },
    });

    if (!existing || existing.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const planId = existing.planId;
    const deletedIndex = existing.dayIndex;

    // Delete the day
    await prisma.planDay.delete({
      where: { id: dayId },
    });

    // Reindex remaining days
    await prisma.planDay.updateMany({
      where: {
        planId,
        dayIndex: { gt: deletedIndex },
      },
      data: {
        dayIndex: { decrement: 1 },
      },
    });

    return { success: true };
  });

  // POST /plans/:planId/days/reorder
  fastify.post<{ Params: { planId: string } }>('/plans/:planId/days/reorder', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    const result = reorderSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    // Update dayIndex for each day
    const { orderedIds } = result.data;

    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.planDay.update({
        where: { id: orderedIds[i] },
        data: { dayIndex: i + 1 },
      });
    }

    return { success: true };
  });
}
