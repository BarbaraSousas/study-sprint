import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.dailyLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.planDay.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // Create local user
  const user = await prisma.user.create({
    data: {
      id: 'local-user',
      name: 'Local User',
    },
  });
  console.log('✅ Created user:', user.id);

  // Create settings
  const settings = await prisma.settings.create({
    data: {
      userId: user.id,
      startDate: getTodayDate(),
      timezone: 'America/Sao_Paulo',
      reminderTime: '09:00',
      weeklyGoalApplications: 10,
      weeklyGoalMessages: 20,
      streakRuleMinTasks: 1,
    },
  });
  console.log('✅ Created settings');

  // Create plan
  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      name: 'Plano Acelerado (FE + Backend/DB/Redis)',
      isActive: true,
    },
  });
  console.log('✅ Created plan:', plan.name);

  // Plan structure: 30 days covering FE, Backend, DB, Redis, System Design
  const planData = [
    // Week 1: Frontend Foundations
    {
      title: 'React Fundamentals Deep Dive',
      theme: 'Frontend',
      tasks: [
        { title: 'Review React hooks (useState, useEffect, useContext)', category: 'Frontend', minutes: 45, required: true },
        { title: 'Study useReducer and useCallback patterns', category: 'Frontend', minutes: 30, required: true },
        { title: 'Practice custom hooks creation', category: 'Frontend', minutes: 40, required: false },
        { title: 'Document key learnings', category: 'Writing', minutes: 15, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Advanced React Patterns',
      theme: 'Frontend',
      tasks: [
        { title: 'Study Compound Components pattern', category: 'Frontend', minutes: 45, required: true },
        { title: 'Implement Render Props pattern example', category: 'Frontend', minutes: 40, required: true },
        { title: 'Practice HOC (Higher Order Components)', category: 'Frontend', minutes: 35, required: false },
        { title: 'Review React.memo and useMemo optimization', category: 'Frontend', minutes: 30, required: true },
        { title: 'Update LinkedIn with learnings', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'State Management',
      theme: 'Frontend',
      tasks: [
        { title: 'Deep dive into Context API patterns', category: 'Frontend', minutes: 40, required: true },
        { title: 'Study Zustand or Jotai basics', category: 'Frontend', minutes: 45, required: true },
        { title: 'Compare Redux vs Context vs Zustand', category: 'Frontend', minutes: 30, required: false },
        { title: 'Write comparison blog post draft', category: 'Writing', minutes: 45, required: false },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'React Performance',
      theme: 'Frontend',
      tasks: [
        { title: 'Study React DevTools Profiler', category: 'Frontend', minutes: 30, required: true },
        { title: 'Learn code splitting with React.lazy', category: 'Frontend', minutes: 40, required: true },
        { title: 'Practice virtualization with react-window', category: 'Frontend', minutes: 45, required: false },
        { title: 'Implement skeleton loading patterns', category: 'Frontend', minutes: 30, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Testing in React',
      theme: 'Frontend',
      tasks: [
        { title: 'Study React Testing Library best practices', category: 'Frontend', minutes: 45, required: true },
        { title: 'Write unit tests for hooks', category: 'Frontend', minutes: 40, required: true },
        { title: 'Practice integration tests', category: 'Frontend', minutes: 40, required: false },
        { title: 'Learn MSW for API mocking', category: 'Frontend', minutes: 35, required: true },
        { title: 'Review week learnings', category: 'Review', minutes: 30, required: true },
      ],
    },
    // Week 2: Backend Fundamentals
    {
      title: 'Node.js & API Design',
      theme: 'Backend',
      tasks: [
        { title: 'Review Node.js event loop', category: 'Backend', minutes: 40, required: true },
        { title: 'Study RESTful API design principles', category: 'Backend', minutes: 45, required: true },
        { title: 'Learn Fastify basics and middleware', category: 'Backend', minutes: 40, required: true },
        { title: 'Practice request validation with Zod', category: 'Backend', minutes: 30, required: false },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Authentication Concepts',
      theme: 'Backend',
      tasks: [
        { title: 'Study JWT structure and flow', category: 'Backend', minutes: 45, required: true },
        { title: 'Compare session vs token auth', category: 'Backend', minutes: 30, required: true },
        { title: 'Learn OAuth 2.0 basics', category: 'Backend', minutes: 40, required: false },
        { title: 'Document auth patterns', category: 'Writing', minutes: 30, required: true },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'Error Handling & Logging',
      theme: 'Backend',
      tasks: [
        { title: 'Study error handling patterns', category: 'Backend', minutes: 40, required: true },
        { title: 'Learn structured logging best practices', category: 'Backend', minutes: 35, required: true },
        { title: 'Implement error boundary patterns', category: 'Backend', minutes: 40, required: false },
        { title: 'Practice graceful shutdown handling', category: 'Backend', minutes: 30, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    // Week 3: Database & SQL
    {
      title: 'SQL Fundamentals',
      theme: 'Database',
      tasks: [
        { title: 'Review SQL JOINs (INNER, LEFT, RIGHT, FULL)', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Practice subqueries and CTEs', category: 'SQL/DB', minutes: 40, required: true },
        { title: 'Study window functions', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Solve 3 SQL challenges', category: 'SQL/DB', minutes: 40, required: false },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Database Design',
      theme: 'Database',
      tasks: [
        { title: 'Study normalization (1NF to 3NF)', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Learn when to denormalize', category: 'SQL/DB', minutes: 30, required: true },
        { title: 'Practice ER diagram creation', category: 'SQL/DB', minutes: 40, required: false },
        { title: 'Design schema for a real project', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'Indexes & Query Optimization',
      theme: 'Database',
      tasks: [
        { title: 'Study B-tree index internals', category: 'SQL/DB', minutes: 40, required: true },
        { title: 'Learn EXPLAIN ANALYZE', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Practice query optimization', category: 'SQL/DB', minutes: 40, required: true },
        { title: 'Document indexing strategies', category: 'Writing', minutes: 30, required: false },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Transactions & ACID',
      theme: 'Database',
      tasks: [
        { title: 'Study ACID properties deeply', category: 'SQL/DB', minutes: 40, required: true },
        { title: 'Learn isolation levels', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Practice deadlock scenarios', category: 'SQL/DB', minutes: 35, required: false },
        { title: 'Study optimistic vs pessimistic locking', category: 'SQL/DB', minutes: 40, required: true },
        { title: 'Review week learnings', category: 'Review', minutes: 30, required: true },
      ],
    },
    // Week 4: Redis & Caching
    {
      title: 'Redis Fundamentals',
      theme: 'Caching',
      tasks: [
        { title: 'Study Redis data structures', category: 'Redis/Caching', minutes: 45, required: true },
        { title: 'Practice strings, hashes, lists, sets', category: 'Redis/Caching', minutes: 40, required: true },
        { title: 'Learn sorted sets use cases', category: 'Redis/Caching', minutes: 35, required: false },
        { title: 'Implement basic cache layer', category: 'Redis/Caching', minutes: 45, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Caching Strategies',
      theme: 'Caching',
      tasks: [
        { title: 'Study cache-aside pattern', category: 'Redis/Caching', minutes: 40, required: true },
        { title: 'Learn write-through vs write-back', category: 'Redis/Caching', minutes: 35, required: true },
        { title: 'Practice TTL and eviction policies', category: 'Redis/Caching', minutes: 40, required: true },
        { title: 'Implement cache invalidation', category: 'Redis/Caching', minutes: 45, required: false },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'Rate Limiting & Sessions',
      theme: 'Caching',
      tasks: [
        { title: 'Implement rate limiter with Redis', category: 'Redis/Caching', minutes: 50, required: true },
        { title: 'Study sliding window algorithm', category: 'Redis/Caching', minutes: 40, required: true },
        { title: 'Learn Redis sessions vs JWT', category: 'Redis/Caching', minutes: 35, required: false },
        { title: 'Document caching patterns', category: 'Writing', minutes: 30, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    // Week 5: System Design
    {
      title: 'System Design Basics',
      theme: 'System Design',
      tasks: [
        { title: 'Study scalability fundamentals', category: 'System Design', minutes: 45, required: true },
        { title: 'Learn horizontal vs vertical scaling', category: 'System Design', minutes: 30, required: true },
        { title: 'Practice load balancing concepts', category: 'System Design', minutes: 40, required: true },
        { title: 'Study CAP theorem', category: 'System Design', minutes: 35, required: false },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Microservices Patterns',
      theme: 'System Design',
      tasks: [
        { title: 'Study microservices vs monolith trade-offs', category: 'System Design', minutes: 45, required: true },
        { title: 'Learn API Gateway pattern', category: 'System Design', minutes: 35, required: true },
        { title: 'Practice service communication patterns', category: 'System Design', minutes: 40, required: false },
        { title: 'Study event-driven architecture', category: 'System Design', minutes: 45, required: true },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'Design a URL Shortener',
      theme: 'System Design',
      tasks: [
        { title: 'Define requirements and constraints', category: 'System Design', minutes: 30, required: true },
        { title: 'Design database schema', category: 'System Design', minutes: 40, required: true },
        { title: 'Plan caching strategy', category: 'System Design', minutes: 35, required: true },
        { title: 'Write system design document', category: 'Writing', minutes: 45, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Design a Chat System',
      theme: 'System Design',
      tasks: [
        { title: 'Study WebSocket vs long polling', category: 'System Design', minutes: 40, required: true },
        { title: 'Design message storage', category: 'System Design', minutes: 45, required: true },
        { title: 'Plan presence and delivery receipts', category: 'System Design', minutes: 35, required: false },
        { title: 'Review week learnings', category: 'Review', minutes: 30, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    // Week 6: Advanced Topics & Review
    {
      title: 'TypeScript Advanced',
      theme: 'Frontend',
      tasks: [
        { title: 'Study utility types deeply', category: 'Frontend', minutes: 45, required: true },
        { title: 'Practice conditional types', category: 'Frontend', minutes: 40, required: true },
        { title: 'Learn mapped types patterns', category: 'Frontend', minutes: 35, required: false },
        { title: 'Document type challenges solved', category: 'Writing', minutes: 30, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Next.js Deep Dive',
      theme: 'Frontend',
      tasks: [
        { title: 'Study App Router architecture', category: 'Frontend', minutes: 45, required: true },
        { title: 'Practice Server Components', category: 'Frontend', minutes: 40, required: true },
        { title: 'Learn data fetching patterns', category: 'Frontend', minutes: 40, required: true },
        { title: 'Implement streaming and Suspense', category: 'Frontend', minutes: 35, required: false },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    {
      title: 'Docker Basics',
      theme: 'DevOps',
      tasks: [
        { title: 'Study Dockerfile best practices', category: 'Backend', minutes: 40, required: true },
        { title: 'Learn multi-stage builds', category: 'Backend', minutes: 35, required: true },
        { title: 'Practice docker-compose', category: 'Backend', minutes: 45, required: true },
        { title: 'Document container patterns', category: 'Writing', minutes: 30, required: false },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'CI/CD Fundamentals',
      theme: 'DevOps',
      tasks: [
        { title: 'Study GitHub Actions basics', category: 'Backend', minutes: 40, required: true },
        { title: 'Write CI pipeline for tests', category: 'Backend', minutes: 45, required: true },
        { title: 'Learn deployment strategies', category: 'Backend', minutes: 35, required: false },
        { title: 'Practice blue-green deployment concept', category: 'Backend', minutes: 30, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Security Fundamentals',
      theme: 'Security',
      tasks: [
        { title: 'Study OWASP Top 10', category: 'Backend', minutes: 45, required: true },
        { title: 'Learn XSS and CSRF prevention', category: 'Backend', minutes: 40, required: true },
        { title: 'Practice SQL injection prevention', category: 'Backend', minutes: 35, required: true },
        { title: 'Review secure coding practices', category: 'Backend', minutes: 30, required: false },
        { title: 'Network: Send 3 LinkedIn messages', category: 'Pipeline', minutes: 20, required: false },
      ],
    },
    // Final Week: Integration & Review
    {
      title: 'Full Stack Integration',
      theme: 'Integration',
      tasks: [
        { title: 'Build end-to-end feature', category: 'Frontend', minutes: 60, required: true },
        { title: 'Connect FE to BE with proper error handling', category: 'Backend', minutes: 45, required: true },
        { title: 'Implement optimistic updates', category: 'Frontend', minutes: 40, required: false },
        { title: 'Write integration tests', category: 'Backend', minutes: 45, required: true },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Performance Optimization',
      theme: 'Performance',
      tasks: [
        { title: 'Profile frontend performance', category: 'Frontend', minutes: 45, required: true },
        { title: 'Optimize database queries', category: 'SQL/DB', minutes: 45, required: true },
        { title: 'Implement proper caching', category: 'Redis/Caching', minutes: 40, required: true },
        { title: 'Document optimization strategies', category: 'Writing', minutes: 30, required: false },
        { title: 'Send 2 applications', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Mock Interview Prep',
      theme: 'Interview',
      tasks: [
        { title: 'Practice explaining projects', category: 'Review', minutes: 45, required: true },
        { title: 'Review system design frameworks', category: 'System Design', minutes: 40, required: true },
        { title: 'Practice coding problems', category: 'Review', minutes: 60, required: true },
        { title: 'Prepare STAR stories', category: 'Writing', minutes: 45, required: true },
        { title: 'Network: Send 5 LinkedIn messages', category: 'Pipeline', minutes: 30, required: false },
      ],
    },
    {
      title: 'Final Review & Consolidation',
      theme: 'Review',
      tasks: [
        { title: 'Review all notes and documentation', category: 'Review', minutes: 60, required: true },
        { title: 'Create study summary document', category: 'Writing', minutes: 45, required: true },
        { title: 'Identify gaps for future study', category: 'Review', minutes: 30, required: true },
        { title: 'Update portfolio/resume', category: 'Pipeline', minutes: 45, required: true },
        { title: 'Celebrate completion! 🎉', category: 'Review', minutes: 15, required: true },
      ],
    },
  ];

  // Create days and tasks
  for (let i = 0; i < planData.length; i++) {
    const dayData = planData[i];

    const planDay = await prisma.planDay.create({
      data: {
        planId: plan.id,
        dayIndex: i + 1,
        title: dayData.title,
        theme: dayData.theme,
      },
    });

    for (let j = 0; j < dayData.tasks.length; j++) {
      const taskData = dayData.tasks[j];

      await prisma.task.create({
        data: {
          planDayId: planDay.id,
          title: taskData.title,
          category: taskData.category,
          estimatedMinutes: taskData.minutes,
          required: taskData.required,
          order: j,
          tags: JSON.stringify([]),
        },
      });
    }

    console.log(`✅ Created Day ${i + 1}: ${dayData.title}`);
  }

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log(`📅 Plan starts: ${settings.startDate}`);
  console.log(`📚 Total days: ${planData.length}`);
  console.log(`✨ Total tasks: ${planData.reduce((sum, d) => sum + d.tasks.length, 0)}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
