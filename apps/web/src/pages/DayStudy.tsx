import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { daysApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { SprintDayWithStatus, SprintTask } from '@studysprint/shared';

export function DayStudy() {
  const { id, dayNumber } = useParams<{ id: string; dayNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [day, setDay] = useState<(SprintDayWithStatus & { sprintName: string }) | null>(null);
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (id && dayNumber) {
      loadDay();
    }
  }, [id, dayNumber]);

  async function loadDay() {
    try {
      const data = await daysApi.get(id!, parseInt(dayNumber!));
      setDay(data);
      setTasks(data.tasks || []);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dia',
        variant: 'destructive',
      });
      navigate(`/sprint/${id}`);
    } finally {
      setLoading(false);
    }
  }

  const saveProgress = useCallback(async (updatedTasks: SprintTask[]) => {
    if (!id || !dayNumber) return;
    setSaving(true);
    try {
      await daysApi.update(id, parseInt(dayNumber), { tasks: updatedTasks });
    } catch (error) {
      // Silent fail for autosave
    } finally {
      setSaving(false);
    }
  }, [id, dayNumber]);

  function handleTaskToggle(index: number) {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, done: !task.done } : task
    );
    setTasks(updatedTasks);
    saveProgress(updatedTasks);
  }

  async function handleComplete() {
    if (!id || !dayNumber || !day) return;

    setCompleting(true);
    try {
      await daysApi.complete(id, parseInt(dayNumber), tasks);
      toast({ title: 'Dia concluido!' });

      // Check if there are quiz questions
      if (day.quizQuestions && day.quizQuestions.length > 0) {
        navigate(`/sprint/${id}/day/${dayNumber}/quiz`);
      } else {
        navigate(`/sprint/${id}`);
      }
    } catch (error) {
      toast({
        title: 'Erro ao concluir dia',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  }

  const allTasksCompleted = tasks.every(t => t.done);
  const totalMinutes = tasks.reduce((sum, t) => sum + t.minutes, 0);
  const completedMinutes = tasks.filter(t => t.done).reduce((sum, t) => sum + t.minutes, 0);

  if (loading || !day) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/sprint/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            Dia {day.dayNumber}: {day.title}
          </h1>
          <p className="text-sm text-muted-foreground">{day.sprintName}</p>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Conteudo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{day.description}</p>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Tarefas</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedMinutes}/{totalMinutes} min
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={task.done}
                onCheckedChange={() => handleTaskToggle(index)}
                disabled={day.status === 'completed'}
              />
              <div className="flex-1">
                <span className={task.done ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{task.minutes} min</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources */}
      {day.resources && day.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5" />
              Recursos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {day.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{resource.title}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {day.status !== 'completed' && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleComplete}
          disabled={!allTasksCompleted || completing}
        >
          {completing ? (
            'Concluindo...'
          ) : allTasksCompleted ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Concluir Dia
            </>
          ) : (
            'Complete todas as tarefas'
          )}
        </Button>
      )}

      {day.status === 'completed' && (
        <div className="text-center text-muted-foreground">
          <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>Dia concluido!</p>
          {day.quizScore !== null && (
            <p className="text-sm">Quiz: {day.quizScore}%</p>
          )}
        </div>
      )}
    </div>
  );
}
