import { useMemo, useState } from 'react';
import { AlertTriangle, FileWarning, Package, Receipt, Clock, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/base/tabs';
import { formatBRL, formatDate } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { useO2CExceptions, exceptionLabel, type O2CExceptionType, type O2CException } from '@/hooks/commercial/useO2CExceptions';

const iconFor: Record<O2CExceptionType, JSX.Element> = {
  confirmed_without_picking: <Package className="h-4 w-4" />,
  invoiced_without_nfe: <FileWarning className="h-4 w-4" />,
  delivered_without_ar: <Receipt className="h-4 w-4" />,
  stuck_pending: <Clock className="h-4 w-4" />,
  stuck_separated: <Clock className="h-4 w-4" />,
};

const severityFor = (days: number): { label: string; className: string } => {
  if (days >= 7) return { label: 'Crítico', className: 'bg-destructive/10 text-destructive border-destructive/30' };
  if (days >= 3) return { label: 'Alto', className: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
  return { label: 'Médio', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' };
};

export default function O2CExceptions() {
  const { data: exceptions = [], isLoading } = useO2CExceptions();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | O2CExceptionType>('all');

  const counts = useMemo(() => {
    return exceptions.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, {});
  }, [exceptions]);

  const totalStuckValue = exceptions.reduce((s, e) => s + e.total, 0);
  const critical = exceptions.filter((e) => e.days_stuck >= 7).length;

  const filtered: O2CException[] = tab === 'all' ? exceptions : exceptions.filter((e) => e.type === tab);

  if (isLoading) return <PageLoading message="Auditando fluxo Order-to-Cash..." />;

  return (
    <PageContainer>
      <PageHeader
        title="Exceções Order-to-Cash"
        description="Rupturas do fluxo automatizado Pedido → Picking → NF-e → AR"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Exceções abertas" value={exceptions.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Críticas (7d+)" value={critical} icon={<AlertTriangle className="h-5 w-5" />} accentColor="destructive" index={1} />
        <KPICard title="Valor travado" value={formatBRL(totalStuckValue)} icon={<Receipt className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="Sem NF-e" value={counts.invoiced_without_nfe || 0} icon={<FileWarning className="h-5 w-5" />} accentColor="accent" index={3} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Todas ({counts.all || 0})</TabsTrigger>
          <TabsTrigger value="confirmed_without_picking">Sem Picking ({counts.confirmed_without_picking || 0})</TabsTrigger>
          <TabsTrigger value="invoiced_without_nfe">Sem NF-e ({counts.invoiced_without_nfe || 0})</TabsTrigger>
          <TabsTrigger value="delivered_without_ar">Sem AR ({counts.delivered_without_ar || 0})</TabsTrigger>
          <TabsTrigger value="stuck_pending">Pendentes travados ({counts.stuck_pending || 0})</TabsTrigger>
          <TabsTrigger value="stuck_separated">Separados travados ({counts.stuck_separated || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Nenhuma exceção nesta categoria"
              description="O fluxo Order-to-Cash está saudável para este filtro."
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => {
                const sev = severityFor(e.days_stuck);
                return (
                  <Card key={`${e.type}-${e.order_id}`} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg border p-2 ${sev.className}`}>{iconFor[e.type]}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{e.order_number}</p>
                          <Badge variant="outline" className={sev.className}>{sev.label}</Badge>
                          <Badge variant="secondary" className="text-xs">{exceptionLabel(e.type)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{e.client_name} · {formatDate(e.date)} · {e.days_stuck}d parado</p>
                        <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:justify-end">
                      <span className="text-sm font-semibold">{formatBRL(e.total)}</span>
                      <Button size="sm" variant="secondary" className="gap-1" onClick={() => navigate('/comercial/orders')}>
                        Abrir pedido <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
