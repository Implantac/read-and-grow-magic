import { useMemo, useState } from 'react';
import { Search, Factory, Store, AlertTriangle } from 'lucide-react';
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
import { StockCellDrillDown } from './components/StockCellDrillDown';
import { cn } from '@/lib/utils';

interface PivotRow {
  product_id: string;
  product_code: string | null;
  product_name: string | null;
  cells: Record<string, number>; // key = `${branchId}::${canal}`
  totalVarejo: number;
  totalAtacado: number;
  min_stock: number;
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
        min_stock: r.min_stock ?? 0,
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

type DrillTarget = {
  productId: string;
  productName: string | null;
  branchId: string;
  branchName: string;
  canal: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA';
  balance: number;
} | null;

function cellSeverity(qty: number, min: number) {
  if (min <= 0) return 'ok';
  if (qty <= 0) return 'critical';
  if (qty < min) return 'low';
  return 'ok';
}

export default function EstoqueMatrix() {
  const [search, setSearch] = useState('');
  const [onlyBelowMin, setOnlyBelowMin] = useState(false);
  const [drill, setDrill] = useState<DrillTarget>(null);
  const { data: rows = [], isLoading } = useEstoqueMatrix(search);
  const { data: branches = [] } = useBranches();

  const pivotRows = useMemo(() => {
    const p = pivot(rows);
    if (!onlyBelowMin) return p;
    return p.filter((r) => {
      const total = r.totalVarejo + r.totalAtacado;
      return r.min_stock > 0 && total < r.min_stock;
    });
  }, [rows, onlyBelowMin]);

  const alertCount = useMemo(
    () =>
      pivot(rows).filter(
        (r) => r.min_stock > 0 && r.totalVarejo + r.totalAtacado < r.min_stock
      ).length,
    [rows]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Matriz de Estoque Global"
        description="Saldo por produto, filial e canal operacional em tempo real. Clique numa célula para ver o extrato."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CanalFilter />
        {alertCount > 0 && (
          <button
            type="button"
            onClick={() => setOnlyBelowMin((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition',
              onlyBelowMin
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-600'
                : 'border-border text-muted-foreground hover:bg-muted/40'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {alertCount} abaixo do estoque mínimo
            {onlyBelowMin ? ' · exibindo só alertas' : ''}
          </button>
        )}
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
                  <TableHead className="text-center">Mín.</TableHead>
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
                {pivotRows.map((p) => {
                  const total = p.totalVarejo + p.totalAtacado;
                  const rowAlert = p.min_stock > 0 && total < p.min_stock;
                  return (
                    <TableRow key={p.product_id} className={rowAlert ? 'bg-amber-500/[0.03]' : ''}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {rowAlert && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {p.product_name ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.product_code}</div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                        {p.min_stock > 0 ? p.min_stock.toLocaleString('pt-BR') : '—'}
                      </TableCell>
                      {branches.map((b) => {
                        const v = p.cells[`${b.id}::VAREJO_PDV`] ?? 0;
                        const a = p.cells[`${b.id}::ATACADO_INDUSTRIA`] ?? 0;
                        const cellTotal = v + a;
                        // Split min proportionally across branches for a soft signal
                        const perBranchMin =
                          p.min_stock > 0 && branches.length > 0
                            ? p.min_stock / branches.length
                            : 0;
                        const sev = cellSeverity(cellTotal, perBranchMin);
                        const canal: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA' =
                          b.canal_padrao === 'ATACADO_INDUSTRIA'
                            ? 'ATACADO_INDUSTRIA'
                            : 'VAREJO_PDV';
                        const balanceForCanal = canal === 'VAREJO_PDV' ? v : a;
                        return (
                          <TableCell
                            key={b.id}
                            className={cn(
                              'text-center tabular-nums cursor-pointer transition hover:bg-muted/40',
                              sev === 'critical' && 'bg-destructive/10 text-destructive',
                              sev === 'low' && 'bg-amber-500/10 text-amber-600'
                            )}
                            onClick={() =>
                              setDrill({
                                productId: p.product_id,
                                productName: p.product_name,
                                branchId: b.id,
                                branchName: b.name,
                                canal,
                                balance: balanceForCanal,
                              })
                            }
                            title="Ver extrato desta célula"
                          >
                            <span className={cellTotal <= 0 ? 'text-muted-foreground' : ''}>
                              {cellTotal.toLocaleString('pt-BR')}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <StockCellDrillDown
        open={!!drill}
        onOpenChange={(v) => !v && setDrill(null)}
        productId={drill?.productId ?? null}
        productName={drill?.productName ?? null}
        branchId={drill?.branchId ?? null}
        branchName={drill?.branchName ?? null}
        canal={drill?.canal ?? null}
        currentBalance={drill?.balance ?? 0}
      />
    </PageContainer>
  );
}
