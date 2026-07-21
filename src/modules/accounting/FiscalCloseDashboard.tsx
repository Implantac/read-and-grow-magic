import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';

interface Snapshot {
  id: string;
  snapshot_date: string;
  branch_id: string | null;
  canal_operacional: string | null;
  stock_in_qty: number;
  stock_out_qty: number;
  stock_in_cost: number;
  stock_out_cost: number;
  financial_in: number;
  financial_out: number;
  net_flow: number;
  closed_at: string;
}

export default function FiscalCloseDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['daily_fiscal_snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_fiscal_snapshots' as never)
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Snapshot[];
    },
  });

  const rows = data ?? [];
  const latest = rows[0];

  return (
    <PageContainer>
      <PageHeader
        title="Fechamento Fiscal Diário"
        description="Snapshots consolidados por dia · lançamentos retroativos bloqueados após o fechamento"
        icon={Lock}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="Nenhum fechamento ainda"
          description="O fechamento automático roda todo dia às 23:55 UTC."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Último fechamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Date(latest.snapshot_date).toLocaleDateString('pt-BR')}
                </p>
                <Badge variant="secondary" className="mt-2">
                  <Lock className="h-3 w-3 mr-1" /> Período fechado
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Entradas financeiras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrency(latest.financial_in)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Saídas financeiras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(latest.financial_out)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimos 60 fechamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Entrada Estoque</TableHead>
                    <TableHead className="text-right">Saída Estoque</TableHead>
                    <TableHead className="text-right">Entrada Fin.</TableHead>
                    <TableHead className="text-right">Saída Fin.</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.snapshot_date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.canal_operacional ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{Number(r.stock_in_qty).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(r.stock_out_qty).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-500">
                        {formatCurrency(r.financial_in)}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {formatCurrency(r.financial_out)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(r.net_flow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
