import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<unknown>;
  debounceMs?: number;
  enabled?: boolean;
  queryKeysToInvalidate?: string[][];
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 1000,
  enabled = true,
  queryKeysToInvalidate = [],
}: UseAutosaveOptions<T>) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(data));
  const isInitialMount = useRef(true);

  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setStatus('saved');
      lastSavedRef.current = JSON.stringify(data);
      queryKeysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      setTimeout(() => setStatus('idle'), 2000);
    },
    onError: () => {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    },
  });

  const save = useCallback(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    setStatus('saving');
    mutation.mutate(data);
  }, [data, enabled, mutation]);

  useEffect(() => {
    // Skip the initial mount to avoid saving on first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedRef.current = JSON.stringify(data);
      return;
    }

    if (!enabled) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save]);

  // Update lastSavedRef when data is loaded from server
  const syncWithServer = useCallback((serverData: T) => {
    lastSavedRef.current = JSON.stringify(serverData);
    isInitialMount.current = true;
  }, []);

  return {
    status,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    isError: status === 'error',
    saveNow: save,
    syncWithServer,
  };
}
