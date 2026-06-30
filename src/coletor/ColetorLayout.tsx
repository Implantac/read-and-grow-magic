import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, PackagePlus, MapPin, ListChecks, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const tabs = [
  { to: '/coletor', label: 'Início', icon: Home, end: true },
  { to: '/coletor/recebimento', label: 'Receber', icon: PackagePlus, end: false },
  { to: '/coletor/putaway', label: 'Guardar', icon: MapPin, end: false },
  { to: '/coletor/picking', label: 'Separar', icon: ListChecks, end: false },
];

export default function ColetorLayout() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground overflow-hidden">
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/70 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-bold">U</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Coletor WMS</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">USE Sistemas</p>
          </div>
        </div>
        <button onClick={signOut} aria-label="Sair" className="p-2 rounded-md hover:bg-muted text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain pb-2">
        <Outlet />
      </main>

      <nav aria-label="Navegação do coletor" className="grid grid-cols-4 border-t bg-card/90 backdrop-blur shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
