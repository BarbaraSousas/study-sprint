import type {
  Task,
  DailyLog,
  DayProgress,
  BehindStatus,
  GeneratedDay,
  ChartsSeries,
  ProgressChartPoint,
  BurndownChartPoint,
  DailyChartPoint,
  DayStatus,
} from './types';

// ============================================
// Date Utilities
// ============================================

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

// ============================================
// Progress Calculations
// ============================================

export function computeDayProgress(
  dayTasks: Task[],
  completedTaskIds: string[]
): DayProgress {
  const completedSet = new Set(completedTaskIds);

  let minutesPlanned = 0;
  let minutesDone = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let requiredTasks = 0;
  let completedRequiredTasks = 0;

  for (const task of dayTasks) {
    totalTasks++;
    minutesPlanned += task.estimatedMinutes;

    if (task.required) {
      requiredTasks++;
    }

    if (completedSet.has(task.id)) {
      completedTasks++;
      minutesDone += task.estimatedMinutes;
      if (task.required) {
        completedRequiredTasks++;
      }
    }
  }

  const percent = minutesPlanned > 0
    ? Math.round((minutesDone / minutesPlanned) * 100)
    : 0;

  return {
    minutesPlanned,
    minutesDone,
    percent,
    totalTasks,
    completedTasks,
    requiredTasks,
    completedRequiredTasks,
  };
}

// ============================================
// Behind Status
// ============================================

export function computeBehindStatus(
  generatedDays: GeneratedDay[],
  logs: Map<string, DailyLog>,
  today: string
): BehindStatus {
  const pendingList: BehindStatus['pendingList'] = [];

  for (const day of generatedDays) {
    // Only check days before today
    if (compareDates(day.date, today) >= 0) continue;

    const log = logs.get(day.date);
    const completedIds = new Set(log?.completedTaskIds ?? []);

    for (const task of day.tasks) {
      if (task.required && !completedIds.has(task.id)) {
        pendingList.push({
          dayIndex: day.dayIndex,
          date: day.date,
          task,
        });
      }
    }
  }

  // Sort by dayIndex, then by task order
  pendingList.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    return a.task.order - b.task.order;
  });

  return {
    isBehind: pendingList.length > 0,
    pendingRequiredCount: pendingList.length,
    pendingList,
  };
}

// ============================================
// Streak Calculation
// ============================================

export function computeStreak(
  generatedDays: GeneratedDay[],
  logs: Map<string, DailyLog>,
  minTasksPerDay: number,
  today: string
): number {
  // Sort days by date descending to count backwards from today
  const sortedDays = [...generatedDays]
    .filter(d => compareDates(d.date, today) <= 0)
    .sort((a, b) => compareDates(b.date, a.date));

  let streak = 0;
  let previousDate = today;

  for (const day of sortedDays) {
    // Check if this is a consecutive day
    const expectedDate = addDays(previousDate, streak === 0 ? 0 : -1);

    if (day.date !== expectedDate && streak > 0) {
      // Gap in days, streak broken
      break;
    }

    const log = logs.get(day.date);
    const completedCount = log?.completedTaskIds?.length ?? 0;

    if (completedCount >= minTasksPerDay) {
      streak++;
      previousDate = day.date;
    } else if (streak > 0) {
      // Didn't meet minimum, streak broken (unless it's today and we haven't started)
      if (day.date !== today) {
        break;
      }
    }
  }

  return streak;
}

// ============================================
// XP Calculation
// ============================================

const XP_PER_TASK = 10;
const XP_BONUS_REQUIRED = 5;
const XP_BONUS_DAY_COMPLETE = 50;

export function computeDayXP(
  dayTasks: Task[],
  completedTaskIds: string[]
): number {
  const completedSet = new Set(completedTaskIds);
  let xp = 0;

  for (const task of dayTasks) {
    if (completedSet.has(task.id)) {
      xp += XP_PER_TASK;
      if (task.required) {
        xp += XP_BONUS_REQUIRED;
      }
    }
  }

  // Bonus for completing all required tasks
  const allRequiredDone = dayTasks
    .filter(t => t.required)
    .every(t => completedSet.has(t.id));

  if (allRequiredDone && dayTasks.some(t => t.required)) {
    xp += XP_BONUS_DAY_COMPLETE;
  }

  return xp;
}

