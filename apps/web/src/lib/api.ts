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
  get: () => fetchAPI<any>('/settings'),
  update: (data: any) => fetchAPI<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// Plans
export const plansApi = {
  list: () => fetchAPI<any[]>('/plans'),
  create: (data: { name: string }) => fetchAPI<any>('/plans', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI<any>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI<any>(`/plans/${id}`, { method: 'DELETE' }),
  setActive: (id: string) => fetchAPI<any>(`/plans/${id}/set-active`, { method: 'POST' }),
  duplicate: (id: string) => fetchAPI<any>(`/plans/${id}/duplicate`, { method: 'POST' }),
};

// Days
export const daysApi = {
  list: (planId: string) => fetchAPI<any[]>(`/plans/${planId}/days`),
  create: (planId: string, data: any) => fetchAPI<any>(`/plans/${planId}/days`, { method: 'POST', body: JSON.stringify(data) }),
  update: (dayId: string, data: any) => fetchAPI<any>(`/days/${dayId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (dayId: string) => fetchAPI<any>(`/days/${dayId}`, { method: 'DELETE' }),
  reorder: (planId: string, orderedIds: string[]) => fetchAPI<any>(`/plans/${planId}/days/reorder`, { method: 'POST', body: JSON.stringify({ orderedIds }) }),
};

// Tasks
export const tasksApi = {
  list: (dayId: string) => fetchAPI<any[]>(`/days/${dayId}/tasks`),
  create: (dayId: string, data: any) => fetchAPI<any>(`/days/${dayId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  update: (taskId: string, data: any) => fetchAPI<any>(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (taskId: string) => fetchAPI<any>(`/tasks/${taskId}`, { method: 'DELETE' }),
  reorder: (dayId: string, orderedIds: string[]) => fetchAPI<any>(`/days/${dayId}/tasks/reorder`, { method: 'POST', body: JSON.stringify({ orderedIds }) }),
};

// Generated view
export const generatedApi = {
  get: () => fetchAPI<any>('/plan/active/generated'),
};

// Logs
export const logsApi = {
  list: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return fetchAPI<any[]>(`/logs${query ? `?${query}` : ''}`);
  },
  get: (date: string) => fetchAPI<any>(`/logs/${date}`),
  update: (date: string, data: any) => fetchAPI<any>(`/logs/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Export/Import
export const exportApi = {
  export: () => fetchAPI<any>('/export'),
  import: (data: any) => fetchAPI<any>('/import', { method: 'POST', body: JSON.stringify(data) }),
  reset: () => fetchAPI<any>('/reset', { method: 'POST' }),
};
