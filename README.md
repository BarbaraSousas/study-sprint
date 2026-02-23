# StudySprint (MVP)

A gamified study tracking app that turns your learning journey into a game. Built as a **Minimum Viable Product** to validate the core concept.

## Purpose

Staying consistent with a study plan is hard. StudySprint adds game mechanics to make it engaging:

- **Visual progress map** — See your journey as a trail of levels
- **Daily missions** — Check off tasks and track time spent
- **Streaks & XP** — Stay motivated with progress indicators
- **Reflections** — Write daily notes to reinforce learning

## Core Concept

| Study Term | Game Term |
|------------|-----------|
| Plan       | Campaign  |
| Day        | Level     |
| Task       | Mission   |
| Daily Log  | Save Game |

## MVP Scope

This version focuses on **personal, local use**:

- Single user (no authentication)
- Local SQLite database
- Runs entirely on your machine

Future iterations may add multi-user support, cloud sync, and mobile apps.

## Quick Start

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind, shadcn/ui
- **Backend**: Node.js, Fastify, Prisma, SQLite
- **Monorepo**: apps/web, apps/api, packages/shared

## AI-Powered Study Plans

StudySprint integrates with **Groq API** to generate personalized study plans. Just describe your learning goals, and the AI creates a complete plan with days, tasks, and time estimates tailored to your needs.

## License

MIT
