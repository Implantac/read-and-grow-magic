import { useEffect } from 'react';
import { Command, Menu, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { Button } from '@/ui/base/button';
import { cn } from '@/lib/utils';
import { TenantSelector } from './topbar/TenantSelector';
import { NotificationsMenu } from './topbar/NotificationsMenu';
import { BrainButton } from './topbar/BrainButton';
import { UserMenu } from './topbar/UserMenu';

export function Topbar() {
  const navigate = useNavigate();
  const { activeCompany, activeBranch, sidebarCollapsed, theme, toggleSidebar, toggleSidebarMobile, toggleTheme } = useAppStore();

  const setActiveCompanyId = useEnterpriseStore((s) => s.setActiveCompanyId);
  const setActiveBranchId = useEnterpriseStore((s) => s.setActiveBranchId);

  useEffect(() => { setActiveCompanyId(activeCompany?.id ?? null); }, [activeCompany?.id, setActiveCompanyId]);
  useEffect(() => { setActiveBranchId(activeBranch?.id ?? null); }, [activeBranch?.id, setActiveBranchId]);

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-sidebar-border/40 px-2 sm:px-4 transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-xl supports-[backdrop-filter]:bg-[hsl(var(--sidebar-background)/0.72)]',
        'left-0',
        sidebarCollapsed ? 'md:left-16' : 'md:left-64'
      )}
      style={{ boxShadow: '0 1px 0 0 hsl(var(--sidebar-border) / 0.4), 0 10px 30px -18px hsl(222 33% 4% / 0.55)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) toggleSidebarMobile();
            else toggleSidebar();
          }}
          aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-controls="app-sidebar"
          aria-expanded={!sidebarCollapsed}
          className="h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <div className="mx-1 hidden sm:block h-6 w-px bg-sidebar-border/60" aria-hidden="true" />

        <TenantSelector />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50 hover:border-primary/30 text-xs transition-all"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar…</span>
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border/60 bg-sidebar-background/60 px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/50">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          className="h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 transition-all"
        >
          {theme === 'light' ? <Moon className="h-[18px] w-[18px]" aria-hidden="true" /> : <Sun className="h-[18px] w-[18px]" aria-hidden="true" />}
        </Button>

        <NotificationsMenu />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/executive/executive')}
          title="IA Executiva"
          aria-label="Abrir IA Executiva"
          className="hidden sm:inline-flex h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 transition-all"
        >
          <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <BrainButton />

        <div className="mx-2 hidden sm:block h-6 w-px bg-sidebar-border/60" aria-hidden="true" />

        <UserMenu />
      </div>
    </header>
  );
}
