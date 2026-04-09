import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Download, Filter, Calendar, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCashFlowEntries } from '@/hooks/useCashFlow';
// Chart data will come from real entries
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  receitas: { label: 'Receitas', color: 'hsl(var(--success))' },
  despesas: { label: 'Despesas', color: 'hsl(var(--destructive))' },
  saldo: { label: 'Saldo', color: 'hsl(var(--primary))' },
};

export default function CashFlow() {
  const { data: entries = [], isLoading } = useCashFlowEntries();
  const [periodFilter, setPeriodFilter] = useState('month');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredEntries = entries.filter(entry => {
    if (typeFilter === 'all') return true;
    return entry.type === typeFilter;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
  const currentBalance = entries.length > 0 ? Number(entries[entries.length - 1].balance) : 0;

  if (isLoading) {
    return <PageLoading message="Carregando fluxo de caixa..." />;
  }

  return (
    <PageContainer>
      <PageHeader title="Fluxo de Caixa" description="Acompanhe as movimentações financeiras">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar</Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Saldo Atual" value={formatCurrency(currentBalance)} subtitle="Conta Principal" icon={<Wallet className="h-5 w-5" />} accentColor="primary" />
        <KPICard title="Total Entradas" value={formatCurrency(totalIncome)} subtitle="No período" icon={<TrendingUp className="h-5 w-5" />} accentColor="success" />
        <KPICard title="Total Saídas" value={formatCurrency(totalExpense)} subtitle="No período" icon={<TrendingDown className="h-5 w-5" />} accentColor="danger" />
        <KPICard title="Saldo Projetado" value={formatCurrency(currentBalance)} subtitle="Próximos 30 dias" icon={<Wallet className="h-5 w-5" />} accentColor="info" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Evolução do Fluxo de Caixa</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[]}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorReceitas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Nenhum dado disponível</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison Chart */}
      <Card>
        <CardHeader><CardTitle>Comparativo Mensal</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Movimentações</CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {entry.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                      <span className="font-medium">{entry.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.reference || '-'}</TableCell>
                  <TableCell className={`text-right font-medium ${entry.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {entry.type === 'income' ? '+' : '-'} {formatCurrency(Number(entry.amount))}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(entry.balance))}</TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhuma movimentação encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
