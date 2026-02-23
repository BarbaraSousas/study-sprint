import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Play, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { sprintsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Sprint, SprintDayWithStatus } from '@studysprint/shared';
import { cn } from '@/lib/utils';

interface SprintWithDaysResponse extends Sprint {
  days: SprintDayWithStatus[];
  completedDays: number;
  progressPercent: number;
}

export function SprintView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sprint, setSprint] = useState<SprintWithDaysResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSprint();
    }
  }, [id]);

  async function loadSprint() {
    try {
      const data = await sprintsApi.get(id!);
      setSprint(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar sprint',
        description: 'Sprint nao encontrado',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  function getTotalMinutes(day: SprintDayWithStatus) {
    return day.tasks?.reduce((sum, t) => sum + t.minutes, 0) || 0;
  }

  function getCompletedTasks(day: SprintDayWithStatus) {
    return day.tasks?.filter(t => t.done).length || 0;
  }

  if (loading || !sprint) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{sprint.name}</h1>
            <p className="text-muted-foreground">
              {sprint.completedDays}/{sprint.totalDays} dias ({sprint.progressPercent}%)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={sprint.progressPercent} className="h-3" />

      {/* Days Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sprint.days.map(day => {
          const totalMinutes = getTotalMinutes(day);
          const completedTasks = getCompletedTasks(day);
          const totalTasks = day.tasks?.length || 0;
          const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <Card
              key={day.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                day.status === 'completed' && 'border-green-500/50 bg-green-500/5',
                day.status === 'current' && 'border-primary ring-2 ring-primary/20',
                day.status === 'locked' && 'opacity-60'
              )}
              onClick={() => {
                if (day.status !== 'locked') {
                  navigate(`/sprint/${id}/day/${day.dayNumber}`);
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {day.status === 'completed' ? (
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : day.status === 'current' ? (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-muted-foreground">
                      Dia {day.dayNumber}
                    </span>
                  </div>
                  {day.quizScore !== null && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Quiz: {day.quizScore}%
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{day.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {day.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{totalTasks} tarefas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{totalMinutes} min</span>
                  </div>
                </div>

                {day.status !== 'locked' && totalTasks > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{completedTasks}/{totalTasks} tarefas</span>
                      <span>{taskProgress}%</span>
                    </div>
                    <Progress value={taskProgress} className="h-1.5" />
                  </div>
                )}

                {day.status === 'current' && (
                  <Button className="w-full mt-2" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
