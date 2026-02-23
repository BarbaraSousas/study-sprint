import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { settingsUpdateSchema } from '@studysprint/shared';

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /settings
  fastify.get('/settings', async (request, reply) => {
    const { userId } = getCurrentUser();

    let settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.settings.create({
        data: {
          userId,
          timezone: 'America/Sao_Paulo',
          reminderTime: '09:00',
        },
      });
    }

    return settings;
  });

  // PUT /settings
  fastify.put('/settings', async (request, reply) => {
    const { userId } = getCurrentUser();

    const result = settingsUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.issues });
    }

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: result.data,
      create: {
        userId,
        timezone: result.data.timezone || 'America/Sao_Paulo',
        reminderTime: result.data.reminderTime || '09:00',
      },
    });

    return settings;
  });
}
