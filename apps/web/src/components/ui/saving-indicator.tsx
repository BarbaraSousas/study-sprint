import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutosaveStatus } from '@/hooks/use-autosave';

interface SavingIndicatorProps {
  status: AutosaveStatus;
  className?: string;
}

export function SavingIndicator({ status, className }: SavingIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span className="text-destructive">Failed to save</span>
        </>
      )}
    </div>
  );
}
