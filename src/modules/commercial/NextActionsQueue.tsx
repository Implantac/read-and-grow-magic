import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/ui/base/skeleton';
import { formatDate } from '@/lib/formatters';
import { useFollowUps, useUpdateFollowUp } from '@/hooks/commercial/useSalesIntelligence';
import { CalendarCheck, CalendarClock, User } from 'lucide-react';

interface Props {
  clients: Array<{ id: string; name?: string | null; company_name?: string | null }>;
  sellerId?: string;
}

export function NextActionsQueue({ clients, sellerId }: Props) {
  const { data: followUps = [], isLoading } = useFollowUps('pending');
  const update = useUpdateFollowUp();
  const [busy, setBusy] = useState<string | null>(null);

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach((c) => m.set(c.id, c.company_name || c.name || '—'));
    return m;
  }, [clients]);

  const items = useMemo(() => {
    const now = Date.now();
    return followUps
      .filter((f) => sellerId && sellerId !== 'all' ? f.sales_rep_id === sellerId : true)
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .map((f) => ({
        ...f,
        overdue: new Date(f.scheduled_date).getTime() < now,
        clientName: clientMap.get(f.client_id) ?? 'Cliente',
      }));
  }, [followUps, sellerId, clientMap]);

  const complete = async (id: string) => {
    setBusy(id);
    try {
      await update.mutateAsync({ id, status: 'completed', completed_at: new Date().toISOString() });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Próximas Ações</CardTitle>
          <p className="text-xs text-muted-foreground">Fila de follow-ups pendentes por prioridade</p>
        </div>
        <Badge variant="secondary">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma ação pendente" description="Toda a fila comercial está em dia." />
        ) : (
          <div className="space-y-2">
            {items.slice(0, 15).map((f) => (
              <div key={f.id} className={`flex items-center gap-3 rounded-lg border p-3 ${f.overdue ? 'border-destructive/40 bg-destructive/5' : ''}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${f.overdue ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.subject}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {f.clientName}</span>
                    <span>{formatDate(f.scheduled_date)}</span>
                    {f.overdue && <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled={busy === f.id} onClick={() => complete(f.id)}>
                  <CalendarCheck className="mr-1 h-3 w-3" /> Concluir
                </Button>
              </div>
            ))}
            {items.length > 15 && (
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to="/comercial/automacao">Ver todos ({items.length})</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
