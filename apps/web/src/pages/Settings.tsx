import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, RefreshCw, Bell } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['generated'] });
      toast({ title: 'Settings saved' });
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
      toast({ title: 'Export downloaded' });
    },
  });

  const importMutation = useMutation({
    mutationFn: exportApi.import,
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowImportConfirm(false);
      setImportData(null);
      toast({ title: 'Import completed successfully' });
    },
    onError: () => {
      toast({ title: 'Import failed', variant: 'destructive' });
    },
  });

  const resetMutation = useMutation({
    mutationFn: exportApi.reset,
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowResetConfirm(false);
      toast({ title: 'Data reset successfully. Run db:seed to restore sample data.' });
    },
  });

  const handleSettingChange = (field: string, value: string | number) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setImportData(data);
        setShowImportConfirm(true);
      } catch {
        toast({ title: 'Invalid file format', variant: 'destructive' });
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({ title: 'Browser notifications not supported', variant: 'destructive' });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast({ title: 'Notifications enabled' });
      new Notification('StudySprint', {
        body: 'Notifications are now enabled!',
        icon: '/favicon.svg',
      });
    } else {
      toast({ title: 'Permission denied', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your study plan and preferences
        </p>
      </div>

      {/* Plan Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Settings</CardTitle>
          <CardDescription>
            Configure when your plan starts and your daily reminder time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={settings?.startDate || ''}
              onChange={(e) => handleSettingChange('startDate', e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Day 1 of your plan starts on this date
            </p>
          </div>

          <div>
            <Label htmlFor="reminderTime">Daily Reminder Time</Label>
            <Input
              id="reminderTime"
              type="time"
              value={settings?.reminderTime || '09:00'}
              onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={settings?.timezone || ''}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Goals</CardTitle>
          <CardDescription>
            Set your pipeline targets for the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="weeklyApplications">Weekly Applications Goal</Label>
            <Input
              id="weeklyApplications"
              type="number"
              min="0"
              value={settings?.weeklyGoalApplications || 0}
              onChange={(e) =>
                handleSettingChange('weeklyGoalApplications', parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div>
            <Label htmlFor="weeklyMessages">Weekly Messages Goal</Label>
            <Input
              id="weeklyMessages"
              type="number"
              min="0"
              value={settings?.weeklyGoalMessages || 0}
              onChange={(e) =>
                handleSettingChange('weeklyGoalMessages', parseInt(e.target.value) || 0)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Streak Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Streak Settings</CardTitle>
          <CardDescription>
            Configure how streaks are calculated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="streakMinTasks">Minimum Tasks per Day</Label>
            <Input
              id="streakMinTasks"
              type="number"
              min="1"
              value={settings?.streakRuleMinTasks || 1}
              onChange={(e) =>
                handleSettingChange('streakRuleMinTasks', parseInt(e.target.value) || 1)
              }
            />
            <p className="text-sm text-muted-foreground mt-1">
              Complete at least this many tasks to maintain your streak
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Enable browser notifications for reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={requestNotificationPermission}>
            <Bell className="h-4 w-4 mr-2" />
            Enable Browser Notifications
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Note: Browser notifications only work when the app is open. For more reliable
            reminders, consider using a calendar app.
          </p>
        </CardContent>
      </Card>

      {/* Export / Import */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, or reset your data
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
              Export Data
            </Button>

            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              variant="destructive"
              onClick={() => setShowResetConfirm(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Export creates a JSON file with all your settings, plan, and logs.
            Import will replace all existing data.
          </p>
        </CardContent>
      </Card>

      {/* Import Confirmation */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all your current data with the imported data. This action
              cannot be undone.
              {importData && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p>Plan: {importData.plan?.name}</p>
                  <p>Days: {importData.days?.length}</p>
                  <p>Tasks: {importData.tasks?.length}</p>
                  <p>Logs: {importData.logs?.length}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => importMutation.mutate(importData)}
              disabled={importMutation.isPending}
            >
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your plans, progress, and logs. Your settings will be
              reset to defaults. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
