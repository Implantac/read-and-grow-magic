import { Settings, HelpCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/base/tooltip';

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
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/30 p-2 ring-1 ring-sidebar-border/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold shadow-sm">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-sidebar-foreground truncate">{user?.name || 'Usuário'}</span>
              <span className="text-[10px] text-sidebar-foreground/40 truncate">{user?.email || 'admin@usesistemas.com.br'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Suporte</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onSignOut}
                  className="p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sair do Sistema</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold cursor-pointer hover:bg-primary/20 transition-all ring-1 ring-primary/20">
                {user?.name?.[0] || 'U'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{user?.name}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSignOut}
                className="p-2 text-sidebar-foreground/40 hover:text-primary hover:bg-sidebar-accent/50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
