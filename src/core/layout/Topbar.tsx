import { useEffect } from 'react';
import { Bell, Brain, ChevronDown, LogOut, Menu, Moon, Sun, User, Search, Command, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Company, Branch } from '@/types';

import { useCompanies } from '@/hooks/system/useCompanies';
import { useAppStore } from '@/stores/useAppStore';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { useAuth } from '@/hooks/system/useAuth';
import { useNotifications } from '@/hooks/system/useNotifications';
import { useBrainDecisions } from '@/hooks/ai/useAIBrain';
import { Button } from '@/ui/base/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { Badge } from '@/ui/base/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeColors = {
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
};

export function Topbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth({ initialize: false });
  const {
    user, activeCompany, activeBranch, sidebarCollapsed, theme,
    toggleSidebar, toggleSidebarMobile, setActiveCompany, setActiveBranch, toggleTheme,
  } = useAppStore();

  const setActiveCompanyId = useEnterpriseStore((s) => s.setActiveCompanyId);
  const setActiveBranchId = useEnterpriseStore((s) => s.setActiveBranchId);

  // Keep enterprise store in sync so the supabase invoke interceptor
  // and edge functions always receive the correct tenant scope.
  useEffect(() => {
    setActiveCompanyId(activeCompany?.id ?? null);
  }, [activeCompany?.id, setActiveCompanyId]);
  useEffect(() => {
    setActiveBranchId(activeBranch?.id ?? null);
  }, [activeBranch?.id, setActiveBranchId]);

  const handleSelectCompany = (company: Company) => {
    const previousId = activeCompany?.id ?? null;
    setActiveCompany(company);
    setActiveCompanyId(company?.id ?? null);
    const firstBranch = Array.isArray(company?.branches) && company.branches.length > 0 ? company.branches[0] : null;
    setActiveBranchId(firstBranch?.id ?? null);
    // Tenant boundary changed — drop ALL cached queries to prevent cross-tenant
    // data leakage from React Query keys that don't include company_id.
    if (previousId !== (company?.id ?? null)) {
      queryClient.clear();
    }
  };

  const handleSelectBranch = (branch: Branch) => {
    const previousId = activeBranch?.id ?? null;
    setActiveBranch(branch);
    setActiveBranchId(branch?.id ?? null);
    if (previousId !== (branch?.id ?? null)) {
      queryClient.clear();
    }
  };

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { data: brainPendingData } = useBrainDecisions('pending');
  const brainPending = Array.isArray(brainPendingData) ? brainPendingData : [];
  const brainCritical = brainPending.filter((d) => d.impact_level === 'critical').length;



  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const { companies } = useCompanies();

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border/40 px-3 sm:px-4 transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-xl supports-[backdrop-filter]:bg-[hsl(var(--sidebar-background)/0.72)]',
        'left-0',
        sidebarCollapsed ? 'md:left-16' : 'md:left-64'
      )}
      style={{
        boxShadow: '0 1px 0 0 hsl(var(--sidebar-border) / 0.4), 0 10px 30px -18px hsl(222 33% 4% / 0.55)'
      }}
    >
      {/* Subtle top gradient accent to align with sidebar aesthetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />


      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
              toggleSidebarMobile();
            } else {
              toggleSidebar();
            }
          }}
          aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-controls="app-sidebar"
          aria-expanded={!sidebarCollapsed}
          className="h-8 w-8 text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>



        {/* Company/Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-8 px-3 text-sidebar-foreground/80 hover:text-primary hover:bg-sidebar-accent/50 text-sm font-medium">
              <span className="max-w-[180px] truncate">
                {activeCompany?.name || 'Selecionar Empresa'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-sidebar border-sidebar-border">
            <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Empresas</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            {(Array.isArray(companies) ? companies : []).map((company: any) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                className={cn(
                  'text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                  activeCompany?.id === company.id && 'text-primary bg-sidebar-accent'
                )}
              >
                {company.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeCompany && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-8 px-3 text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50 text-sm">
                <span className="max-w-[120px] truncate">
                  {activeBranch?.name || 'Filial'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-sidebar border-sidebar-border">
              <DropdownMenuLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">Filiais</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sidebar-border" />
              {(activeCompany.branches || []).map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className={cn(
                    'text-sidebar-foreground/80 hover:text-primary focus:text-primary',
                    activeBranch?.id === branch.id && 'text-primary bg-sidebar-accent'
                  )}
                >
                  {branch.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Search shortcut */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden md:flex items-center gap-2 h-8 px-3 text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 text-xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar</span>
          <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border/50 bg-sidebar-accent/30 px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/40">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
        </Button>

        {/* Notifications - Connected to real data */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
              className="relative h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1 animate-fade-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-sidebar border-sidebar-border">
            <DropdownMenuLabel className="flex items-center justify-between text-sidebar-foreground">
              Notificações
              {unreadCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAllAsRead(undefined); }}
                  className="text-xs text-primary hover:text-primary/80 font-normal transition-colors"
                >
                  Marcar todas como lidas
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-sidebar-foreground/40">
                Nenhuma notificação
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => { if (!n.read) markAsRead(n.id); }}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 text-sidebar-foreground/80 cursor-pointer',
                    !n.read && 'bg-sidebar-accent/50'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                      <span className={cn('text-sm', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', typeColors[n.type])}>
                      {n.module}
                    </Badge>
                  </div>
                  <span className="text-xs text-sidebar-foreground/50 line-clamp-2">{n.description}</span>
                  <span className="text-[10px] text-sidebar-foreground/30">
                    {format(new Date(n.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem className="justify-center text-primary font-medium" onClick={() => navigate('/notificacoes')}>
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* IA Executiva shortcut */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/executive/executive')}
          title="IA Executiva"
          aria-label="Abrir IA Executiva"
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Brain shortcut — click abre o drawer contextual; Shift+click ou botão do meio abre a página completa */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            if (e.shiftKey) {
              navigate('/executive/brain');
            } else {
              window.dispatchEvent(new CustomEvent('brain:open'));
            }
          }}
          onAuxClick={() => navigate('/executive/brain')}
          title={brainPending.length > 0
            ? `${brainPending.length} decisões pendentes · Ctrl+J abre o Cérebro`
            : 'Cérebro Contextual (Ctrl+J) · Shift+clique abre a página completa'}
          aria-label={brainPending.length > 0 ? `Cérebro Nativo, ${brainPending.length} decisões pendentes` : 'Cérebro Nativo'}
          className="relative h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
        >
          <Brain className="h-4 w-4" aria-hidden="true" />
          {brainPending.length > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1 animate-fade-in',
                brainCritical > 0
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {brainPending.length > 9 ? '9+' : brainPending.length}
            </span>
          )}
        </Button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-sidebar-border/50" />

        {/* User Menu */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-8 px-2 hover:bg-sidebar-accent/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="hidden md:inline-block text-sm text-sidebar-foreground/80 font-medium max-w-[100px] truncate">
                {user?.name || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-sidebar border-sidebar-border">
            <DropdownMenuLabel className="text-sidebar-foreground">
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs font-normal text-sidebar-foreground/50">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem onClick={() => navigate('/perfil')} className="text-sidebar-foreground/80 hover:text-primary focus:text-primary">
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
