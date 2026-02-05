import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { Download, TrendingUp, ShoppingBag, Users, Target } from 'lucide-react';
import { salesReportMonthly, salesByVendor, salesByCategory, topProducts } from '@/data/reportsMockData';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function SalesReport() {
  const [period, setPeriod] = useState('monthly');

  const totalVendas = salesReportMonthly.reduce((s, m) => s + m.vendas, 0);
  const totalValor = salesReportMonthly.reduce((s, m) => s + m.valor, 0);
  const avgTicket = totalValor / totalVendas;
  const metaAtingida = ((totalValor / salesReportMonthly.reduce((s, m) => s + m.meta, 0)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Vendas</h1>
          <p className="text-muted-foreground">Análise consolidada de vendas e desempenho comercial</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendas}</div>
            <p className="text-xs text-success">+12.5% vs período anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValor)}</div>
            <p className="text-xs text-success">+8.3% vs período anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgTicket)}</div>
            <p className="text-xs text-muted-foreground">Por venda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Atingida</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metaAtingida}%</div>
            <p className="text-xs text-muted-foreground">Acumulado no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Target Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento vs Meta</CardTitle>
          <CardDescription>Comparativo mensal de faturamento realizado contra meta</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={salesReportMonthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="valor" name="Realizado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Line dataKey="meta" name="Meta" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={salesByCategory} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                  label={({ categoria, percent }) => `${categoria} ${percent}%`} labelLine={false}>
                  {salesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Vendor */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByVendor} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="vendedor" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="valor" name="Realizado" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="meta" name="Meta" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Produtos Vendidos</CardTitle>
          <CardDescription>Ranking por valor de vendas no período</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p, i) => (
                <TableRow key={p.produto}>
                  <TableCell><Badge variant="outline">{i + 1}</Badge></TableCell>
                  <TableCell className="font-medium">{p.produto}</TableCell>
                  <TableCell className="text-right">{p.qtd}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.valor)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={p.margem >= 30 ? 'bg-success/10 text-success' : p.margem >= 20 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}>
                      {p.margem}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
