import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { settingsRoutes } from './routes/settings.js';
import { sprintsRoutes } from './routes/sprints.js';
import { chatRoutes } from './routes/chat.js';
import { exportRoutes } from './routes/export.js';

const fastify = Fastify({
  logger: true,
});

// CORS for local development
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
});

// Register routes
fastify.register(settingsRoutes, { prefix: '/api' });
fastify.register(sprintsRoutes, { prefix: '/api' });
fastify.register(chatRoutes, { prefix: '/api' });
fastify.register(exportRoutes, { prefix: '/api' });

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
