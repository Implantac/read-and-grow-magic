import { useState, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Company, Alert } from '@/types';

import { useCompanies } from '@/hooks/useCompanies';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Topbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { 
    user, 
    activeCompany, 
    activeBranch, 
    sidebarCollapsed,
    theme,
    toggleSidebar, 
    setActiveCompany, 
    setActiveBranch,
    toggleTheme,
  } = useAppStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const unreadAlerts = mockAlerts.filter((a) => !a.read).length;

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
      style={{ background: '#1a2234', borderColor: 'rgba(255, 152, 0, 0.15)' }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-white/70 hover:text-[#ff9800] hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Company/Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10 hover:text-[#ff9800]" style={{ background: 'rgba(42, 50, 69, 0.8)' }}>
              <span className="max-w-[200px] truncate">
                {activeCompany?.name || 'Selecionar Empresa'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64" style={{ background: '#2a3245', borderColor: 'rgba(255, 152, 0, 0.2)' }}>
            <DropdownMenuLabel>Empresas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockCompanies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => setActiveCompany(company)}
                className={cn(
                  activeCompany?.id === company.id && 'bg-accent'
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
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10">
                <span className="max-w-[150px] truncate text-white/60">
                  {activeBranch?.name || 'Filial'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56" style={{ background: '#2a3245', borderColor: 'rgba(255, 152, 0, 0.2)' }}>
              <DropdownMenuLabel>Filiais</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeCompany.branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => setActiveBranch(branch)}
                  className={cn(
                    activeBranch?.id === branch.id && 'bg-accent'
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
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-white/70 hover:text-[#ff9800] hover:bg-white/10"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white/70 hover:text-[#ff9800] hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
              {unreadAlerts > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadAlerts}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80" style={{ background: '#2a3245', borderColor: 'rgba(255, 152, 0, 0.2)' }}>
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações
              <Badge variant="secondary">{unreadAlerts} novas</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockAlerts.slice(0, 5).map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={cn(
                  'flex flex-col items-start gap-1 p-3',
                  !alert.read && 'bg-accent/50'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{alert.title}</span>
                  <Badge
                    variant={
                      alert.type === 'error'
                        ? 'destructive'
                        : alert.type === 'warning'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {alert.module}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {alert.description}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary" onClick={() => navigate('/notificacoes')}>
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: '#ff9800' }}>
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden md:inline-block text-white">{user?.name || 'Usuário'}</span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" style={{ background: '#2a3245', borderColor: 'rgba(255, 152, 0, 0.2)' }}>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/perfil')}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
