import { useState, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun, User, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Company, Alert } from '@/types';

import { useCompanies } from '@/hooks/useCompanies';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Topbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { 
    user, activeCompany, activeBranch, sidebarCollapsed, theme,
    toggleSidebar, setActiveCompany, setActiveBranch, toggleTheme,
  } = useAppStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const { companies } = useCompanies();
  const [alerts] = useState<Alert[]>([]);
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border/30 px-4 transition-all duration-300 backdrop-blur-xl',
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
            {companies.map((company: any) => (
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
              {activeCompany.branches.map((branch) => (
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
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent/50"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadAlerts}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-sidebar border-sidebar-border">
            <DropdownMenuLabel className="flex items-center justify-between text-sidebar-foreground">
              Notificações
              <Badge variant="secondary" className="text-xs">{unreadAlerts} novas</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            {alerts.length === 0 && (
              <div className="py-6 text-center text-sm text-sidebar-foreground/40">
                Nenhuma notificação
              </div>
            )}
            {alerts.slice(0, 5).map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 text-sidebar-foreground/80',
                  !alert.read && 'bg-sidebar-accent/50'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{alert.title}</span>
                  <Badge variant="outline" className="text-xs">{alert.module}</Badge>
                </div>
                <span className="text-xs text-sidebar-foreground/50">{alert.description}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem className="justify-center text-primary font-medium" onClick={() => navigate('/notificacoes')}>
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-sidebar-border/50" />

        {/* User Menu */}
        <DropdownMenu>
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
