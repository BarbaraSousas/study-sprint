import Fastify from 'fastify';
import cors from '@fastify/cors';
import { settingsRoutes } from './routes/settings.js';
import { plansRoutes } from './routes/plans.js';
import { daysRoutes } from './routes/days.js';
import { tasksRoutes } from './routes/tasks.js';
import { logsRoutes } from './routes/logs.js';
import { generatedRoutes } from './routes/generated.js';
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
fastify.register(plansRoutes, { prefix: '/api' });
fastify.register(daysRoutes, { prefix: '/api' });
fastify.register(tasksRoutes, { prefix: '/api' });
fastify.register(logsRoutes, { prefix: '/api' });
fastify.register(generatedRoutes, { prefix: '/api' });
fastify.register(exportRoutes, { prefix: '/api' });

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Server running at http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
