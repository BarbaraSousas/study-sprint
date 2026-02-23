import type {
  Settings,
  Sprint,
  SprintDayWithStatus,
  SprintTask,
  QuizResult,
  ChatMessage,
} from '@studysprint/shared';

// API response type for sprint with days that have status
interface SprintWithDaysResponse extends Sprint {
  days: SprintDayWithStatus[];
  completedDays: number;
  progressPercent: number;
}

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Settings
export const settingsApi = {
  get: () => fetchAPI<Settings>('/settings'),
  update: (data: Partial<Settings>) =>
    fetchAPI<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// Sprints
export const sprintsApi = {
  list: () => fetchAPI<Array<{
    id: string;
    name: string;
    objective: string;
    totalDays: number;
    completedDays: number;
    progressPercent: number;
    createdAt: string;
  }>>('/sprints'),

  get: (id: string) => fetchAPI<SprintWithDaysResponse>(`/sprints/${id}`),

  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(`/sprints/${id}`, { method: 'DELETE' }),
};

// Sprint Days
export const daysApi = {
  get: (sprintId: string, dayNumber: number) =>
    fetchAPI<SprintDayWithStatus & { sprintName: string }>(`/sprints/${sprintId}/days/${dayNumber}`),

  update: (sprintId: string, dayNumber: number, data: { tasks?: SprintTask[] }) =>
    fetchAPI<SprintDayWithStatus>(`/sprints/${sprintId}/days/${dayNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  complete: (sprintId: string, dayNumber: number, tasks: SprintTask[]) =>
    fetchAPI<SprintDayWithStatus>(`/sprints/${sprintId}/days/${dayNumber}/complete`, {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }),

  submitQuiz: (sprintId: string, dayNumber: number, answers: number[]) =>
    fetchAPI<QuizResult>(`/sprints/${sprintId}/days/${dayNumber}/quiz`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};

// Chat
export const chatApi = {
  start: (message: string) =>
    fetchAPI<{
      conversationId: string;
      message: string;
      planReady: boolean;
      planPreview?: { name: string; totalDays: number; days: { dayNumber: number; title: string }[] };
    }>('/chat/start', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  sendMessage: (conversationId: string, message: string) =>
    fetchAPI<{
      conversationId: string;
      message: string;
      planReady: boolean;
      planPreview?: { name: string; totalDays: number; days: { dayNumber: number; title: string }[] };
    }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message }),
    }),

  confirm: (conversationId: string) =>
    fetchAPI<{ success: boolean; sprintId: string }>('/chat/confirm', {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    }),

  getHistory: (sprintId: string) =>
    fetchAPI<ChatMessage[]>(`/chat/history/${sprintId}`),
};

// Export
export const exportApi = {
  export: () => fetchAPI<any>('/export'),
  reset: () => fetchAPI<any>('/reset', { method: 'POST', body: JSON.stringify({}) }),
};
