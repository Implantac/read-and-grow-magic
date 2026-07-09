import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { useNPSStats, useNPSAnswers, useNPSCampaigns, useCSATCESMetrics } from './hooks';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Smile, Meh, Frown, TrendingUp, Users, Send, AlertTriangle, Heart, Gauge } from 'lucide-react';

const COLORS = { promoter: '#10b981', passive: '#eab308', detractor: '#ef4444' };

export default function NPSDashboard() {
  const { data: stats, isLoading } = useNPSStats();
  const { data: answers = [] } = useNPSAnswers();
  const { data: campaigns = [] } = useNPSCampaigns();
  const { data: csatCes } = useCSATCESMetrics();

  const byMonth = useMemo(() => {
    const map = new Map<string, { m: string; total: number; p: number; d: number; pas: number; nps: number }>();
    answers.forEach((a) => {
      const m = (a.responded_at ?? '').slice(0, 7);
      if (!m) return;
      const e = map.get(m) ?? { m, total: 0, p: 0, d: 0, pas: 0, nps: 0 };
      e.total++;
      if (a.category === 'promoter') e.p++;
      else if (a.category === 'detractor') e.d++;
      else e.pas++;
      map.set(m, e);
    });
    return Array.from(map.values()).sort((a, b) => a.m.localeCompare(b.m)).map((e) => ({
      ...e, nps: e.total ? Math.round(((e.p - e.d) / e.total) * 100) : 0,
    }));
  }, [answers]);

  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    answers.forEach((a: any) => { const c = a.clients?.address_city ?? a.city ?? 'N/D'; map.set(c, (map.get(c) ?? 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [answers]);

  const critical = answers.filter((a: any) => a.category === 'detractor').slice(0, 8);
  const lastAnswers = answers.slice(0, 6);

  const pieData = stats ? [
    { name: 'Promotores', value: stats.promoters, key: 'promoter' },
    { name: 'Neutros', value: stats.passives, key: 'passive' },
    { name: 'Detratores', value: stats.detractors, key: 'detractor' },
  ] : [];

  if (isLoading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPI title="NPS Atual" value={stats?.score ?? 0} suffix="" icon={<TrendingUp className="h-5 w-5" />} accent={npsColor(stats?.score ?? 0)} />
        <KPI title="Total de respostas" value={stats?.total ?? 0} icon={<Users className="h-5 w-5" />} />
        <KPI title="Taxa de resposta" value={stats?.responseRate ?? 0} suffix="%" icon={<Send className="h-5 w-5" />} />
        <KPI title="Campanhas ativas" value={stats?.activeCampaigns ?? 0} icon={<Megaphone />} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex gap-2 items-center text-emerald-500"><Smile className="h-4 w-4" /> Promotores</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.promoters ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex gap-2 items-center text-yellow-500"><Meh className="h-4 w-4" /> Neutros</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.passives ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex gap-2 items-center text-red-500"><Frown className="h-4 w-4" /> Detratores</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.detractors ?? 0}</CardContent>
        </Card>
      </div>

      {(csatCes?.csat.total || csatCes?.ces.total) ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex gap-2 items-center"><Heart className="h-4 w-4 text-pink-500" /> CSAT — Satisfação</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{csatCes?.csat.media ?? 0}<span className="text-base text-muted-foreground">/5</span></div>
              <p className="text-xs text-muted-foreground">{csatCes?.csat.satisfeitosPct ?? 0}% satisfeitos · {csatCes?.csat.total ?? 0} respostas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex gap-2 items-center"><Gauge className="h-4 w-4 text-blue-500" /> CES — Esforço do cliente</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{csatCes?.ces.media ?? 0}<span className="text-base text-muted-foreground">/7</span></div>
              <p className="text-xs text-muted-foreground">{csatCes?.ces.baixoEsforcoPct ?? 0}% com baixo esforço · {csatCes?.ces.total ?? 0} respostas</p>
            </CardContent>
          </Card>
        </div>
      ) : null}


      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Evolução mensal do NPS</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonth}>
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="nps" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {pieData.map((d) => <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Respostas por cidade</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCity}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex gap-2 items-center"><AlertTriangle className="h-4 w-4 text-red-500" /> Clientes críticos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {critical.length === 0 && <p className="text-muted-foreground">Sem detratores no período.</p>}
            {critical.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between border-b border-border pb-1">
                <span className="truncate">{a.clients?.name ?? 'Cliente'}</span>
                <Badge variant="destructive">{a.score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas respostas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lastAnswers.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 border-b border-border py-2 text-sm">
              <Badge className={a.category === 'promoter' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : a.category === 'detractor' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}>
                {a.score}
              </Badge>
              <div className="flex-1">
                <div className="font-medium">{a.clients?.name ?? 'Cliente'}</div>
                {a.comment && <div className="text-muted-foreground text-xs mt-1 line-clamp-2">{a.comment}</div>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(a.responded_at).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
          {lastAnswers.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma resposta ainda.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ title, value, suffix, icon, accent }: any) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs uppercase text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accent ?? ''}`}>{value}{suffix ?? ''}</div>
      </CardContent>
    </Card>
  );
}

function Megaphone(_p: any) { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l18-5v12L3 13v-2z"/></svg>; }

function npsColor(s: number) {
  if (s >= 50) return 'text-emerald-500';
  if (s >= 0) return 'text-yellow-500';
  return 'text-red-500';
}
