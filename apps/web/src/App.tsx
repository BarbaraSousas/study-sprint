import { Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Calendar,
  Settings,
  Edit3,
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { ReminderBanner } from '@/components/dashboard/ReminderBanner';
import { Dashboard } from '@/pages/Dashboard';
import { MapView } from '@/pages/MapView';
import { DayView } from '@/pages/DayView';
import { PlanEditor } from '@/pages/PlanEditor';
import { SettingsPage } from '@/pages/Settings';
import { cn } from '@/lib/utils';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <ReminderBanner />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 p-8 items-center">
          <div className="mr-8 flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              StudySprint
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <NavItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
            <NavItem to="/map" icon={<Map className="h-4 w-4" />} label="Map" />
            <NavItem to="/editor" icon={<Edit3 className="h-4 w-4" />} label="Editor" />
            <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container py-6 px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/day/:date" element={<DayView />} />
          <Route path="/editor" element={<PlanEditor />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <Toaster />
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default App;
