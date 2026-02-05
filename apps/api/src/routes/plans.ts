import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { planCreateSchema, planUpdateSchema } from '@studysprint/shared';

export async function plansRoutes(fastify: FastifyInstance) {
  // GET /plans
  fastify.get('/plans', async () => {
    const { userId } = getCurrentUser();

    const plans = await prisma.plan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { days: true },
        },
      },
    });

    return plans;
  });

  // POST /plans
  fastify.post('/plans', async (request, reply) => {
    const { userId } = getCurrentUser();

    const result = planCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const plan = await prisma.plan.create({
      data: {
        userId,
        name: result.data.name,
        isActive: false,
      },
    });

    return plan;
  });

  // PUT /plans/:planId
  fastify.put<{ Params: { planId: string } }>('/plans/:planId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    const result = planUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    // Verify ownership
    const existing = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: result.data,
    });

    return plan;
  });

  // DELETE /plans/:planId
  fastify.delete<{ Params: { planId: string } }>('/plans/:planId', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    // Verify ownership
    const existing = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    await prisma.plan.delete({
      where: { id: planId },
    });

    return { success: true };
  });

  // POST /plans/:planId/set-active
  fastify.post<{ Params: { planId: string } }>('/plans/:planId/set-active', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    // Verify ownership
    const existing = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    // Deactivate all other plans
    await prisma.plan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Activate the selected plan
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: { isActive: true },
    });

    return plan;
  });

  // POST /plans/:planId/duplicate
  fastify.post<{ Params: { planId: string } }>('/plans/:planId/duplicate', async (request, reply) => {
    const { userId } = getCurrentUser();
    const { planId } = request.params;

    // Get the plan with all days and tasks
    const existing = await prisma.plan.findFirst({
      where: { id: planId, userId },
      include: {
        days: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    // Create new plan
    const newPlan = await prisma.plan.create({
      data: {
        userId,
        name: `${existing.name} (copy)`,
        isActive: false,
      },
    });

    // Copy days and tasks
    for (const day of existing.days) {
      const newDay = await prisma.planDay.create({
        data: {
          planId: newPlan.id,
          dayIndex: day.dayIndex,
          title: day.title,
          theme: day.theme,
        },
      });

      for (const task of day.tasks) {
        await prisma.task.create({
          data: {
            planDayId: newDay.id,
            title: task.title,
            description: task.description,
            category: task.category,
            estimatedMinutes: task.estimatedMinutes,
            required: task.required,
            tags: task.tags,
            order: task.order,
          },
        });
      }
    }

    return newPlan;
  });
}
