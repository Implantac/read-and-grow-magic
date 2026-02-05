import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Download, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { financialMonthly, expenseBreakdown, cashFlowProjection, overdueSummary } from '@/data/reportsMockData';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--destructive))'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function FinancialReport() {
  const totalReceita = financialMonthly.reduce((s, m) => s + m.receita, 0);
  const totalDespesa = financialMonthly.reduce((s, m) => s + m.despesa, 0);
  const totalLucro = financialMonthly.reduce((s, m) => s + m.lucro, 0);
  const margemLucro = ((totalLucro / totalReceita) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Financeiro</h1>
          <p className="text-muted-foreground">DRE simplificado, fluxo de caixa e inadimplência</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceita)}</div>
            <p className="text-xs text-success">+10.2% vs ano anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDespesa)}</div>
            <p className="text-xs text-warning">+6.8% vs ano anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalLucro)}</div>
            <p className="text-xs text-muted-foreground">Margem: {margemLucro}%</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrencyFull(overdueSummary.total)}</div>
            <p className="text-xs text-destructive">{overdueSummary.count} títulos vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue, Expenses, Profit */}
      <Card>
        <CardHeader>
          <CardTitle>Receita × Despesas × Lucro</CardTitle>
          <CardDescription>Evolução mensal do resultado operacional</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={financialMonthly}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(var(--chart-1))" fill="url(#colorReceita)" strokeWidth={2} />
              <Area type="monotone" dataKey="despesa" name="Despesas" stroke="hsl(var(--chart-3))" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(var(--success))" fill="url(#colorLucro)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Composição de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                  label={({ categoria, percent }) => `${categoria} ${percent}%`} labelLine={false}>
                  {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow Projection */}
        <Card>
          <CardHeader>
            <CardTitle>Projeção Fluxo de Caixa</CardTitle>
            <CardDescription>Próximos 5 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cashFlowProjection}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="receber" name="A Receber" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pagar" name="A Pagar" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Aging Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Aging de Inadimplência
          </CardTitle>
          <CardDescription>Distribuição dos títulos vencidos por faixa de atraso</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faixa de Atraso</TableHead>
                <TableHead className="text-right">Títulos</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueSummary.aging.map((row) => (
                <TableRow key={row.faixa}>
                  <TableCell className="font-medium">{row.faixa}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">{formatCurrencyFull(row.valor)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive">
                      {((row.valor / overdueSummary.total) * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{overdueSummary.count}</TableCell>
                <TableCell className="text-right">{formatCurrencyFull(overdueSummary.total)}</TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
