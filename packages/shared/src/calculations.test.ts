import { describe, it, expect } from 'vitest';
import {
  computeDayProgress,
  computeBehindStatus,
  computeStreak,
  computeChartsSeries,
  computeDayXP,
  addDays,
  formatDate,
  parseDate,
} from './calculations';
import type { Task, DailyLog, GeneratedDay } from './types';

// ============================================
// Test Helpers
// ============================================

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    planDayId: 'day-1',
    title: 'Test Task',
    description: null,
    category: 'Frontend',
    estimatedMinutes: 30,
    required: false,
    tags: [],
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDailyLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: `log-${Math.random().toString(36).slice(2)}`,
    userId: 'local-user',
    date: '2024-01-01',
    completedTaskIds: [],
    hoursSpent: 0,
    pipelineApplications: 0,
    pipelineMessages: 0,
    reflectionText: '',
    finalizedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createGeneratedDay(overrides: Partial<GeneratedDay> = {}): GeneratedDay {
  return {
    dayId: `day-${Math.random().toString(36).slice(2)}`,
    dayIndex: 1,
    date: '2024-01-01',
    title: 'Test Day',
    theme: null,
    tasks: [],
    status: 'future',
    progress: {
      minutesPlanned: 0,
      minutesDone: 0,
      percent: 0,
      totalTasks: 0,
      completedTasks: 0,
      requiredTasks: 0,
      completedRequiredTasks: 0,
    },
    xp: 0,
    ...overrides,
  };
}

// ============================================
// Date Utilities Tests
// ============================================

describe('Date Utilities', () => {
  it('formatDate formats Date to YYYY-MM-DD', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDate(date)).toBe('2024-01-15');
  });

  it('parseDate parses YYYY-MM-DD to Date', () => {
    const date = parseDate('2024-01-15');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });

  it('addDays adds days correctly', () => {
    expect(addDays('2024-01-01', 5)).toBe('2024-01-06');
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
  });
});

// ============================================
// computeDayProgress Tests
// ============================================

describe('computeDayProgress', () => {
  it('returns zero progress for empty tasks', () => {
    const result = computeDayProgress([], []);
    expect(result).toEqual({
      minutesPlanned: 0,
      minutesDone: 0,
      percent: 0,
      totalTasks: 0,
      completedTasks: 0,
      requiredTasks: 0,
      completedRequiredTasks: 0,
    });
  });

  it('calculates progress correctly with some completed tasks', () => {
    const task1 = createTask({ id: 'task-1', estimatedMinutes: 30, required: true });
    const task2 = createTask({ id: 'task-2', estimatedMinutes: 60, required: false });
    const task3 = createTask({ id: 'task-3', estimatedMinutes: 30, required: true });

    const result = computeDayProgress([task1, task2, task3], ['task-1', 'task-2']);

    expect(result.minutesPlanned).toBe(120);
    expect(result.minutesDone).toBe(90);
    expect(result.percent).toBe(75);
    expect(result.totalTasks).toBe(3);
    expect(result.completedTasks).toBe(2);
    expect(result.requiredTasks).toBe(2);
    expect(result.completedRequiredTasks).toBe(1);
  });

  it('handles 100% completion', () => {
    const task1 = createTask({ id: 'task-1', estimatedMinutes: 30 });
    const task2 = createTask({ id: 'task-2', estimatedMinutes: 30 });

    const result = computeDayProgress([task1, task2], ['task-1', 'task-2']);

    expect(result.percent).toBe(100);
    expect(result.completedTasks).toBe(2);
  });

  it('ignores unknown task IDs in completedTaskIds', () => {
    const task1 = createTask({ id: 'task-1', estimatedMinutes: 60 });

    const result = computeDayProgress([task1], ['task-1', 'unknown-task']);

    expect(result.completedTasks).toBe(1);
    expect(result.minutesDone).toBe(60);
  });
});

// ============================================
// computeBehindStatus Tests
// ============================================

describe('computeBehindStatus', () => {
  it('returns not behind when no required tasks are pending', () => {
    const task = createTask({ id: 'task-1', required: true });
    const day = createGeneratedDay({
      dayIndex: 1,
      date: '2024-01-01',
      tasks: [task],
    });
    const log = createDailyLog({
      date: '2024-01-01',
      completedTaskIds: ['task-1'],
    });
    const logs = new Map([['2024-01-01', log]]);

    const result = computeBehindStatus([day], logs, '2024-01-02');

    expect(result.isBehind).toBe(false);
    expect(result.pendingRequiredCount).toBe(0);
  });

  it('returns behind when required tasks are incomplete in past days', () => {
    const task1 = createTask({ id: 'task-1', required: true });
    const task2 = createTask({ id: 'task-2', required: false });
    const day = createGeneratedDay({
      dayIndex: 1,
      date: '2024-01-01',
      tasks: [task1, task2],
    });
    const logs = new Map<string, DailyLog>();

    const result = computeBehindStatus([day], logs, '2024-01-02');

    expect(result.isBehind).toBe(true);
    expect(result.pendingRequiredCount).toBe(1);
    expect(result.pendingList[0].task.id).toBe('task-1');
  });

  it('does not count today as behind', () => {
    const task = createTask({ id: 'task-1', required: true });
    const day = createGeneratedDay({
      dayIndex: 1,
      date: '2024-01-01',
      tasks: [task],
    });
    const logs = new Map<string, DailyLog>();

    const result = computeBehindStatus([day], logs, '2024-01-01');

    expect(result.isBehind).toBe(false);
  });

  it('does not count future days as behind', () => {
    const task = createTask({ id: 'task-1', required: true });
    const day = createGeneratedDay({
      dayIndex: 1,
      date: '2024-01-03',
      tasks: [task],
    });
    const logs = new Map<string, DailyLog>();

    const result = computeBehindStatus([day], logs, '2024-01-01');

    expect(result.isBehind).toBe(false);
  });
});

