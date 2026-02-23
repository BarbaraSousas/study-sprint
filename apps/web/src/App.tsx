import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Plus, Settings, Moon, Sun } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Home } from '@/pages/Home';
import { SprintView } from '@/pages/SprintView';
import { DayStudy } from '@/pages/DayStudy';
import { QuizView } from '@/pages/QuizView';
import { CreateSprint } from '@/pages/CreateSprint';
import { SettingsPage } from '@/pages/Settings';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

function App() {
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Desktop */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b hidden md:block">
        <div className="container flex h-14 px-8 items-center">
          <div className="mr-8 flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              StudySprint
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <NavItem to="/" icon={<HomeIcon className="h-4 w-4" />} label="Meus Sprints" />
            <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="Configuracoes" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Sprint
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title={resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            StudySprint
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 px-4 md:px-8 pb-24 md:pb-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sprint/:id" element={<SprintView />} />
          <Route path="/sprint/:id/day/:dayNumber" element={<DayStudy />} />
          <Route path="/sprint/:id/day/:dayNumber/quiz" element={<QuizView />} />
          <Route path="/create" element={<CreateSprint />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t md:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-4">
          <BottomNavItem
            to="/"
            icon={<HomeIcon className="h-5 w-5" />}
            label="Home"
            active={location.pathname === '/'}
          />
          <button
            onClick={() => navigate('/create')}
            className="flex flex-col items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-4"
          >
            <Plus className="h-6 w-6" />
          </button>
          <BottomNavItem
            to="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Config"
            active={location.pathname === '/settings'}
          />
        </div>
      </nav>

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

function BottomNavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        'flex flex-col items-center justify-center gap-1 min-w-[64px] py-2',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

export default App;
