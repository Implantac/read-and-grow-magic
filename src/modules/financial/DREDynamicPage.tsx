import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import { FileBarChart } from 'lucide-react';
import { useDREDynamic } from '@/hooks/accounting/useDREDynamic';
import { formatNumber } from '@/lib/formatters';

const SECTION_LABELS: Record<string, string> = {
  revenue: '💰 Receita Bruta',
  deductions: '➖ Deduções',
  cost: '🏭 Custos',
  operating_expense: '🧾 Despesas Operacionais',
  financial_income: '📈 Receitas Financeiras',
  financial_expense: '📉 Despesas Financeiras',
  taxes: '🏛️ Impostos',
};

export default function DREDynamicPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [channel, setChannel] = useState('');

  const { data = [], isLoading } = useDREDynamic({ from, to, channel: channel || null });

  const grouped = data.reduce<Record<string, { total: number; rows: typeof data }>>((acc, row) => {
    const key = row.section;
    if (!acc[key]) acc[key] = { total: 0, rows: [] };
    acc[key].total += Number(row.total || 0);
    acc[key].rows.push(row);
    return acc;
  }, {});

  const grandTotal = data.reduce((s, r) => s + Number(r.total || 0), 0);

  return (
    <PageContainer>
      <PageHeader
        title="📊 DRE Dinâmica"
        description="Demonstrativo de Resultados em tempo real, filtrado por período e canal."
      />

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label>Canal/Categoria (opcional)</Label>
            <Input placeholder="Ex: Marketplace, Loja" value={channel} onChange={(e) => setChannel(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>DRE no período</span>
            <span className={grandTotal >= 0 ? 'text-success' : 'text-destructive'}>
              Resultado: R$ {formatNumber(grandTotal, 2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : data.length === 0 ? (
            <EmptyState
              icon={FileBarChart}
              title="Sem lançamentos no período"
              description="Ajuste o intervalo de datas ou o filtro de canal para visualizar a DRE."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta / Seção</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(grouped).map(([section, info]) => (
                  <>
                    <TableRow key={section} className="bg-muted/50 font-semibold">
                      <TableCell>{SECTION_LABELS[section] || section}</TableCell>
                      <TableCell className={`text-right ${info.total >= 0 ? 'text-success' : 'text-destructive'}`}>
                        R$ {formatNumber(info.total, 2)}
                      </TableCell>
                    </TableRow>
                    {info.rows.map((r, i) => (
                      <TableRow key={section + i}>
                        <TableCell className="pl-8 text-sm text-muted-foreground">{r.category_name}</TableCell>
                        <TableCell className="text-right text-sm">
                          R$ {formatNumber(Number(r.total), 2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
