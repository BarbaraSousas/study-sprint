import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  Zap,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { generatedApi, logsApi } from '@/lib/api';
import {
  computeBehindStatus,
  computeStreak,
  computeChartsSeries,
  computeTotalXP,
  generateRecoveryPlan,
  type GeneratedDay,
  type DailyLog,
} from '@studysprint/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['generated'],
    queryFn: generatedApi.get,
  });

  const { data: logs } = useQuery({
    queryKey: ['logs'],
    queryFn: () => logsApi.list(),
  });

  const updateLogMutation = useMutation({
    mutationFn: ({ date, data }: { date: string; data: any }) => logsApi.update(date, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
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
        <p className="text-muted-foreground">
          Failed to load data. Make sure to run the seed first.
        </p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries()}>
          Retry
        </Button>
      </div>
    );
  }

  const logsMap = new Map<string, DailyLog>(
    (logs || []).map((log: DailyLog) => [log.date, log])
  );

  const todayDay = data.days?.find((d: GeneratedDay) => d.date === data.today);
  const todayLog = logsMap.get(data.today);

  const behindStatus = computeBehindStatus(data.days || [], logsMap, data.today);
  const streak = computeStreak(
    data.days || [],
    logsMap,
    data.settings?.streakRuleMinTasks || 1,
    data.today
  );
  const totalXP = computeTotalXP(data.days || [], logsMap);
  const charts = computeChartsSeries(data.days || [], logsMap, data.today);
  const recoveryPlan = behindStatus.isBehind ? generateRecoveryPlan(behindStatus) : [];

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!todayLog && !todayDay) return;

    const currentCompleted = todayLog?.completedTaskIds || [];
    const newCompleted = completed
      ? [...currentCompleted, taskId]
      : currentCompleted.filter((id: string) => id !== taskId);

    try {
      await updateLogMutation.mutateAsync({
        date: data.today,
        data: { completedTaskIds: newCompleted },
      });
    } catch {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Behind Banner */}
      {behindStatus.isBehind && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              You're Behind Schedule
            </CardTitle>
            <CardDescription>
              {behindStatus.pendingRequiredCount} required task(s) pending from previous days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {recoveryPlan.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Day {item.dayIndex}:</span>
                  <span>{item.task.title}</span>
                  <span className="text-muted-foreground">({item.task.estimatedMinutes}min)</span>
                </div>
              ))}
              {recoveryPlan.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{recoveryPlan.length - 3} more tasks...
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
              View Recovery Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak} days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXP}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayDay?.progress?.percent || 0}%</div>
            <Progress value={todayDay?.progress?.percent || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.days?.filter((d: GeneratedDay) => d.status === 'done').length || 0} / {data.days?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      {todayDay && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today: {todayDay.title}</CardTitle>
                <CardDescription>
                  {todayDay.progress.completedTasks} of {todayDay.progress.totalTasks} tasks completed
                </CardDescription>
              </div>
              <Button onClick={() => navigate(`/day/${data.today}`)}>
                Open Day View
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayDay.tasks.slice(0, 5).map((task: any) => {
                const isCompleted = todayLog?.completedTaskIds?.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      isCompleted && 'bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                    />
                    <div className="flex-1">
                      <p className={cn('font-medium', isCompleted && 'line-through text-muted-foreground')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                          {task.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimatedMinutes}min
                        </span>
                        {task.required && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {todayDay.tasks.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{todayDay.tasks.length - 5} more tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  name="Completed (min)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  name="Target (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.daily.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned" fill="hsl(var(--muted))" name="Planned (min)" />
                <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
