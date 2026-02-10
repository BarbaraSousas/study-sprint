import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSearch, SearchResult } from '@/hooks/use-search';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate();
  const { query, setQuery, results, hasResults } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open, setQuery]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    navigate(`/day/${result.date}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and days..."
            className="border-0 focus-visible:ring-0 px-3 h-12"
            autoFocus
          />
        </div>

        {query && (
          <div className="max-h-80 overflow-y-auto p-2">
            {hasResults ? (
              results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors',
                    index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {result.type === 'day' ? (
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  ) : (
                    <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.type === 'task'
                        ? `Day ${result.dayIndex} • ${result.category}`
                        : result.date}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                No results found
              </p>
            )}
          </div>
        )}

        <div className="border-t p-2 text-xs text-muted-foreground flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted">↵</kbd> select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted">esc</kbd> close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
