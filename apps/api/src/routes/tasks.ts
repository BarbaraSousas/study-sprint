import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { taskCreateSchema, taskUpdateSchema, reorderSchema } from '@studysprint/shared';

export async function tasksRoutes(fastify: FastifyInstance) {
  // GET /days/:dayId/tasks
  fastify.get<{ Params: { dayId: string } }>('/days/:dayId/tasks', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { dayId } = request.params;

    // Verify ownership
    const day = await prisma.planDay.findFirst({
      where: { id: dayId },
      include: {
        plan: true,
      },
    });

    if (!day || day.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { planDayId: dayId },
      orderBy: { order: 'asc' },
    });

    // Parse JSON fields
    return tasks.map((task) => ({
      ...task,
      tags: JSON.parse(task.tags),
    }));
  });

  // POST /days/:dayId/tasks
  fastify.post<{ Params: { dayId: string } }>('/days/:dayId/tasks', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { dayId } = request.params;

    const result = taskCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const day = await prisma.planDay.findFirst({
      where: { id: dayId },
      include: {
        plan: true,
      },
    });

    if (!day || day.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    // Get the next order
    const lastTask = await prisma.task.findFirst({
      where: { planDayId: dayId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastTask?.order ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        planDayId: dayId,
        title: result.data.title,
        description: result.data.description ?? null,
        category: result.data.category,
        estimatedMinutes: result.data.estimatedMinutes,
        required: result.data.required ?? false,
        tags: JSON.stringify(result.data.tags ?? []),
        order: nextOrder,
      },
    });

    return {
      ...task,
      tags: JSON.parse(task.tags),
    };
  });

  // PUT /tasks/:taskId
  fastify.put<{ Params: { taskId: string } }>('/tasks/:taskId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { taskId } = request.params;

    const result = taskUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id: taskId },
      include: {
        planDay: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!existing || existing.planDay.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    const updateData: Record<string, unknown> = { ...result.data };
    if (result.data.tags) {
      updateData.tags = JSON.stringify(result.data.tags);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return {
      ...task,
      tags: JSON.parse(task.tags),
    };
  });

  // DELETE /tasks/:taskId
  fastify.delete<{ Params: { taskId: string } }>('/tasks/:taskId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { taskId } = request.params;

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id: taskId },
      include: {
        planDay: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!existing || existing.planDay.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  });

  // POST /days/:dayId/tasks/reorder
  fastify.post<{ Params: { dayId: string } }>('/days/:dayId/tasks/reorder', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { dayId } = request.params;

    const result = reorderSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const day = await prisma.planDay.findFirst({
      where: { id: dayId },
      include: {
        plan: true,
      },
    });

    if (!day || day.plan.userId !== userId) {
      return reply.status(404).send({ error: 'Day not found' });
    }

    // Update order for each task
    const { orderedIds } = result.data;

    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.task.update({
        where: { id: orderedIds[i] },
        data: { order: i },
      });
    }

    return { success: true };
  });
}
