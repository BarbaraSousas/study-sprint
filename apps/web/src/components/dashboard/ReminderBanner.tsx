import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { generatedApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function ReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  const { data } = useQuery({
    queryKey: ['generated'],
    queryFn: generatedApi.get,
    refetchInterval: 60000, // Check every minute
  });

  useEffect(() => {
    if (!data?.settings?.reminderTime) return;

    const checkReminder = () => {
      const now = new Date();
      const [hours, minutes] = data.settings.reminderTime.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // Check if current time is past reminder time
      if (now >= reminderTime) {
        // Check if today's day is finalized
        const todayDay = data.days?.find((d: any) => d.date === data.today);
        if (todayDay && todayDay.status !== 'done') {
          setShowReminder(true);
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [data]);

  if (!showReminder || dismissed) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">
            Reminder: Don't forget to complete today's study tasks!
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-primary-foreground/20"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
