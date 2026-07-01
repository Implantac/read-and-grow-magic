import { Suspense, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/system/useAuth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { BrainDrawer, BRAIN_OPEN_EVENT } from '@/components/ai/BrainDrawer';
import { DrillDownDrawer } from '@/shared/components/DrillDownDrawer';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function MainLayout() {
  const { isAuthenticated, sidebarCollapsed, theme, user } = useAppStore();
  const { loading } = useAuth();
  const navigate = useNavigate();

  // Handle auto-login if session exists but store is empty
  useEffect(() => {
    if (!loading && !isAuthenticated && !user) {
      // Small delay to ensure hooks are settled
      const timer = setTimeout(() => {
        if (!isAuthenticated) navigate('/login');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, navigate, user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Global shortcut: Ctrl/Cmd + J opens the contextual Brain drawer.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(BRAIN_OPEN_EVENT));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-dvh overflow-hidden bg-background">
      <CommandPalette />
      <BrainDrawer />
      <DrillDownDrawer />
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          'h-dvh overflow-y-auto pt-14 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">
          <Breadcrumbs />
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