// ============================================
// computeStreak Tests
// ============================================

describe('computeStreak', () => {
  it('returns 0 when no tasks completed', () => {
    const day = createGeneratedDay({ date: '2024-01-01' });
    const logs = new Map<string, DailyLog>();

    const result = computeStreak([day], logs, 1, '2024-01-01');

    expect(result).toBe(0);
  });

  it('counts consecutive days with minimum tasks completed', () => {
    const days = [
      createGeneratedDay({ dayIndex: 1, date: '2024-01-01' }),
      createGeneratedDay({ dayIndex: 2, date: '2024-01-02' }),
      createGeneratedDay({ dayIndex: 3, date: '2024-01-03' }),
    ];
    const logs = new Map([
      ['2024-01-01', createDailyLog({ date: '2024-01-01', completedTaskIds: ['t1', 't2'] })],
      ['2024-01-02', createDailyLog({ date: '2024-01-02', completedTaskIds: ['t3', 't4'] })],
      ['2024-01-03', createDailyLog({ date: '2024-01-03', completedTaskIds: ['t5'] })],
    ]);

    const result = computeStreak(days, logs, 1, '2024-01-03');

    expect(result).toBe(3);
  });

  it('breaks streak when minimum not met', () => {
    const days = [
      createGeneratedDay({ dayIndex: 1, date: '2024-01-01' }),
      createGeneratedDay({ dayIndex: 2, date: '2024-01-02' }),
      createGeneratedDay({ dayIndex: 3, date: '2024-01-03' }),
    ];
    const logs = new Map([
      ['2024-01-01', createDailyLog({ date: '2024-01-01', completedTaskIds: ['t1', 't2'] })],
      ['2024-01-02', createDailyLog({ date: '2024-01-02', completedTaskIds: [] })], // Gap!
      ['2024-01-03', createDailyLog({ date: '2024-01-03', completedTaskIds: ['t5', 't6'] })],
    ]);

    const result = computeStreak(days, logs, 2, '2024-01-03');

    expect(result).toBe(1); // Only today counts
  });
});

// ============================================
// computeDayXP Tests
// ============================================

describe('computeDayXP', () => {
  it('returns 0 for no completed tasks', () => {
    const task = createTask({ id: 'task-1' });
    const result = computeDayXP([task], []);
    expect(result).toBe(0);
  });

  it('gives 10 XP per completed task', () => {
    const task1 = createTask({ id: 'task-1', required: false });
    const task2 = createTask({ id: 'task-2', required: false });
    const result = computeDayXP([task1, task2], ['task-1', 'task-2']);
    expect(result).toBe(20);
  });

  it('gives bonus XP for required tasks', () => {
    const task = createTask({ id: 'task-1', required: true });
    const result = computeDayXP([task], ['task-1']);
    expect(result).toBe(10 + 5 + 50); // base + required bonus + all required done bonus
  });

  it('gives day completion bonus when all required tasks done', () => {
    const task1 = createTask({ id: 'task-1', required: true });
    const task2 = createTask({ id: 'task-2', required: true });
    const task3 = createTask({ id: 'task-3', required: false });

    const result = computeDayXP([task1, task2, task3], ['task-1', 'task-2']);

    // 2 tasks * 10 = 20 + 2 required bonus * 5 = 10 + day bonus 50 = 80
    expect(result).toBe(80);
  });
});

// ============================================
// computeChartsSeries Tests
// ============================================

describe('computeChartsSeries', () => {
  it('generates correct series for multiple days', () => {
    const task1 = createTask({ id: 't1', estimatedMinutes: 60 });
    const task2 = createTask({ id: 't2', estimatedMinutes: 60 });
    const task3 = createTask({ id: 't3', estimatedMinutes: 60 });

    const days = [
      createGeneratedDay({ dayIndex: 1, date: '2024-01-01', tasks: [task1] }),
      createGeneratedDay({ dayIndex: 2, date: '2024-01-02', tasks: [task2] }),
      createGeneratedDay({ dayIndex: 3, date: '2024-01-03', tasks: [task3] }),
    ];

    const logs = new Map([
      ['2024-01-01', createDailyLog({ date: '2024-01-01', completedTaskIds: ['t1'], hoursSpent: 1.5 })],
      ['2024-01-02', createDailyLog({ date: '2024-01-02', completedTaskIds: ['t2'], hoursSpent: 2 })],
    ]);

    const result = computeChartsSeries(days, logs, '2024-01-03');

    // Progress series
    expect(result.progress).toHaveLength(3);
    expect(result.progress[0].cumulative).toBe(60);
    expect(result.progress[1].cumulative).toBe(120);
    expect(result.progress[2].cumulative).toBe(120); // Day 3 not completed

    // Burndown series
    expect(result.burndown).toHaveLength(3);
    expect(result.burndown[0].remaining).toBe(120); // 180 - 60
    expect(result.burndown[1].remaining).toBe(60);  // 120 - 60
    expect(result.burndown[2].remaining).toBe(60);  // Day 3 not done

    // Daily series
    expect(result.daily).toHaveLength(3);
    expect(result.daily[0].planned).toBe(60);
    expect(result.daily[0].completed).toBe(60);
    expect(result.daily[0].hoursSpent).toBe(1.5);
    expect(result.daily[2].completed).toBe(0);
  });

  it('handles empty data', () => {
    const result = computeChartsSeries([], new Map(), '2024-01-01');

    expect(result.progress).toHaveLength(0);
    expect(result.burndown).toHaveLength(0);
    expect(result.daily).toHaveLength(0);
  });
});
