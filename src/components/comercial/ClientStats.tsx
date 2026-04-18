import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DbClient } from '@/hooks/useClients';

interface Props {
  clients: DbClient[];
}

export function ClientStats({ clients }: Props) {
  const total = clients.length;
  const active = clients.filter(c => c.status === 'active').length;
  const blocked = clients.filter(c => c.status === 'blocked').length;
  const totalCredit = clients.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const aClients = clients.filter(c => c.abc_classification === 'A').length;

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

  const cards = [
    { label: 'Total de Clientes', value: total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Ativos', value: active, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: `${total ? Math.round((active/total)*100) : 0}% da base` },
    { label: 'Bloqueados', value: blocked, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Curva A', value: aClients, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: `Crédito: ${fmt(totalCredit)}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold tracking-tight">{c.value}</p>
                {c.sub && <p className="truncate text-[10px] text-muted-foreground">{c.sub}</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
