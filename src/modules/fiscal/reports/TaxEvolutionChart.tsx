import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from './helpers';

interface Props {
  data: Array<{ name: string; icms: number; ipi: number; pis: number; cofins: number }>;
}

export function TaxEvolutionChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Evolução de Impostos
        </CardTitle>
        <CardDescription>Impostos por mês (últimos 6 meses)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="icms" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="ICMS" />
              <Area type="monotone" dataKey="cofins" stackId="1" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.6} name="COFINS" />
              <Area type="monotone" dataKey="ipi" stackId="1" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.6} name="IPI" />
              <Area type="monotone" dataKey="pis" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} name="PIS" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
