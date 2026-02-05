# StudySprint

A gamified study tracking application that helps you follow your learning journey with a visual trail of levels, progress tracking, and daily reflections.

## Concept

StudySprint treats your study plan like a game:
- **Plan** = Campaign
- **Day** = Level
- **Task** = Mission
- **DailyLog** = Save Game

Navigate through a map of levels (Day 1..N), complete missions, track your hours, and write daily reflections to level up your skills.

## Features

- **Visual Map**: See your progress through a trail of levels with status indicators (done/today/behind/future)
- **Day View**: Checklist of tasks by category, time tracking, pipeline metrics, and reflection journal
- **Dashboard**: Today's tasks, progress charts, streak counter, XP tracking, and behind-schedule alerts
- **Plan Editor**: Full CRUD for days and tasks with drag-and-drop reordering
- **Settings**: Configure start date, reminder time, weekly goals, and streak rules
- **Export/Import**: Backup and restore all your data

## Behind Schedule Detection

A day is marked as "behind" if:
- It's a past day (before today)
- It has any **required** tasks that haven't been completed

The dashboard shows a recovery plan sorted by: required tasks first, then by estimated time (shortest first), then by date (oldest first).

## Streak Calculation

Your streak counts consecutive days where you've completed at least N tasks (configurable in settings, default: 1). The streak only counts up to today - future days don't count.

## Reminder Limitations

StudySprint runs 100% locally without external services. Reminders work as follows:

1. **In-app banner**: Shows when the current time is past your reminder time and today's day isn't finalized
2. **Browser notifications**: Optional - requires permission and only works when the app is open

For reliable reminders, consider:
- Using your phone's reminder app
- Setting up a calendar event
- Using a dedicated reminder service

## Tech Stack

### Monorepo Structure
```
studysprint/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Fastify backend
└── packages/
    └── shared/       # Types, schemas, and business logic
```

### Frontend (apps/web)
- React 18 + TypeScript
- Vite for bundling
- Tailwind CSS for styling
- shadcn/ui (Radix) for components
- TanStack Query for data fetching
- Recharts for charts
- dnd-kit for drag-and-drop

### Backend (apps/api)
- Node.js + TypeScript
- Fastify for the server
- Prisma ORM with SQLite
- Zod for validation

### Shared (packages/shared)
- TypeScript types
- Zod schemas
- Pure business logic functions (progress calculation, behind status, streak, charts)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone and navigate to the project
cd studysprint

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

### Development

```bash
# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Other Commands

```bash
# Run tests
npm test

# Open Prisma Studio (database viewer)
npm run db:studio

# Reset database and re-run migrations
npm run db:reset

# Build for production
npm run build
```

## Database Schema

### User
- `id`: Unique identifier
- `name`: Optional display name

### Settings (1 per user)
- `startDate`: When Day 1 begins (YYYY-MM-DD)
- `timezone`: User's timezone
- `reminderTime`: Daily reminder time (HH:mm)
- `weeklyGoalApplications`: Target applications per week
- `weeklyGoalMessages`: Target messages per week
- `streakRuleMinTasks`: Minimum tasks to maintain streak

### Plan
- `name`: Plan name
- `isActive`: Whether this is the current plan

### PlanDay
- `dayIndex`: 1-based index
- `title`: Day title
- `theme`: Optional category/theme

### Task
- `title`: Task title
- `description`: Optional details
- `category`: Frontend, Backend, SQL/DB, Redis/Caching, System Design, Writing, Pipeline, Review, Other
- `estimatedMinutes`: Time estimate
- `required`: Whether it's required for "done" status
- `order`: Sort order within day

### DailyLog
- `date`: The calendar date (YYYY-MM-DD)
- `completedTaskIds`: Array of completed task IDs
- `hoursSpent`: Hours tracked
- `pipelineApplications`: Applications sent
- `pipelineMessages`: Messages sent
- `reflectionText`: Daily reflection
- `finalizedAt`: When the day was finalized

## API Endpoints

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

### Plans
- `GET /api/plans` - List all plans
- `POST /api/plans` - Create a plan
- `PUT /api/plans/:planId` - Update a plan
- `DELETE /api/plans/:planId` - Delete a plan
- `POST /api/plans/:planId/set-active` - Set as active plan
- `POST /api/plans/:planId/duplicate` - Duplicate a plan

### Days
- `GET /api/plans/:planId/days` - List days with tasks
- `POST /api/plans/:planId/days` - Create a day
- `PUT /api/days/:dayId` - Update a day
- `DELETE /api/days/:dayId` - Delete a day
- `POST /api/plans/:planId/days/reorder` - Reorder days

### Tasks
- `GET /api/days/:dayId/tasks` - List tasks
- `POST /api/days/:dayId/tasks` - Create a task
- `PUT /api/tasks/:taskId` - Update a task
- `DELETE /api/tasks/:taskId` - Delete a task
- `POST /api/days/:dayId/tasks/reorder` - Reorder tasks

### Generated View
- `GET /api/plan/active/generated` - Get active plan with computed dates and status

### Logs
- `GET /api/logs` - List logs (optional: ?from=&to=)
- `GET /api/logs/:date` - Get log for a date
- `PUT /api/logs/:date` - Update/create log

### Export/Import
- `GET /api/export` - Export all data
- `POST /api/import` - Import data (replaces existing)
- `POST /api/reset` - Reset all data

## Adding Authentication (Future)

The codebase is prepared for authentication:

1. All tables have a `userId` field
2. `getCurrentUser()` middleware returns the current user (currently hardcoded to "local-user")

To add auth:

1. Install an auth library (e.g., `@fastify/jwt`, Clerk, Auth0)
2. Update `apps/api/src/middleware/auth.ts` to verify tokens
3. Add login/register endpoints
4. Update frontend to include auth headers

See the TODO comments in `auth.ts` for implementation examples.

## Customizing the Plan

The seed data includes a 30-day study plan covering Frontend, Backend, SQL/DB, Redis, and System Design. You can:

1. **Edit via UI**: Use the Plan Editor to modify days and tasks
2. **Create new plans**: Create from scratch or duplicate existing
3. **Change duration**: Add or remove days as needed
4. **Modify start date**: Change when Day 1 begins in Settings

## License

MIT
