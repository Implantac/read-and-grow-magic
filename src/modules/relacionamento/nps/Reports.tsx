import { useMemo, useState } from 'react';
import { useNPSAnswers, useNPSCampaigns } from './hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/ui/base/sheet';
import { Download, Printer, FileSpreadsheet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';

const COLORS = { promoter: '#10B981', passive: '#F59E0B', detractor: '#EF4444' };

type Period = '30d' | '90d' | '180d' | '365d' | 'all';
const PERIOD_DAYS: Record<Period, number | null> = { '30d': 30, '90d': 90, '180d': 180, '365d': 365, all: null };

function computeNps(rows: any[]) {
  const total = rows.length;
  const p = rows.filter((r) => r.category === 'promoter').length;
  const pas = rows.filter((r) => r.category === 'passive').length;
  const d = rows.filter((r) => r.category === 'detractor').length;
  const nps = total ? Math.round(((p - d) / total) * 100) : 0;
  return { total, p, pas, d, nps };
}

export default function Reports() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [groupBy, setGroupBy] = useState<'city' | 'segment' | 'category' | 'month'>('month');
  const [period, setPeriod] = useState<Period>('180d');
  const [drill, setDrill] = useState<{ key: string; rows: any[] } | null>(null);
  const { data: answers = [], isLoading } = useNPSAnswers(campaignId ?? null, 5000);

  // Split by period + comparativo período-a-período
  const { current, previous } = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (!days) return { current: answers, previous: [] as any[] };
    const now = Date.now();
    const cutCurrent = now - days * 86400_000;
    const cutPrev = now - 2 * days * 86400_000;
    const current = answers.filter((a: any) => new Date(a.responded_at).getTime() >= cutCurrent);
    const previous = answers.filter((a: any) => {
      const t = new Date(a.responded_at).getTime();
      return t >= cutPrev && t < cutCurrent;
    });
    return { current, previous };
  }, [answers, period]);

  const currentStats = useMemo(() => computeNps(current), [current]);
  const previousStats = useMemo(() => computeNps(previous), [previous]);
  const delta = currentStats.nps - previousStats.nps;

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; rows: any[]; total: number; p: number; d: number; pas: number; nps: number }>();
    current.forEach((a: any) => {
      const key = groupBy === 'city' ? (a.clients?.address_city ?? a.city ?? 'N/D')
        : groupBy === 'segment' ? (a.clients?.segment ?? 'N/D')
        : groupBy === 'category' ? a.category
        : (a.responded_at ?? '').slice(0, 7);
      const e = map.get(key) ?? { key, rows: [], total: 0, p: 0, d: 0, pas: 0, nps: 0 };
      e.rows.push(a);
      e.total++;
      if (a.category === 'promoter') e.p++;
      else if (a.category === 'detractor') e.d++;
      else e.pas++;
      map.set(key, e);
    });
    return Array.from(map.values()).map((e) => ({ ...e, nps: e.total ? Math.round(((e.p - e.d) / e.total) * 100) : 0 })).sort((a, b) => a.key.localeCompare(b.key));
  }, [current, groupBy]);

  const pieData = useMemo(() => [
    { name: 'Promotores', value: currentStats.p, color: COLORS.promoter },
    { name: 'Neutros', value: currentStats.pas, color: COLORS.passive },
    { name: 'Detratores', value: currentStats.d, color: COLORS.detractor },
  ], [currentStats]);

  const trendData = useMemo(() => {
    const map = new Map<string, { month: string; total: number; p: number; d: number; nps: number }>();
    current.forEach((a: any) => {
      const month = (a.responded_at ?? '').slice(0, 7);
      if (!month) return;
      const e = map.get(month) ?? { month, total: 0, p: 0, d: 0, nps: 0 };
      e.total++;
      if (a.category === 'promoter') e.p++;
      else if (a.category === 'detractor') e.d++;
      map.set(month, e);
    });
    return Array.from(map.values()).map((e) => ({ ...e, nps: e.total ? Math.round(((e.p - e.d) / e.total) * 100) : 0 })).sort((a, b) => a.month.localeCompare(b.month));
  }, [current]);

  const exportColumns = [
    { key: 'key', label: 'Chave' },
    { key: 'total', label: 'Total' },
    { key: 'p', label: 'Promotores' },
    { key: 'pas', label: 'Neutros' },
    { key: 'd', label: 'Detratores' },
    { key: 'nps', label: 'NPS' },
  ];

  const filename = `nps-relatorio-${groupBy}-${period}`;

  return (
    <div className="space-y-4 print:bg-white">
      <div className="flex justify-between items-end flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Relatórios avançados</h2>
          <p className="text-sm text-muted-foreground">Comparativo período-a-período, drill-down por dimensão e exportações.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(grouped as any, exportColumns, filename)}><Download className="mr-2 h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => exportToExcel(grouped as any, exportColumns, filename)}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        <div><Label>Campanha</Label>
          <Select value={campaignId ?? 'all'} onValueChange={(v) => setCampaignId(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Período</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="180d">Últimos 6 meses</SelectItem>
              <SelectItem value="365d">Último ano</SelectItem>
              <SelectItem value="all">Todo o histórico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Agrupar por</Label>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="city">Cidade</SelectItem>
              <SelectItem value="segment">Segmento</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs período-a-período */}
      {period !== 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">NPS período atual</div>
            <div className="text-3xl font-bold">{currentStats.nps}</div>
            <div className="text-xs text-muted-foreground mt-1">{currentStats.total} respostas</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">NPS período anterior</div>
            <div className="text-3xl font-bold text-muted-foreground">{previousStats.nps}</div>
            <div className="text-xs text-muted-foreground mt-1">{previousStats.total} respostas</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Variação</div>
            <div className={`text-3xl font-bold flex items-center gap-2 ${delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : ''}`}>
              {delta > 0 ? <TrendingUp className="h-6 w-6" /> : delta < 0 ? <TrendingDown className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
              {delta > 0 ? '+' : ''}{delta}
            </div>
            <div className="text-xs text-muted-foreground mt-1">vs. período anterior</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Distribuição</div>
            <div className="text-sm mt-1 space-y-0.5">
              <div className="flex justify-between"><span className="text-emerald-500">Prom.</span><span>{currentStats.p}</span></div>
              <div className="flex justify-between"><span className="text-yellow-500">Neut.</span><span>{currentStats.pas}</span></div>
              <div className="flex justify-between"><span className="text-red-500">Detr.</span><span>{currentStats.d}</span></div>
            </div>
          </CardContent></Card>
        </div>
      )}

      {isLoading ? <Skeleton className="h-64" /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Evolução do NPS (mês)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} domain={[-100, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="nps" stroke="#FF9800" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição de categorias</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Comparativo por {groupBy} (clique numa barra para drill-down)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grouped} onClick={(e: any) => {
                  const key = e?.activeLabel;
                  const g = grouped.find((x) => x.key === key);
                  if (g) setDrill({ key: g.key, rows: g.rows });
                }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="key" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="p" name="Promotores" stackId="a" fill={COLORS.promoter} style={{ cursor: 'pointer' }} />
                  <Bar dataKey="pas" name="Neutros" stackId="a" fill={COLORS.passive} style={{ cursor: 'pointer' }} />
                  <Bar dataKey="d" name="Detratores" stackId="a" fill={COLORS.detractor} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr><th className="text-left p-3">Chave</th><th className="text-right p-3">Total</th><th className="text-right p-3">Prom.</th><th className="text-right p-3">Neut.</th><th className="text-right p-3">Detrat.</th><th className="text-right p-3">NPS</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {grouped.map((g) => (
                    <tr key={g.key} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setDrill({ key: g.key, rows: g.rows })}>
                      <td className="p-3">{g.key}</td>
                      <td className="p-3 text-right">{g.total}</td>
                      <td className="p-3 text-right text-emerald-500">{g.p}</td>
                      <td className="p-3 text-right text-yellow-500">{g.pas}</td>
                      <td className="p-3 text-right text-red-500">{g.d}</td>
                      <td className="p-3 text-right font-bold">{g.nps}</td>
                      <td className="p-3 text-right"><Badge variant="outline" className="text-xs">Detalhar</Badge></td>
                    </tr>
                  ))}
                  {grouped.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sem dados no período selecionado</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <Sheet open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Drill-down: {drill?.key}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2">
            {drill?.rows.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md border border-border">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.clients?.name ?? r.name ?? 'Anônimo'}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.comment ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{r.responded_at?.slice(0, 10)} · {r.clients?.address_city ?? '—'} · {r.clients?.segment ?? '—'}</div>
                </div>
                <div className="text-right ml-3">
                  <div className={`text-2xl font-bold ${r.category === 'promoter' ? 'text-emerald-500' : r.category === 'detractor' ? 'text-red-500' : 'text-yellow-500'}`}>{r.score}</div>
                  <Badge variant="outline" className="text-xs">{r.category}</Badge>
                </div>
              </div>
            ))}
            {!drill?.rows.length && <p className="text-sm text-muted-foreground text-center py-8">Sem respostas neste grupo</p>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
