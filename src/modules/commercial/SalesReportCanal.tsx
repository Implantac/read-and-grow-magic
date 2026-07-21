import { useMemo, useState } from 'react';
import { Download, Store, Factory } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { CanalFilter } from '@/components/shared/CanalFilter';
import { Card } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useBranches } from '@/hooks/useBranches';
import { toCSV, downloadCSV } from '@/shared/utils/csv';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function SalesReportCanal() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: branches = [] } = useBranches();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const branchName = useMemo(() => {
    const m = new Map<string, string>();
    branches.forEach((b: any) => m.set(b.id, b.name));
    return m;
  }, [branches]);

  const filtered = useMemo(() => {
    return orders.filter((o: any) => {
      const d = o.created_at?.slice(0, 10) ?? '';
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [orders, from, to]);

  const kpis = useMemo(() => {
    let varejoTot = 0,
      varejoQtd = 0,
      atacadoTot = 0,
      atacadoQtd = 0;
    for (const o of filtered as any[]) {
      const t = Number(o.total ?? 0);
      if (o.canal_operacional === 'VAREJO_PDV') {
        varejoTot += t;
        varejoQtd += 1;
      } else if (o.canal_operacional === 'ATACADO_INDUSTRIA') {
        atacadoTot += t;
        atacadoQtd += 1;
      }
    }
    return { varejoTot, varejoQtd, atacadoTot, atacadoQtd };
  }, [filtered]);

  const exportCSV = () => {
    const rows = (filtered as any[]).map((o) => ({
      numero: o.number,
      data: o.created_at?.slice(0, 10),
      canal:
        o.canal_operacional === 'VAREJO_PDV'
          ? 'Varejo (PDV)'
          : o.canal_operacional === 'ATACADO_INDUSTRIA'
          ? 'Atacado / Indústria'
          : '—',
      loja: branchName.get(o.branch_id) ?? '—',
      cliente: o.client_name ?? '—',
      status: o.status,
      total: Number(o.total ?? 0).toFixed(2),
    }));
    const csv = toCSV(rows, [
      { key: 'numero', label: 'Pedido' },
      { key: 'data', label: 'Data' },
      { key: 'canal', label: 'Canal' },
      { key: 'loja', label: 'Loja' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'status', label: 'Status' },
      { key: 'total', label: 'Total (R$)' },
    ]);
    downloadCSV(`vendas-por-canal-${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Relatório de Vendas por Canal"
        description="Compare faturamento Varejo (PDV) vs Atacado / Indústria e exporte para CSV."
        actions={
          <div className="flex items-center gap-2">
            <CanalFilter />
            <Button onClick={exportCSV} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Varejo (PDV)</span>
          </div>
          <div className="text-2xl font-bold">{fmtBRL(kpis.varejoTot)}</div>
          <div className="text-xs text-muted-foreground">{kpis.varejoQtd} pedidos</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Atacado / Indústria</span>
          </div>
          <div className="text-2xl font-bold">{fmtBRL(kpis.atacadoTot)}</div>
          <div className="text-xs text-muted-foreground">{kpis.atacadoQtd} pedidos</div>
        </Card>
      </div>

      <Card className="p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Até</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : filtered.length === 0 ? (
          <EmptyState title="Sem vendas no período" description="Ajuste os filtros ou o canal selecionado." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filtered as any[]).slice(0, 500).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">{o.number}</TableCell>
                  <TableCell>{o.created_at?.slice(0, 10)}</TableCell>
                  <TableCell>
                    {o.canal_operacional === 'VAREJO_PDV' ? (
                      <Badge variant="secondary">Varejo</Badge>
                    ) : o.canal_operacional === 'ATACADO_INDUSTRIA' ? (
                      <Badge>Atacado</Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </TableCell>
                  <TableCell>{branchName.get(o.branch_id) ?? '—'}</TableCell>
                  <TableCell>{o.client_name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{fmtBRL(Number(o.total ?? 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
}
