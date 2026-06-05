import { useState } from 'react';
import { Bell, Brain, ChevronDown, LogOut, Menu, Moon, Sun, User, Search, Command, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Company } from '@/types';

import { useCompanies } from '@/hooks/system/useCompanies';
import { useAppStore } from '@/stores/useAppStore';
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
  const { signOut } = useAuth({ initialize: false });
  const { 
    user, activeCompany, activeBranch, sidebarCollapsed, theme,
    toggleSidebar, setActiveCompany, setActiveBranch, toggleTheme,
  } = useAppStore();

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
        'fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border/30 px-4 transition-all duration-300 ease-in-out backdrop-blur-xl',
        sidebarCollapsed ? 'left-16' : 'left-64'

      )}
      style={{ background: 'hsl(222 33% 15% / 0.95)' }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 transition-colors"
        >
          <Menu className="h-4 w-4" />
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
                onClick={() => setActiveCompany(company)}
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
              {(activeCompany.branches ?? []).map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => setActiveBranch(branch)}
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
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Notifications - Connected to real data */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1 animate-fade-in">
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
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        {/* Brain shortcut */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/executive/brain')}
          title={brainPending.length > 0 ? `${brainPending.length} decisões do Cérebro pendentes` : 'Cérebro Nativo'}
          className="relative h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"


        >
          <Brain className="h-4 w-4" />
          {brainPending.length > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1 animate-fade-in',
                brainCritical > 0
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {Array.isArray(brainPending) && brainPending.length > 9 ? '9+' : brainPending.length}
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
