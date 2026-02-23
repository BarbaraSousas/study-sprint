import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';

export async function exportRoutes(fastify: FastifyInstance) {
  // GET /export
  fastify.get('/export', async (request, reply) => {
    const { userId } = getCurrentUser();

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    // Get all sprints with days
    const sprints = await prisma.sprint.findMany({
      where: { userId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      sprints: sprints.map(sprint => ({
        ...sprint,
        days: sprint.days.map(day => ({
          ...day,
          tasks: JSON.parse(day.tasks),
          resources: JSON.parse(day.resources),
          quizQuestions: JSON.parse(day.quizQuestions),
        })),
      })),
    };
  });

  // POST /reset
  fastify.post('/reset', async (request, reply) => {
    const { userId } = getCurrentUser();

    // Delete all user data except user and settings
    await prisma.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({ where: { userId } });
      await tx.sprintDay.deleteMany({
        where: {
          sprint: { userId },
        },
      });
      await tx.sprint.deleteMany({ where: { userId } });

      // Reset settings to defaults
      await tx.settings.upsert({
        where: { userId },
        update: {
          timezone: 'America/Sao_Paulo',
          reminderTime: '09:00',
        },
        create: {
          userId,
          timezone: 'America/Sao_Paulo',
          reminderTime: '09:00',
        },
      });
    });

    return { success: true, message: 'Data reset successfully' };
  });
}
