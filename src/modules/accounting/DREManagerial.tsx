import { useMemo, useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/ui/base/dialog';
import { formatBRL } from '@/lib/formatters';
import { ChevronRight, TrendingUp, FileBarChart } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import {
  useDREManagerial,
  useDREManagerialEntries,
  type DREManagerialRow,
} from '@/hooks/accounting/useDREManagerial';

const SECTION_LABELS: Record<string, string> = {
  receita_bruta: 'Receita Bruta',
  deducoes: '(-) Deduções',
  receita_liquida: 'Receita Líquida',
  cmv: '(-) CMV',
  lucro_bruto: 'Lucro Bruto',
  despesas_operacionais: '(-) Despesas Operacionais',
  despesas_administrativas: '(-) Despesas Administrativas',
  despesas_financeiras: '(-) Despesas Financeiras',
  receitas_financeiras: 'Receitas Financeiras',
  outros: 'Outros',
};

interface DrillContext {
  costCenterId: string | null;
  costCenterName: string;
  categoryId: string | null;
  categoryName: string;
}

export default function DREManagerialPage() {
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [drill, setDrill] = useState<DrillContext | null>(null);

  const { data: rows = [], isLoading } = useDREManagerial(from, to);
  const { data: entries = [], isLoading: loadingEntries } =
    useDREManagerialEntries(from, to, drill?.costCenterId ?? null, drill?.categoryId ?? null, !!drill);

  const byCostCenter = useMemo(() => {
    const map = new Map<string, { name: string; code: string; rows: DREManagerialRow[]; total: number }>();
    for (const r of rows) {
      const key = r.cost_center_id ?? '__none__';
      const entry = map.get(key) ?? { name: r.cost_center_name, code: r.cost_center_code, rows: [], total: 0 };
      entry.rows.push(r);
      entry.total += Number(r.total_amount);
      map.set(key, entry);
    }
    return Array.from(map.entries());
  }, [rows]);

  const grandTotal = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  return (
    <PageContainer>
      <PageHeader
        title="DRE Gerencial"
        description="Resultado por centro de custo com drill-down por categoria"
        icon={TrendingUp}
      />

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="dre-from">De</Label>
            <Input id="dre-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dre-to">Até</Label>
            <Input id="dre-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground">Resultado do Período</div>
            <div className={`text-2xl font-semibold ${grandTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatBRL(grandTotal)}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <PageLoading />
      ) : byCostCenter.length === 0 ? (
        <Card><CardContent className="py-6">
          <EmptyState
            icon={FileBarChart}
            title="Nenhum lançamento no período"
            description="Ajuste o intervalo de datas para visualizar a DRE gerencial por centro de custo."
          />
        </CardContent></Card>
      ) : (
        byCostCenter.map(([key, cc]) => (
          <Card key={key}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                <span className="text-muted-foreground mr-2">{cc.code}</span>{cc.name}
              </CardTitle>
              <div className={`font-semibold ${cc.total >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatBRL(cc.total)}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seção</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Lançamentos</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cc.rows.map((r, i) => (
                    <TableRow key={`${key}-${i}`}>
                      <TableCell className="text-muted-foreground">
                        {SECTION_LABELS[r.dre_section] ?? r.dre_section}
                      </TableCell>
                      <TableCell>{r.category_name}</TableCell>
                      <TableCell className="text-right">{r.entry_count}</TableCell>
                      <TableCell className={`text-right font-medium ${Number(r.total_amount) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatBRL(Number(r.total_amount))}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ver lançamentos"
                          onClick={() =>
                            setDrill({
                              costCenterId: r.cost_center_id,
                              costCenterName: r.cost_center_name,
                              categoryId: r.category_id,
                              categoryName: r.category_name,
                            })
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Lançamentos — {drill?.costCenterName} · {drill?.categoryName}
            </DialogTitle>
          </DialogHeader>
          {loadingEntries ? (
            <div className="py-8 text-center text-muted-foreground">Carregando…</div>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={FileBarChart}
              title="Nenhum lançamento"
              description="Não há lançamentos para este centro de custo e categoria no período."
            />
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{format(new Date(e.entry_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{e.description ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{e.source ?? '—'}</TableCell>
                      <TableCell className={`text-right font-medium ${e.type === 'receita' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatBRL(Number(e.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
