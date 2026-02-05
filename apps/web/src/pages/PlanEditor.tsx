import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { plansApi, daysApi, tasksApi } from '@/lib/api';
import type { TaskCategory } from '@studysprint/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES: TaskCategory[] = [
  'Frontend',
  'Backend',
  'SQL/DB',
  'Redis/Caching',
  'System Design',
  'Writing',
  'Pipeline',
  'Review',
  'Other',
];

export function PlanEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingDay, setEditingDay] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingDay, setDeletingDay] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
  });

  const activePlan = plans?.find((p: any) => p.isActive);
  const currentPlanId = selectedPlanId || activePlan?.id;

  const { data: days, refetch: refetchDays } = useQuery({
    queryKey: ['days', currentPlanId],
    queryFn: () => daysApi.list(currentPlanId!),
    enabled: !!currentPlanId,
  });

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setShowNewPlanDialog(false);
      setNewPlanName('');
      toast({ title: 'Plan created' });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: plansApi.setActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      toast({ title: 'Plan activated' });
    },
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: plansApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({ title: 'Plan duplicated' });
    },
  });

  const createDayMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) => daysApi.create(planId, data),
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
    },
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: any }) => daysApi.update(dayId, data),
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      setEditingDay(null);
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: daysApi.delete,
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      setDeletingDay(null);
    },
  });

  const reorderDaysMutation = useMutation({
    mutationFn: ({ planId, orderedIds }: { planId: string; orderedIds: string[] }) =>
      daysApi.reorder(planId, orderedIds),
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: any }) => tasksApi.create(dayId, data),
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => tasksApi.update(taskId, data),
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      setDeletingTask(null);
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: ({ dayId, orderedIds }: { dayId: string; orderedIds: string[] }) =>
      tasksApi.reorder(dayId, orderedIds),
    onSuccess: () => {
      refetchDays();
    },
  });

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !days || !currentPlanId) return;

    const oldIndex = days.findIndex((d: any) => d.id === active.id);
    const newIndex = days.findIndex((d: any) => d.id === over.id);

    const newOrder = arrayMove(days, oldIndex, newIndex);
    reorderDaysMutation.mutate({
      planId: currentPlanId,
      orderedIds: newOrder.map((d: any) => d.id),
    });
  };

  const handleTaskDragEnd = (dayId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const day = days?.find((d: any) => d.id === dayId);
    if (!day) return;

    const oldIndex = day.tasks.findIndex((t: any) => t.id === active.id);
    const newIndex = day.tasks.findIndex((t: any) => t.id === over.id);

    const newOrder = arrayMove(day.tasks, oldIndex, newIndex);
    reorderTasksMutation.mutate({
      dayId,
      orderedIds: newOrder.map((t: any) => t.id),
    });
  };

  const toggleDay = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Editor</h1>
          <p className="text-muted-foreground">
            Create and edit your study plans
          </p>
        </div>
        <Button onClick={() => setShowNewPlanDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {/* Plan Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {plans?.map((plan: any) => (
              <div
                key={plan.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  plan.isActive && 'bg-primary/5 border-primary'
                )}
              >
                <div className="flex items-center gap-3">
                  {plan.isActive && <Check className="h-4 w-4 text-primary" />}
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan._count?.days || 0} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicatePlanMutation.mutate(plan.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!plan.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveMutation.mutate(plan.id)}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Days Editor */}
      {currentPlanId && days && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Days</CardTitle>
            <Button
              size="sm"
              onClick={() =>
                createDayMutation.mutate({
                  planId: currentPlanId,
                  data: { title: `Day ${days.length + 1}` },
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Day
            </Button>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDayDragEnd}
            >
              <SortableContext
                items={days.map((d: any) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {days.map((day: any) => (
                    <SortableDay
                      key={day.id}
                      day={day}
                      isExpanded={expandedDays.has(day.id)}
                      onToggle={() => toggleDay(day.id)}
                      onEdit={() => setEditingDay(day)}
                      onDelete={() => setDeletingDay(day.id)}
                      onAddTask={() =>
                        createTaskMutation.mutate({
                          dayId: day.id,
                          data: {
                            title: 'New Task',
                            category: 'Other',
                            estimatedMinutes: 30,
                          },
                        })
                      }
                      onEditTask={(task: any) => setEditingTask(task)}
                      onDeleteTask={(taskId: string) => setDeletingTask(taskId)}
                      onTaskDragEnd={(e) => handleTaskDragEnd(day.id, e)}
                      sensors={sensors}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* New Plan Dialog */}
      <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                id="planName"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="My Study Plan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPlanDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createPlanMutation.mutate({ name: newPlanName })}
              disabled={!newPlanName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Day Dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Day</DialogTitle>
          </DialogHeader>
          {editingDay && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="dayTitle">Title</Label>
                <Input
                  id="dayTitle"
                  value={editingDay.title}
                  onChange={(e) => setEditingDay({ ...editingDay, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dayTheme">Theme (optional)</Label>
                <Input
                  id="dayTheme"
                  value={editingDay.theme || ''}
                  onChange={(e) => setEditingDay({ ...editingDay, theme: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateDayMutation.mutate({
                  dayId: editingDay.id,
                  data: { title: editingDay.title, theme: editingDay.theme || null },
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Title</Label>
                <Input
                  id="taskTitle"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="taskCategory">Category</Label>
                <Select
                  value={editingTask.category}
                  onValueChange={(v) => setEditingTask({ ...editingTask, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taskMinutes">Estimated Minutes</Label>
                <Input
                  id="taskMinutes"
                  type="number"
                  min="1"
                  value={editingTask.estimatedMinutes}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      estimatedMinutes: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="taskRequired"
                  checked={editingTask.required}
                  onCheckedChange={(checked) =>
                    setEditingTask({ ...editingTask, required: !!checked })
                  }
                />
                <Label htmlFor="taskRequired">Required</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateTaskMutation.mutate({
                  taskId: editingTask.id,
                  data: {
                    title: editingTask.title,
                    category: editingTask.category,
                    estimatedMinutes: editingTask.estimatedMinutes,
                    required: editingTask.required,
                  },
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Day Confirmation */}
      <AlertDialog open={!!deletingDay} onOpenChange={() => setDeletingDay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Day?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the day and all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDayMutation.mutate(deletingDay!)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTaskMutation.mutate(deletingTask!)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sortable Day Component
function SortableDay({
  day,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskDragEnd,
  sensors,
}: {
  day: any;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  onEditTask: (task: any) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskDragEnd: (event: DragEndEvent) => void;
  sensors: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: day.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('rounded-lg border', isDragging && 'opacity-50')}
    >
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-medium">Day {day.dayIndex}: {day.title}</span>
          {day.theme && (
            <span className="text-sm text-muted-foreground">({day.theme})</span>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {day.tasks?.length || 0} tasks
          </span>
        </button>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onTaskDragEnd}
          >
            <SortableContext
              items={(day.tasks || []).map((t: any) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1 mb-2">
                {(day.tasks || []).map((task: any) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    onEdit={() => onEditTask(task)}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button variant="ghost" size="sm" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}
    </div>
  );
}

// Sortable Task Component
function SortableTask({
  task,
  onEdit,
  onDelete,
}: {
  task: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded bg-muted/50',
        isDragging && 'opacity-50'
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{task.category}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimatedMinutes}min
          </span>
          {task.required && (
            <span className="text-primary">Required</span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Pencil className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
