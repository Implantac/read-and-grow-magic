import { useMemo, useState } from 'react';
import { Search, Factory, Store } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { CanalFilter } from '@/components/shared/CanalFilter';
import { Input } from '@/ui/base/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Card } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { useEstoqueMatrix, type EstoqueMatrixRow } from '@/hooks/inventory/useEstoqueMatrix';
import { useBranches } from '@/hooks/useBranches';

interface PivotRow {
  product_id: string;
  product_code: string | null;
  product_name: string | null;
  cells: Record<string, number>; // key = `${branchId}::${canal}`
  totalVarejo: number;
  totalAtacado: number;
}

function pivot(rows: EstoqueMatrixRow[]): PivotRow[] {
  const map = new Map<string, PivotRow>();
  for (const r of rows) {
    let p = map.get(r.product_id);
    if (!p) {
      p = {
        product_id: r.product_id,
        product_code: r.product_code,
        product_name: r.product_name,
        cells: {},
        totalVarejo: 0,
        totalAtacado: 0,
      };
      map.set(r.product_id, p);
    }
    const key = `${r.branch_id}::${r.canal_operacional}`;
    p.cells[key] = (p.cells[key] ?? 0) + r.quantity;
    if (r.canal_operacional === 'VAREJO_PDV') p.totalVarejo += r.quantity;
    else p.totalAtacado += r.quantity;
  }
  return Array.from(map.values()).sort((a, b) =>
    (a.product_name ?? '').localeCompare(b.product_name ?? '')
  );
}

export default function EstoqueMatrix() {
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = useEstoqueMatrix(search);
  const { data: branches = [] } = useBranches();

  const pivotRows = useMemo(() => pivot(rows), [rows]);

  return (
    <PageContainer>
      <PageHeader
        title="Matriz de Estoque Global"
        description="Saldo por produto, filial e canal operacional em tempo real."
      />

      <div className="mb-4">
        <CanalFilter />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : pivotRows.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Ajuste os filtros de canal/filial ou cadastre saldos."
          />
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Produto</TableHead>
                  {branches.map((b) => (
                    <TableHead key={b.id} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {b.tipo === 'industria' ? (
                          <Factory className="h-3 w-3" />
                        ) : (
                          <Store className="h-3 w-3" />
                        )}
                        <span>{b.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {b.canal_padrao === 'VAREJO_PDV' ? 'Varejo' : 'Atacado'}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-primary/5">Total Varejo</TableHead>
                  <TableHead className="text-center bg-primary/5">Total Atacado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pivotRows.map((p) => (
                  <TableRow key={p.product_id}>
                    <TableCell>
                      <div className="font-medium">{p.product_name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{p.product_code}</div>
                    </TableCell>
                    {branches.map((b) => {
                      const v = p.cells[`${b.id}::VAREJO_PDV`] ?? 0;
                      const a = p.cells[`${b.id}::ATACADO_INDUSTRIA`] ?? 0;
                      const total = v + a;
                      return (
                        <TableCell key={b.id} className="text-center tabular-nums">
                          <span className={total <= 0 ? 'text-muted-foreground' : ''}>
                            {total.toLocaleString('pt-BR')}
                          </span>
                          {v > 0 && a > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              V:{v} · A:{a}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center tabular-nums bg-primary/5">
                      <Badge variant="secondary">
                        {p.totalVarejo.toLocaleString('pt-BR')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums bg-primary/5">
                      <Badge variant="secondary">
                        {p.totalAtacado.toLocaleString('pt-BR')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
