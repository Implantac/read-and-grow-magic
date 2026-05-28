import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBRL } from '@/lib/formatters';
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

interface EquityData {
  month: string;
  assets: number;
  liabilities: number;
  equity: number;
}

interface EquityEvolutionChartProps {
  data?: EquityData[];
}

export function EquityEvolutionChart({ data = [] }: EquityEvolutionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução Patrimonial</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Legend />
              <Line type="monotone" dataKey="assets" name="Ativo" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="liabilities" name="Passivo" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="equity" name="Patrimônio Líquido" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
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
