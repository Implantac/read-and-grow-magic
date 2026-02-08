import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { monthlyEquityEvolution } from '@/data/accountingChartData';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

export function EquityEvolutionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução Patrimonial</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyEquityEvolution}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} />
            <Legend />
            <Line type="monotone" dataKey="assets" name="Ativo" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="liabilities" name="Passivo" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="equity" name="Patrimônio Líquido" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
