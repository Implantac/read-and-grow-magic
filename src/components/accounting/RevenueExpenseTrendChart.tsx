import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL, formatBRLCompact } from '@/lib/formatters';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from 'recharts';

const formatCurrency = (value: number) => formatBRLCompact(value);
const formatFull = (value: number) =>
  formatBRL(value);

interface TrendData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface RevenueExpenseTrendChartProps {
  data?: TrendData[];
}

export function RevenueExpenseTrendChart({ data = [] }: RevenueExpenseTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
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
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
