import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
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
import { useEstoqueMatrix } from '@/hooks/inventory/useEstoqueMatrix';
import { toCSV, downloadCSV } from '@/shared/utils/csv';

export default function StockReportCanal() {
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useEstoqueMatrix(search);

  const kpis = useMemo(() => {
    let varejo = 0,
      atacado = 0;
    for (const r of data) {
      if (r.canal_operacional === 'VAREJO_PDV') varejo += r.quantity;
      else atacado += r.quantity;
    }
    return { varejo, atacado, total: varejo + atacado };
  }, [data]);

  const exportCSV = () => {
    const rows = data.map((r) => ({
      codigo: r.product_code ?? '',
      produto: r.product_name ?? '',
      loja: r.branch_name ?? '',
      tipo_loja: r.branch_tipo ?? '',
      canal:
        r.canal_operacional === 'VAREJO_PDV' ? 'Varejo (PDV)' : 'Atacado / Indústria',
      quantidade: r.quantity,
    }));
    const csv = toCSV(rows, [
      { key: 'codigo', label: 'Código' },
      { key: 'produto', label: 'Produto' },
      { key: 'loja', label: 'Loja' },
      { key: 'tipo_loja', label: 'Tipo' },
      { key: 'canal', label: 'Canal' },
      { key: 'quantidade', label: 'Quantidade' },
    ]);
    downloadCSV(`estoque-por-canal-${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Relatório de Estoque por Canal"
        description="Saldos consolidados por produto, loja e canal (Varejo × Indústria)."
        actions={
          <div className="flex items-center gap-2">
            <CanalFilter />
            <Button onClick={exportCSV} disabled={!data.length}>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Varejo (PDV)</div>
          <div className="text-2xl font-bold">{kpis.varejo.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Atacado / Indústria</div>
          <div className="text-2xl font-bold">{kpis.atacado.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Consolidado</div>
          <div className="text-2xl font-bold">{kpis.total.toLocaleString('pt-BR')}</div>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="Sem saldos" description="Ajuste o filtro de canal ou busca." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 1000).map((r, i) => (
                <TableRow key={`${r.product_id}-${r.branch_id}-${r.canal_operacional}-${i}`}>
                  <TableCell className="font-mono">{r.product_code ?? '—'}</TableCell>
                  <TableCell>{r.product_name ?? '—'}</TableCell>
                  <TableCell>{r.branch_name}</TableCell>
                  <TableCell>
                    {r.canal_operacional === 'VAREJO_PDV' ? (
                      <Badge variant="secondary">Varejo</Badge>
                    ) : (
                      <Badge>Atacado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {r.quantity.toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
}
