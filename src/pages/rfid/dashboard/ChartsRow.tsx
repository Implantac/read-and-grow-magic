import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Radio } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyState } from '@/shared/components/EmptyState';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

interface Props {
  loading: boolean;
  eventsPerHour: { hour: string; count: number }[];
  readerStatusData: { name: string; value: number; fill: string }[];
}

export function ChartsRow({ loading, eventsPerHour, readerStatusData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-base">Leituras por Hora (últimas 12h)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[240px] w-full" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={eventsPerHour}>
                <defs>
                  <linearGradient id="rfidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" fontSize={11} className="fill-muted-foreground" />
                <YAxis fontSize={11} className="fill-muted-foreground" />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#rfidGradient)" strokeWidth={2} name="Leituras" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Status dos Leitores</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[240px] w-full" /> : readerStatusData.length === 0 ? (
            <EmptyState icon={Radio} title="Nenhum leitor cadastrado" description="Cadastre leitores RFID para monitorar status em tempo real." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={readerStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                  {readerStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
