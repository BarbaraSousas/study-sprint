import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { getCurrentUser } from '../middleware/auth.js';
import { settingsUpdateSchema } from '@studysprint/shared';

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /settings
  fastify.get('/settings', async (request, reply) => {
    const { userId } = getCurrentUser();

    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return reply.status(404).send({ error: 'Settings not found' });
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

    const settings = await prisma.settings.update({
      where: { userId },
      data: result.data,
    });

    return settings;
  });
}
