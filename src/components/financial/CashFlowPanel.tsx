import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { useFinancialLedger } from '@/hooks/financial/useFinancialLedger';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { useAccountsPayable } from '@/hooks/financial/useAccountsPayable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react';

import { formatBRL, formatBRLCompact } from '@/lib/formatters';
const fmtCompact = (v: number) => formatBRLCompact(v);

interface Props {
  currentBalance: number;
}

export function CashFlowPanel({ currentBalance }: Props) {
  const [search, setSearch] = useState('');
  const today = new Date();
  const fromDate = format(addDays(today, -30), 'yyyy-MM-dd');
  const { data: ledger = [] } = useFinancialLedger({ from: fromDate });
  const { data: receivables = [] } = useAccountsReceivable();
  const { data: payables = [] } = useAccountsPayable();

  // Fluxo REAL (ledger últimos 30 dias)
  const realFlow = useMemo(() => {
    const days = eachDayOfInterval({ start: addDays(today, -30), end: today });
    let acc = 0;
    return days.map(d => {
      const dayKey = format(d, 'yyyy-MM-dd');
      const dayEntries = ledger.filter(l => l.entry_date === dayKey);
      const inflow = dayEntries.filter(l => l.type === 'inflow').reduce((s, l) => s + Number(l.amount), 0);
      const outflow = dayEntries.filter(l => l.type === 'outflow').reduce((s, l) => s + Number(l.amount), 0);
      acc += inflow - outflow;
      return { date: format(d, 'dd/MM', { locale: ptBR }), entradas: inflow, saidas: outflow, saldo: acc };
    });
  }, [ledger]);

  // Fluxo PROJETADO (próximos 90 dias)
  const projectedFlow = useMemo(() => {
    const days = eachDayOfInterval({ start: today, end: addDays(today, 90) });
    let acc = currentBalance;
    return days.map(d => {
      const dayKey = format(d, 'yyyy-MM-dd');
      const inflow = receivables
        .filter(r => (r as any).status !== 'paid' && (r as any).status !== 'cancelled' && (r as any).due_date === dayKey)
        .reduce((s, r) => s + Number((r as any).open_amount ?? (r as any).amount), 0);
      const outflow = payables
        .filter(p => (p as any).status !== 'paid' && (p as any).status !== 'cancelled' && (p as any).due_date === dayKey)
        .reduce((s, p) => s + Number((p as any).open_amount ?? (p as any).amount), 0);

      acc += inflow - outflow;
      return { date: format(d, 'dd/MM', { locale: ptBR }), entradas: inflow, saidas: outflow, saldo: acc };
    });
  }, [receivables, payables, currentBalance]);

  const filteredLedger = ledger.filter(l =>
    !search || l.description.toLowerCase().includes(search.toLowerCase()) || l.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const negativeProjectedDays = projectedFlow.filter(d => d.saldo < 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fluxo de Caixa — Real vs Projetado</CardTitle>
        {negativeProjectedDays > 0 && (
          <Badge variant="destructive" className="w-fit">⚠ {negativeProjectedDays} dia(s) com saldo negativo projetado</Badge>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="projected">
          <TabsList>
            <TabsTrigger value="projected">Projetado (90d)</TabsTrigger>
            <TabsTrigger value="real">Real (30d)</TabsTrigger>
            <TabsTrigger value="ledger">Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="projected" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectedFlow}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(projectedFlow.length / 10)} />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="saldo" name="Saldo projetado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="real" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realFlow}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="ledger" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar movimentação..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedger.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma movimentação no período</TableCell></TableRow>
                  ) : filteredLedger.slice(0, 100).map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{format(new Date(l.entry_date), 'dd/MM/yy')}</TableCell>
                      <TableCell className="text-sm">{l.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{l.source}</Badge></TableCell>
                      <TableCell className={`text-right font-medium ${l.type === 'inflow' ? 'text-success' : 'text-destructive'}`}>
                        <span className="flex items-center justify-end gap-1">
                          {l.type === 'inflow' ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                          {formatBRL(Number(l.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
