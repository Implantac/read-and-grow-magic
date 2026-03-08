import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
const orderStatusData = [
  { name: 'Entregues', value: 0, color: 'hsl(var(--success))' },
  { name: 'Em Trânsito', value: 0, color: 'hsl(var(--info))' },
  { name: 'Pendentes', value: 0, color: 'hsl(var(--warning))' },
  { name: 'Cancelados', value: 0, color: 'hsl(var(--destructive))' },
];

const COLORS = [
  'hsl(var(--success))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
];

export function OrderStatusChart() {
  const total = orderStatusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Pedidos</CardTitle>
        <CardDescription>Total: {total} pedidos este mês</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {orderStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
