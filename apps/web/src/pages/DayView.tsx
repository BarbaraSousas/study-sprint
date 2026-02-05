import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { generatedApi, logsApi } from '@/lib/api';
import type { GeneratedDay, Task, TaskCategory } from '@studysprint/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function DayView() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showReflectionModal, setShowReflectionModal] = useState(false);

  const { data } = useQuery({
    queryKey: ['generated'],
    queryFn: generatedApi.get,
  });

  const { data: logData } = useQuery({
    queryKey: ['log', date],
    queryFn: () => logsApi.get(date!),
    enabled: !!date,
  });

  const updateLogMutation = useMutation({
    mutationFn: (updateData: any) => logsApi.update(date!, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      queryClient.invalidateQueries({ queryKey: ['log', date] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  if (!data || !date) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const dayData: GeneratedDay | undefined = data.days?.find(
    (d: GeneratedDay) => d.date === date
  );

  if (!dayData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Day not found.</p>
        <Button className="mt-4" onClick={() => navigate('/map')}>
          Back to Map
        </Button>
      </div>
    );
  }

  const log = logData || {
    completedTaskIds: [],
    hoursSpent: 0,
    pipelineApplications: 0,
    pipelineMessages: 0,
    reflectionText: '',
    finalizedAt: null,
  };

  const completedSet = new Set(log.completedTaskIds);

  // Group tasks by category
  const tasksByCategory = dayData.tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    const newCompleted = completed
      ? [...log.completedTaskIds, taskId]
      : log.completedTaskIds.filter((id: string) => id !== taskId);

    try {
      await updateLogMutation.mutateAsync({ completedTaskIds: newCompleted });
    } catch {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleInputChange = async (field: string, value: number | string) => {
    try {
      await updateLogMutation.mutateAsync({ [field]: value });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleFinalize = () => {
    if (!log.reflectionText || log.reflectionText.trim() === '') {
      setShowReflectionModal(true);
      return;
    }

    finalizeDay();
  };

  const finalizeDay = async () => {
    try {
      await updateLogMutation.mutateAsync({
        finalizedAt: new Date().toISOString(),
      });
      toast({ title: 'Day finalized successfully!' });
      setShowReflectionModal(false);
    } catch {
      toast({ title: 'Failed to finalize', variant: 'destructive' });
    }
  };

  const isFinalized = !!log.finalizedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Day {dayData.dayIndex}: {dayData.title}</h1>
          <p className="text-muted-foreground">
            {dayData.date} {dayData.theme && `• ${dayData.theme}`}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={dayData.progress.percent} className="flex-1" />
                <span className="font-medium">{dayData.progress.percent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tasks</p>
              <p className="font-medium">
                {dayData.progress.completedTasks} / {dayData.progress.totalTasks}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Required</p>
              <p className="font-medium">
                {dayData.progress.completedRequiredTasks} / {dayData.progress.requiredTasks}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">XP Earned</p>
              <p className="font-medium text-yellow-500">{dayData.xp}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(tasksByCategory).map(([category, tasks]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const isCompleted = completedSet.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                          isCompleted && 'bg-muted/50',
                          isFinalized && 'pointer-events-none opacity-70'
                        )}
                      >
                        <Checkbox
                          checked={isCompleted}
                          disabled={isFinalized}
                          onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium',
                              isCompleted && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Time & Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Track Your Day</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hours">Hours Spent</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={log.hoursSpent}
                  disabled={isFinalized}
                  onChange={(e) => handleInputChange('hoursSpent', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="applications">Applications Sent</Label>
                <Input
                  id="applications"
                  type="number"
                  min="0"
                  value={log.pipelineApplications}
                  disabled={isFinalized}
                  onChange={(e) =>
                    handleInputChange('pipelineApplications', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="messages">Messages Sent</Label>
                <Input
                  id="messages"
                  type="number"
                  min="0"
                  value={log.pipelineMessages}
                  disabled={isFinalized}
                  onChange={(e) =>
                    handleInputChange('pipelineMessages', parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Reflection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What I Learned Today</CardTitle>
              <CardDescription>
                Reflect on your learning and progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your thoughts and learnings..."
                value={log.reflectionText}
                disabled={isFinalized}
                onChange={(e) => handleInputChange('reflectionText', e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Finalize */}
          <Card>
            <CardContent className="pt-6">
              {isFinalized ? (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Day Finalized</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleFinalize}>
                  Finalize Day
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reflection Modal */}
      <Dialog open={showReflectionModal} onOpenChange={setShowReflectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Reflection Required
            </DialogTitle>
            <DialogDescription>
              Please write a reflection about what you learned today before finalizing.
              This helps reinforce your learning!
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="What did you learn today?"
            value={log.reflectionText}
            onChange={(e) => handleInputChange('reflectionText', e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReflectionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={finalizeDay}
              disabled={!log.reflectionText || log.reflectionText.trim() === ''}
            >
              Save & Finalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
