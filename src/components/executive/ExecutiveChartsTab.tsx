import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, Users, PieChart, MapPin, Zap, Target, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart as RPieChart, Pie, LineChart, Line, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { fmt } from './ExecutiveKPICards';
import type { ExecutiveDashboardData } from '@/hooks/useExecutiveAI';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

interface Props {
  data: ExecutiveDashboardData | undefined;
}

export function ExecutiveChartsTab({ data }: Props) {
  const revenueByMonth = data?.revenueByMonth || [];
  const topClients = data?.topClients || [];
  const growthTrends = (data as any)?.growthTrends || [];
  const expenseByCategory = data?.expenseByCategory || {};
  const salesRepStats = data?.salesRepStats || [];
  const funnelByStage = data?.funnelByStage || {};
  const revenueByRegion = (data as any)?.revenueByRegion || {};
  const kpis = data?.kpis;

  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number)).slice(0, 6);
  const funnelData = Object.entries(funnelByStage).map(([stage, v]: any) => ({ stage, ...v }));
  const regionData = Object.entries(revenueByRegion).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" />Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: 'Receita', color: 'hsl(var(--chart-1))' } }} className="h-[250px]">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" />Tendência de Crescimento (MoM %)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenueMoM: { label: 'MoM %', color: 'hsl(var(--chart-2))' } }} className="h-[250px]">
              <LineChart data={growthTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${v}%`} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
                <Line type="monotone" dataKey="revenueMoM" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" />Evolução da Margem (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ margin: { label: 'Margem %', color: 'hsl(var(--chart-4))' } }} className="h-[250px]">
              <LineChart data={growthTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${v}%`} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
                <Line type="stepAfter" dataKey="margin" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />Top Clientes
              {kpis?.concentrationPct && kpis.concentrationPct > 50 && (
                <Badge variant="destructive" className="text-[10px]">⚠️ Concentração {kpis.concentrationPct}%</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="h-1.5 rounded-full bg-muted mt-1">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(c.revenue / (topClients[0]?.revenue || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{fmt(c.revenue)}</span>
                </div>
              ))}
              {topClients.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Sem dados de clientes</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-orange-500" />Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? (
              <ChartContainer config={{}} className="h-[250px]">
                <RPieChart>
                  <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                </RPieChart>
              </ChartContainer>
            ) : <p className="text-xs text-center text-muted-foreground py-8">Sem dados de despesas</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Receita por Região</CardTitle>
          </CardHeader>
          <CardContent>
            {regionData.length > 0 ? (
              <div className="space-y-3">
                {regionData.slice(0, 6).map((r, i) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <div className="h-1.5 rounded-full bg-muted mt-1">
                        <div className="h-full rounded-full bg-chart-3" style={{ width: `${((r.value as number) / ((regionData[0]?.value as number) || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{fmt(r.value as number)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-center text-muted-foreground py-8">Sem dados de região</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Performance Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            {salesRepStats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados de vendedores</p>
            ) : (
              <div className="space-y-3">
                {salesRepStats.slice(0, 5).map((rep: any, i: number) => (
                  <div key={rep.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rep.name}</p>
                      <p className="text-xs text-muted-foreground">{rep.orders} ped · TM {fmt(rep.avgTicket || 0)} · Desc {rep.discountPct || 0}%</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{fmt(rep.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {funnelData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Funil de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                {funnelData.map((f: any) => (
                  <div key={f.stage} className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground capitalize">{f.stage}</p>
                    <p className="text-lg font-bold">{f.count}</p>
                    <p className="text-xs text-muted-foreground">{fmt(f.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
