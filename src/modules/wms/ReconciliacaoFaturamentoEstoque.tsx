import { useMemo, useState } from 'react';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { CanalFilter } from '@/components/shared/CanalFilter';
import { Card } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
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
import { useBillingStockReconcile } from '@/hooks/inventory/useBillingStockReconcile';
import { toCSV, downloadCSV } from '@/shared/utils/csv';

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ReconciliacaoFaturamentoEstoque() {
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [onlyDivergent, setOnlyDivergent] = useState(true);
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useBillingStockReconcile({ from, to });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      if (onlyDivergent && Math.abs(r.divergencia) < 0.0001) return false;
      if (!q) return true;
      return (
        (r.product_code ?? '').toLowerCase().includes(q) ||
        (r.product_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [data, onlyDivergent, search]);

  const kpis = useMemo(() => {
    let faturado = 0,
      saida = 0,
      divergencias = 0;
    for (const r of data) {
      faturado += r.qty_faturado;
      saida += r.qty_saida_fisica;
      if (Math.abs(r.divergencia) >= 0.0001) divergencias += 1;
    }
    return {
      faturado,
      saida,
      divergencias,
      match: data.length - divergencias,
      total: data.length,
    };
  }, [data]);

  const exportCSV = () => {
    const rows = filtered.map((r) => ({
      codigo: r.product_code ?? '',
      produto: r.product_name ?? '',
      canal: r.canal_operacional ?? '',
      qty_faturado: r.qty_faturado,
      qty_saida_fisica: r.qty_saida_fisica,
      divergencia: r.divergencia,
    }));
    downloadCSV(`reconciliacao-faturamento-estoque-${from}_${to}.csv`, toCSV(rows));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Reconciliação Faturamento × Saída Física"
        description="Compara quantidades faturadas (NF-e/NFC-e autorizadas) com saídas reais registradas no ledger."
      />

      <div className="mb-4">
        <CanalFilter />
      </div>

      <Card className="p-4 mb-4 grid gap-3 md:grid-cols-4">
        <div>
          <Label>De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Label>Buscar produto</Label>
          <Input
            placeholder="Código ou nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            variant={onlyDivergent ? 'default' : 'outline'}
            onClick={() => setOnlyDivergent((v) => !v)}
            className="flex-1"
          >
            {onlyDivergent ? 'Só divergências' : 'Mostrar tudo'}
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Qtd faturada</div>
          <div className="text-2xl font-bold">{kpis.faturado.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Saída física</div>
          <div className="text-2xl font-bold">{kpis.saida.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Conciliados</div>
          <div className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {kpis.match}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Divergências</div>
          <div className="text-2xl font-bold text-amber-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {kpis.divergencias}
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Sem divergências no período"
            description="Todos os produtos faturados batem com a saída física registrada."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Faturado</TableHead>
                <TableHead className="text-right">Saída física</TableHead>
                <TableHead className="text-right">Divergência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const div = r.divergencia;
                const abs = Math.abs(div);
                const status =
                  abs < 0.0001
                    ? { label: 'OK', className: 'bg-emerald-500/15 text-emerald-500' }
                    : div > 0
                      ? { label: 'Faturado > Saída', className: 'bg-amber-500/15 text-amber-500' }
                      : { label: 'Saída > Faturado', className: 'bg-red-500/15 text-red-500' };
                return (
                  <TableRow key={`${r.product_id}-${r.branch_id}-${r.canal_operacional}`}>
                    <TableCell className="font-mono text-xs">{r.product_code}</TableCell>
                    <TableCell>{r.product_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.canal_operacional ?? '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.qty_faturado.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.qty_saida_fisica.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${status.className}`}>
                        {div > 0 ? '+' : ''}
                        {div.toLocaleString('pt-BR')} · {status.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
}
