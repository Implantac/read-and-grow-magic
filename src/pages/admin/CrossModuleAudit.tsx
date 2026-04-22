import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Search, Radio } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useCrossModuleEvents } from '@/hooks/useCrossModuleEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventTypeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  nfe_created: { label: 'NF-e criada', variant: 'outline' },
  nfe_transmitted: { label: 'NF-e transmitida', variant: 'secondary' },
  nfe_authorized: { label: 'NF-e autorizada', variant: 'default' },
  nfe_cancelled: { label: 'NF-e cancelada', variant: 'destructive' },
  nfe_rejected: { label: 'NF-e rejeitada', variant: 'destructive' },
  order_confirmed: { label: 'Pedido confirmado', variant: 'default' },
  order_cancelled: { label: 'Pedido cancelado', variant: 'destructive' },
  order_invoiced: { label: 'Pedido faturado', variant: 'default' },
  ar_settled: { label: 'Recebimento', variant: 'default' },
  ap_settled: { label: 'Pagamento', variant: 'default' },
};

const moduleColors: Record<string, string> = {
  fiscal: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  financial: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  accounting: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  commercial: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  operational: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  inventory: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export default function CrossModuleAudit() {
  const { data: events = [], isLoading } = useCrossModuleEvents(300);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filterModule !== 'all' && e.source_module !== filterModule) return false;
      if (filterType !== 'all' && e.event_type !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          e.source_reference?.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s) ||
          e.event_type.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [events, search, filterModule, filterType]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayEvents = events.filter(e => new Date(e.created_at).toDateString() === today);
    return {
      total: events.length,
      today: todayEvents.length,
      success: events.filter(e => e.status === 'success').length,
      failed: events.filter(e => e.status === 'failed').length,
    };
  }, [events]);

  const eventTypes = useMemo(() => Array.from(new Set(events.map(e => e.event_type))), [events]);

  return (
    <PageContainer>
      <PageHeader
        title="Auditoria Cross-Módulos"
        description="Eventos em tempo real que conectam Fiscal ↔ Financeiro ↔ Contábil ↔ Comercial"
      >
        <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-400">
          <Radio className="h-3 w-3 animate-pulse" />
          Tempo real
        </Badge>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de eventos" value={stats.total} subtitle="Últimos 300" icon={<Activity className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Hoje" value={stats.today} subtitle="Eventos do dia" icon={<Activity className="h-5 w-5" />} accentColor="primary" index={1} />
        <KPICard title="Sucesso" value={stats.success} subtitle="Propagados corretamente" icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Falhas" value={stats.failed} subtitle="Requerem investigação" icon={<XCircle className="h-5 w-5" />} accentColor="danger" index={3} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Trilha de eventos</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="h-9 w-[200px] pl-8" />
            </div>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos módulos</SelectItem>
                <SelectItem value="fiscal">Fiscal</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="accounting">Contábil</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos eventos</SelectItem>
                {eventTypes.map(t => (
                  <SelectItem key={t} value={t}>{eventTypeLabels[t]?.label || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Quando</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Módulos afetados</TableHead>
                  <TableHead>Tabelas atualizadas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Carregando eventos...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum evento encontrado. Eventos aparecem automaticamente ao transmitir/autorizar/cancelar NF-e, confirmar pedidos ou quitar contas.
                  </TableCell></TableRow>
                ) : filtered.map(event => {
                  const meta = eventTypeLabels[event.event_type] || { label: event.event_type, variant: 'outline' as const };
                  return (
                    <TableRow key={event.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {format(new Date(event.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={meta.variant} className="w-fit">{meta.label}</Badge>
                          {event.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">{event.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] uppercase ${moduleColors[event.source_module] || ''}`}>
                          {event.source_module}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{event.source_reference || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {event.affected_modules.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            event.affected_modules.map((m, i) => (
                              <div key={`${m}-${i}`} className="flex items-center gap-1">
                                {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                                <Badge variant="outline" className={`text-[10px] uppercase ${moduleColors[m] || ''}`}>{m}</Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {event.affected_tables.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            event.affected_tables.map((t, i) => {
                              const rec = event.affected_records?.find((r: any) => r.table === t);
                              return (
                                <Badge key={`${t}-${i}`} variant="secondary" className="font-mono text-[10px]">
                                  {t}{rec?.count ? ` (${rec.count})` : ''}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.status === 'success' ? (
                          <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />OK
                          </Badge>
                        ) : event.status === 'partial' ? (
                          <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />Parcial
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />Falha
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
