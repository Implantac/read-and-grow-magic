import { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Megaphone, ListChecks, Send, MessageSquare, FileText, Palette, Zap, Settings2, AlertTriangle, ScrollText } from 'lucide-react';

const items = [
  { to: '/relacionamento/nps/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/relacionamento/nps/campanhas', label: 'Campanhas', icon: Megaphone },
  { to: '/relacionamento/nps/pesquisas', label: 'Pesquisas', icon: ListChecks },
  { to: '/relacionamento/nps/convites', label: 'Convites', icon: Send },
  { to: '/relacionamento/nps/respostas', label: 'Respostas', icon: MessageSquare },
  { to: '/relacionamento/nps/followups', label: 'Follow-ups', icon: AlertTriangle },
  { to: '/relacionamento/nps/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/relacionamento/nps/templates', label: 'Templates', icon: Palette },
  { to: '/relacionamento/nps/automacoes', label: 'Automações', icon: Zap },
  { to: '/relacionamento/nps/logs', label: 'Logs', icon: ScrollText },
  { to: '/relacionamento/nps/configuracoes', label: 'Configurações', icon: Settings2 },
];

export function NPSLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">💬 NPS — Net Promoter Score</h1>
        <p className="text-sm text-muted-foreground">Gestão de experiência do cliente e voz da marca</p>
      </header>
      <nav className="flex flex-wrap gap-2 border-b border-border pb-2 overflow-x-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground',
            )}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div>{children ?? <Outlet />}</div>
    </div>
  );
}
