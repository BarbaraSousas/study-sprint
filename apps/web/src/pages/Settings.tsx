import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw, Bell, CheckCircle2 } from 'lucide-react';
import { settingsApi, exportApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { SkeletonForm } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationPermission,
  requestNotificationPermission as requestPermission,
  showNotification,
} from '@/lib/notifications';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Configuracoes salvas' });
    },
  });

  const exportMutation = useMutation({
    mutationFn: exportApi.export,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studysprint-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Exportacao baixada' });
    },
  });

  const resetMutation = useMutation({
    mutationFn: exportApi.reset,
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowResetConfirm(false);
      toast({ title: 'Dados resetados com sucesso' });
    },
  });

  const handleSettingChange = (field: string, value: string) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const [notificationStatus, setNotificationStatus] = useState(getNotificationPermission());

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    setNotificationStatus(getNotificationPermission());

    if (granted) {
      toast({ title: 'Notificacoes habilitadas' });
      showNotification('StudySprint', {
        body: 'Notificacoes ativadas!',
      });
    } else {
      toast({ title: 'Permissao negada', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <SkeletonForm />;
  }

  return (
    <div className="space-y-6 max-w-2xl animate-stagger">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">
          Configure suas preferencias
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuracoes Gerais</CardTitle>
          <CardDescription>
            Configure seu fuso horario e horario de lembrete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reminderTime">Horario do Lembrete Diario</Label>
            <Input
              id="reminderTime"
              type="time"
              value={settings?.reminderTime || '09:00'}
              onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="timezone">Fuso Horario</Label>
            <Input
              id="timezone"
              value={settings?.timezone || ''}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificacoes</CardTitle>
          <CardDescription>
            Habilite notificacoes do navegador para lembretes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificationStatus === 'unsupported' ? (
            <p className="text-sm text-muted-foreground">
              Seu navegador nao suporta notificacoes.
            </p>
          ) : notificationStatus === 'granted' ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Notificacoes habilitadas</span>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={handleEnableNotifications}>
                <Bell className="h-4 w-4 mr-2" />
                Habilitar Notificacoes
              </Button>
              {notificationStatus === 'denied' && (
                <p className="text-sm text-destructive">
                  Notificacoes bloqueadas. Habilite nas configuracoes do navegador.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
          <CardDescription>
            Exporte ou resete seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>

            <Button
              variant="destructive"
              onClick={() => setShowResetConfirm(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar Tudo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Exportar cria um arquivo JSON com todos os seus sprints e configuracoes.
          </p>
        </CardContent>
      </Card>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Todos os Dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai deletar todos os seus sprints e progresso. Suas configuracoes
              serao resetadas. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Resetar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
