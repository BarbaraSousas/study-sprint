import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Target, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { sprintsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SprintSummary {
  id: string;
  name: string;
  objective: string;
  totalDays: number;
  completedDays: number;
  progressPercent: number;
  createdAt: string;
}

export function Home() {
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadSprints();
  }, []);

  async function loadSprints() {
    try {
      const data = await sprintsApi.list();
      setSprints(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar sprints',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await sprintsApi.delete(id);
      setSprints(sprints.filter(s => s.id !== id));
      toast({ title: 'Sprint deletado com sucesso' });
    } catch (error) {
      toast({
        title: 'Erro ao deletar sprint',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Sprints</h1>
        <Button onClick={() => navigate('/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum sprint criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro sprint de estudo com ajuda da IA
            </p>
            <Button onClick={() => navigate('/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sprints.map(sprint => (
            <Card
              key={sprint.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <Link to={`/sprint/${sprint.id}`} className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{sprint.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {sprint.totalDays} dias - {sprint.completedDays} concluidos - {sprint.progressPercent}%
                    </p>
                    <Progress value={sprint.progressPercent} className="h-2" />
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deletar Sprint</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar "{sprint.name}"? Esta acao nao pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(sprint.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleting === sprint.id}
                        >
                          {deleting === sprint.id ? 'Deletando...' : 'Deletar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create new sprint card */}
          <Card
            className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/create')}
          >
            <CardContent className="flex items-center justify-center py-8">
              <Plus className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Criar Novo Sprint</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
