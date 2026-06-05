import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL, formatBRLCompact } from '@/lib/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const formatCurrency = (value: number) => formatBRLCompact(value);
const formatFull = (value: number) =>
  formatBRL(value);

// Empty data - will be populated from database
const trialBalanceByType: { type: string; debit: number; credit: number }[] = [];

export function TrialBalanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saldos por Tipo de Conta</CardTitle>
      </CardHeader>
      <CardContent>
        {trialBalanceByType.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trialBalanceByType}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatFull(v)} />
              <Legend />
              <Bar dataKey="debit" name="Débito" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="credit" name="Crédito" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
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