export function computeTotalXP(
  generatedDays: GeneratedDay[],
  logs: Map<string, DailyLog>
): number {
  let total = 0;

  for (const day of generatedDays) {
    const log = logs.get(day.date);
    total += computeDayXP(day.tasks, log?.completedTaskIds ?? []);
  }

  return total;
}

// ============================================
// Day Status
// ============================================

export function computeDayStatus(
  day: { date: string; tasks: Task[] },
  log: DailyLog | undefined,
  today: string
): DayStatus {
  const dateComparison = compareDates(day.date, today);
  const completedIds = new Set(log?.completedTaskIds ?? []);

  const requiredTasks = day.tasks.filter(t => t.required);
  const allRequiredDone = requiredTasks.every(t => completedIds.has(t.id));
  const anyDone = completedIds.size > 0;

  if (dateComparison > 0) {
    return 'future';
  }

  if (dateComparison === 0) {
    return 'today';
  }

  // Past day
  if (allRequiredDone && requiredTasks.length > 0) {
    return 'done';
  }

  if (anyDone) {
    return 'partial';
  }

  return 'behind';
}

// ============================================
// Charts Data
// ============================================

export function computeChartsSeries(
  generatedDays: GeneratedDay[],
  logs: Map<string, DailyLog>,
  today: string
): ChartsSeries {
  const sortedDays = [...generatedDays].sort((a, b) => a.dayIndex - b.dayIndex);

  // Calculate totals for ideal lines
  const totalMinutes = sortedDays.reduce(
    (sum, d) => sum + d.tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
    0
  );
  const totalDays = sortedDays.length;

  const progress: ProgressChartPoint[] = [];
  const burndown: BurndownChartPoint[] = [];
  const daily: DailyChartPoint[] = [];

  let cumulativeCompleted = 0;
  let remainingMinutes = totalMinutes;

  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i];
    const log = logs.get(day.date);
    const completedIds = new Set(log?.completedTaskIds ?? []);

    const dayPlanned = day.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    const dayCompleted = day.tasks
      .filter(t => completedIds.has(t.id))
      .reduce((s, t) => s + t.estimatedMinutes, 0);

    cumulativeCompleted += dayCompleted;
    remainingMinutes -= dayCompleted;

    const idealProgressPerDay = totalMinutes / totalDays;
    const idealRemainingPerDay = totalMinutes / totalDays;

    progress.push({
      date: day.date,
      dayIndex: day.dayIndex,
      label: `Day ${day.dayIndex}`,
      cumulative: cumulativeCompleted,
      target: Math.round(idealProgressPerDay * (i + 1)),
    });

    burndown.push({
      date: day.date,
      dayIndex: day.dayIndex,
      label: `Day ${day.dayIndex}`,
      remaining: remainingMinutes,
      ideal: Math.round(totalMinutes - idealRemainingPerDay * (i + 1)),
    });

    daily.push({
      date: day.date,
      dayIndex: day.dayIndex,
      label: `Day ${day.dayIndex}`,
      planned: dayPlanned,
      completed: dayCompleted,
      hoursSpent: log?.hoursSpent ?? 0,
    });
  }

  return { progress, burndown, daily };
}

// ============================================
// Recovery Plan
// ============================================

export function generateRecoveryPlan(
  behindStatus: BehindStatus
): BehindStatus['pendingList'] {
  // Sort by: required first, then by estimated minutes (shortest first), then by date (oldest first)
  return [...behindStatus.pendingList].sort((a, b) => {
    // Required tasks first (both are required in this list, but keep for clarity)
    if (a.task.required !== b.task.required) {
      return a.task.required ? -1 : 1;
    }
    // Shorter tasks first
    if (a.task.estimatedMinutes !== b.task.estimatedMinutes) {
      return a.task.estimatedMinutes - b.task.estimatedMinutes;
    }
    // Older first
    return a.dayIndex - b.dayIndex;
  });
}
