import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { generatedApi } from '@/lib/api';
import type { GeneratedDay, Task } from '@studysprint/shared';

export interface SearchResult {
  type: 'task' | 'day';
  id: string;
  title: string;
  description?: string;
  dayIndex: number;
  date: string;
  category?: string;
}

export function useSearch() {
  const [query, setQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['generated'],
    queryFn: generatedApi.get,
  });

  const results = useMemo(() => {
    if (!query.trim() || !data?.days) return [];

    const searchTerm = query.toLowerCase();
    const matches: SearchResult[] = [];

    data.days.forEach((day: GeneratedDay) => {
      // Search day titles/themes
      if (
        day.title.toLowerCase().includes(searchTerm) ||
        day.theme?.toLowerCase().includes(searchTerm)
      ) {
        matches.push({
          type: 'day',
          id: day.dayId,
          title: `Day ${day.dayIndex}: ${day.title}`,
          description: day.theme || undefined,
          dayIndex: day.dayIndex,
          date: day.date,
        });
      }

      // Search tasks
      day.tasks.forEach((task: Task) => {
        if (
          task.title.toLowerCase().includes(searchTerm) ||
          task.description?.toLowerCase().includes(searchTerm) ||
          task.category.toLowerCase().includes(searchTerm)
        ) {
          matches.push({
            type: 'task',
            id: task.id,
            title: task.title,
            description: task.description || undefined,
            dayIndex: day.dayIndex,
            date: day.date,
            category: task.category,
          });
        }
      });
    });

    return matches.slice(0, 20); // Limit results
  }, [query, data]);

  return {
    query,
    setQuery,
    results,
    hasResults: results.length > 0,
  };
}
