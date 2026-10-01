import { Settings, HelpCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/base/tooltip';
import { Button } from '@/ui/base/button';

type User = { name?: string; email?: string } | null | undefined;

export function SidebarFooter({
  collapsed,
  user,
  onSignOut,
}: {
  collapsed: boolean;
  user: User;
  onSignOut: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-sidebar-border/40 p-3 bg-sidebar-accent/10">
      {!collapsed ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/50 p-2 ring-1 ring-sidebar-border">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary font-bold ring-1 ring-sidebar-border">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-sidebar-foreground truncate">{user?.name || 'Usuário'}</span>
              <span className="text-[10px] text-sidebar-foreground/65 truncate">{user?.email || 'Usuário'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Configurações" className="h-9 w-9 text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Suporte" className="h-9 w-9 text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Suporte</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Sair do sistema"
                  onClick={onSignOut}
                  className="h-9 w-9 text-sidebar-foreground/75 hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sair do Sistema</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary font-bold ring-1 ring-sidebar-border">
                {user?.name?.[0] || 'U'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{user?.name}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Sair do sistema"
                onClick={onSignOut}
                className="h-9 w-9 text-sidebar-foreground/75 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
