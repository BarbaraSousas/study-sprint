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

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind, shadcn/ui
- **Backend**: Node.js, Fastify, Prisma, SQLite
- **Monorepo**: apps/web, apps/api, packages/shared

## AI-Powered Study Plans

StudySprint integrates with **Groq API** to generate personalized study plans. Just describe your learning goals, and the AI creates a complete plan with days, tasks, and time estimates tailored to your needs.

### YouTube Video Integration (AgentQL)

The app can enrich study plans with real YouTube videos using **AgentQL** for web scraping:

- Automatic video search based on daily topics
- Embedded video player in study day view
- Thumbnail previews with video metadata (duration, views, channel)

**Setup:**
```bash
# Add to apps/api/.env
GROQ_API_KEY=your-groq-key
AGENTQL_API_KEY=your-agentql-key  # Optional - videos work without it
```

## Project Structure

```text
studysprint/
├── apps/
│   ├── api/                 # Backend (Fastify)
│   │   └── src/
│   │       ├── routes/      # API endpoints
│   │       │   └── chat.ts  # AI chat + plan generation
│   │       └── services/
│   │           ├── db.ts    # Prisma client
│   │           └── youtube.ts # AgentQL video search
│   └── web/                 # Frontend (React)
│       └── src/
│           ├── pages/
│           │   ├── CreateSprint.tsx  # AI chat interface
│           │   ├── DayStudy.tsx      # Daily study view
│           │   └── SprintView.tsx    # Sprint overview
│           └── components/
│               └── YouTubeVideoCard.tsx  # Video player component
└── packages/
    └── shared/              # Shared types & schemas
        └── src/
            ├── types.ts     # TypeScript interfaces
            └── schemas.ts   # Zod validation schemas
```

## Recent Developments

### YouTube Video Enrichment

- Added `YouTubeVideo`, `EnhancedResource`, `VideoSearchTerm` types
- Created `YouTubeService` with AgentQL REST API integration
- Updated Groq prompt to generate `videoSearchTerms` per day
- Added `YouTubeVideoCard` component with embedded player
- Updated `DayStudy` page to display videos separately from links

### Chat Improvements

- Increased `max_tokens` to 8192 for longer study plans
- Added validation and retry logic for malformed JSON responses
- Better error handling and logging

---

## Roadmap / Next Tasks

### High Priority

- [ ] **Melhorar carregamento da criacao de sprint** - Mostrar loading state durante enriquecimento de videos
- [x] **Adicionar "ver mais" na listagem do dia** - Expandir detalhes na preview durante criacao
- [ ] **Verificar erro ao apagar sprint** - Debug e fix do delete functionality

### UI/UX Improvements

- [x] **Melhorar alinhamento do chat** - Ajustar layout das mensagens
- [x] **Centralizar layout e remover gaps** - Max-width 4xl centralizado
- [ ] **Melhorias visuais gerais** - Polish na interface

### Future Features

- [ ] Progress tracking with XP system
- [ ] Streak counter
- [ ] Daily reflections/notes
- [ ] Export/import study plans
- [ ] Mobile responsive improvements

---

## License

MIT
