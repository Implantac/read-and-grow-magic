import { useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { useBranches } from '@/hooks/useBranches';
import { formatBRL, formatDate } from '@/lib/formatters';
import { Store, Factory, TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import type { CanalOperacional } from '@/stores/useCanalStore';

interface LedgerRow {
  id: string;
  entry_date: string;
  type: 'inflow' | 'outflow';
  amount: number;
  description: string;
  source: string;
  branch_id: string | null;
  canal_operacional: CanalOperacional | null;
}

function useSegmentedLedger(days = 30) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['financial_ledger_segmented', companyId, days],
    enabled: !!companyId,
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - days);
      const { data, error } = await supabase
        .from('financial_ledger')
        .select('id, entry_date, type, amount, description, source, branch_id, canal_operacional')
        .gte('entry_date', from.toISOString().slice(0, 10))
        .order('entry_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as LedgerRow[];
    },
  });
}

export default function FinancialSegmentado() {
  const { data: rows = [], isLoading } = useSegmentedLedger(30);
  const { data: branches = [] } = useBranches();

  const varejo = useMemo(() => rows.filter((r) => r.canal_operacional === 'VAREJO_PDV'), [rows]);
  const atacado = useMemo(() => rows.filter((r) => r.canal_operacional === 'ATACADO_INDUSTRIA'), [rows]);
  const semCanal = useMemo(() => rows.filter((r) => !r.canal_operacional), [rows]);

  const kpi = (list: LedgerRow[]) => {
    const inflow = list.filter((r) => r.type === 'inflow').reduce((s, r) => s + Number(r.amount), 0);
    const outflow = list.filter((r) => r.type === 'outflow').reduce((s, r) => s + Number(r.amount), 0);
    return { inflow, outflow, net: inflow - outflow, count: list.length };
  };

  const kVarejo = kpi(varejo);
  const kAtacado = kpi(atacado);

  const branchName = (id: string | null) => (id ? branches.find((b) => b.id === id)?.name ?? '—' : '—');

  return (
    <PageContainer>
      <PageHeader
        title="Financeiro Segmentado — Varejo × Indústria"
        description="Comparativo de caixa e faturamento entre canais operacionais (últimos 30 dias)."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Caixa PDV (Varejo)"
          value={formatBRL(kVarejo.net)}
          subtitle={`${kVarejo.count} lançamentos`}
          icon={<Store className="h-5 w-5" />}
          accentColor="success"
          index={0}
        />
        <KPICard
          title="Faturamento Atacado"
          value={formatBRL(kAtacado.net)}
          subtitle={`${kAtacado.count} lançamentos`}
          icon={<Factory className="h-5 w-5" />}
          accentColor="primary"
          index={1}
        />
        <KPICard
          title="Entradas totais"
          value={formatBRL(kVarejo.inflow + kAtacado.inflow)}
          subtitle="Consolidado"
          icon={<TrendingUp className="h-5 w-5" />}
          accentColor="success"
          index={2}
        />
        <KPICard
          title="Saídas totais"
          value={formatBRL(kVarejo.outflow + kAtacado.outflow)}
          subtitle="Consolidado"
          icon={<TrendingDown className="h-5 w-5" />}
          accentColor="warning"
          index={3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Movimentações por canal (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="varejo">
            <TabsList>
              <TabsTrigger value="varejo" className="gap-2">
                <Store className="h-4 w-4" /> Caixa PDV
                <Badge variant="outline" className="ml-1 text-[10px]">{kVarejo.count}</Badge>
              </TabsTrigger>
              <TabsTrigger value="atacado" className="gap-2">
                <Factory className="h-4 w-4" /> Faturamento Atacado
                <Badge variant="outline" className="ml-1 text-[10px]">{kAtacado.count}</Badge>
              </TabsTrigger>
              <TabsTrigger value="outros" className="gap-2">
                <Receipt className="h-4 w-4" /> Sem canal
                <Badge variant="outline" className="ml-1 text-[10px]">{semCanal.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="varejo" className="mt-4">
              <LedgerTable rows={varejo} branchName={branchName} loading={isLoading} />
            </TabsContent>
            <TabsContent value="atacado" className="mt-4">
              <LedgerTable rows={atacado} branchName={branchName} loading={isLoading} />
            </TabsContent>
            <TabsContent value="outros" className="mt-4">
              <LedgerTable rows={semCanal} branchName={branchName} loading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function LedgerTable({
  rows,
  branchName,
  loading,
}: {
  rows: LedgerRow[];
  branchName: (id: string | null) => string;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>;
  if (!rows.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sem lançamentos neste canal"
        description="Assim que houver movimentações classificadas neste canal, elas aparecerão aqui."
      />
    );
  }
  return (
    <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Filial</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 200).map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{formatDate(r.entry_date)}</TableCell>
              <TableCell className="text-sm">{r.description}</TableCell>
              <TableCell className="text-xs">{branchName(r.branch_id)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  r.type === 'inflow' ? 'text-success' : 'text-destructive'
                }`}
              >
                {r.type === 'inflow' ? '+' : '-'} {formatBRL(Number(r.amount))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
