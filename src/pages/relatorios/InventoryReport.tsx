import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Line, Area, AreaChart,
} from 'recharts';
import { Download, Package, AlertTriangle, TrendingDown, Boxes } from 'lucide-react';
import { inventoryByCategory, stockMovementHistory, lowStockItems } from '@/data/reportsMockData';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function InventoryReport() {
  const totalItens = inventoryByCategory.reduce((s, c) => s + c.itens, 0);
  const totalValor = inventoryByCategory.reduce((s, c) => s + c.valor, 0);
  const lastMonth = stockMovementHistory[stockMovementHistory.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Estoque</h1>
          <p className="text-muted-foreground">Visão geral do inventário, movimentações e alertas</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItens.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Em 5 categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValor)}</div>
            <p className="text-xs text-success">+2.1% vs mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastMonth.saldo.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Unidades em estoque</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.filter(i => i.status === 'critico').length}</div>
            <p className="text-xs text-destructive">Abaixo do mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentação de Estoque</CardTitle>
          <CardDescription>Entradas, saídas e evolução do saldo mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={stockMovementHistory}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="entradas" name="Entradas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="saidas" name="Saídas" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="saldo" name="Saldo" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventory by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Valor por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={inventoryByCategory} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                  label={({ categoria, percent }) => `${categoria} ${percent}%`} labelLine={false}>
                  {inventoryByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Itens com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.produto}>
                    <TableCell className="font-medium">{item.produto}</TableCell>
                    <TableCell className="text-right">{item.atual}</TableCell>
                    <TableCell className="text-right">{item.minimo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={item.status === 'critico' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}>
                        {item.status === 'critico' ? 'Crítico' : 'Baixo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
