import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import { revenueVsExpenseTrend } from '@/data/accountingChartData';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

const formatFull = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function RevenueExpenseTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueVsExpenseTrend}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatFull(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Receita" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Line type="monotone" dataKey="profit" name="Lucro" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
