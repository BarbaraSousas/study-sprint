import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Star,
  Lock,
} from 'lucide-react';
import { generatedApi } from '@/lib/api';
import type { GeneratedDay, DayStatus } from '@studysprint/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const statusConfig: Record<DayStatus, { icon: typeof Circle; color: string; bg: string }> = {
  done: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
  today: { icon: Star, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  partial: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  behind: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
  future: { icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted border-muted' },
};

export function MapView() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['generated'],
    queryFn: generatedApi.get,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load map data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{data.plan?.name || 'Study Plan'}</h1>
        <p className="text-muted-foreground">
          {data.days?.length || 0} levels starting from {data.settings?.startDate}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <config.icon className={cn('h-4 w-4', config.color)} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Map Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.days?.map((day: GeneratedDay) => {
          const config = statusConfig[day.status];
          const StatusIcon = config.icon;

          return (
            <Card
              key={day.dayId}
              className={cn(
                'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg',
                config.bg,
                day.status === 'today' && 'ring-2 ring-primary'
              )}
              onClick={() => navigate(`/day/${day.date}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn('h-5 w-5', config.color)} />
                    <CardTitle className="text-lg">Day {day.dayIndex}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    {day.xp}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-1 line-clamp-1">{day.title}</h3>
                {day.theme && (
                  <p className="text-xs text-muted-foreground mb-2">{day.theme}</p>
                )}
                <p className="text-sm text-muted-foreground mb-2">{day.date}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{day.progress.percent}%</span>
                  </div>
                  <Progress value={day.progress.percent} className="h-2" />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {day.progress.completedTasks}/{day.progress.totalTasks} tasks
                    </span>
                    <span>
                      {day.progress.minutesDone}/{day.progress.minutesPlanned} min
                    </span>
                  </div>

                  {day.progress.requiredTasks > 0 && (
                    <div className="text-xs">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full',
                          day.progress.completedRequiredTasks === day.progress.requiredTasks
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {day.progress.completedRequiredTasks}/{day.progress.requiredTasks} required
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
