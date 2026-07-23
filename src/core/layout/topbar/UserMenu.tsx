import { ChevronDown, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/system/useAuth';
import { Button } from '@/ui/base/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';

export function UserMenu() {
  const navigate = useNavigate();
  const { signOut } = useAuth({ initialize: false });
  const { user } = useAppStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="group flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg hover:bg-sidebar-accent/50 transition-all">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary-glow/20 ring-1 ring-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.25)]">
            <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </div>
          <span className="hidden md:inline-block text-sm text-sidebar-foreground font-medium max-w-[120px] truncate">
            {user?.name || 'Usuário'}
          </span>
          <ChevronDown className="hidden md:inline-block h-3.5 w-3.5 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
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
  );
}
