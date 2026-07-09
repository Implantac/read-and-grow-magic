import { useMemo, useState } from 'react';
import { useNPSAnswers, useNPSCampaigns } from './hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import { Download, Printer } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const COLORS = { promoter: '#10B981', passive: '#F59E0B', detractor: '#EF4444' };

export default function Reports() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [groupBy, setGroupBy] = useState<'city' | 'segment' | 'category' | 'month'>('month');
  const { data: answers = [], isLoading } = useNPSAnswers(campaignId ?? null, 5000);

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; total: number; p: number; d: number; pas: number; nps: number }>();
    answers.forEach((a: any) => {
      const key = groupBy === 'city' ? (a.clients?.address_city ?? a.city ?? 'N/D')
        : groupBy === 'segment' ? (a.clients?.segment ?? 'N/D')
        : groupBy === 'category' ? a.category
        : (a.responded_at ?? '').slice(0, 7);
      const e = map.get(key) ?? { key, total: 0, p: 0, d: 0, pas: 0, nps: 0 };
      e.total++;
      if (a.category === 'promoter') e.p++;
      else if (a.category === 'detractor') e.d++;
      else e.pas++;
      map.set(key, e);
    });
    return Array.from(map.values()).map((e) => ({ ...e, nps: e.total ? Math.round(((e.p - e.d) / e.total) * 100) : 0 })).sort((a, b) => a.key.localeCompare(b.key));
  }, [answers, groupBy]);

  const pieData = useMemo(() => {
    const p = answers.filter((a: any) => a.category === 'promoter').length;
    const pas = answers.filter((a: any) => a.category === 'passive').length;
    const d = answers.filter((a: any) => a.category === 'detractor').length;
    return [
      { name: 'Promotores', value: p, color: COLORS.promoter },
      { name: 'Neutros', value: pas, color: COLORS.passive },
      { name: 'Detratores', value: d, color: COLORS.detractor },
    ];
  }, [answers]);

  const trendData = useMemo(() => {
    const map = new Map<string, { month: string; total: number; p: number; d: number; nps: number }>();
    answers.forEach((a: any) => {
      const month = (a.responded_at ?? '').slice(0, 7);
      if (!month) return;
      const e = map.get(month) ?? { month, total: 0, p: 0, d: 0, nps: 0 };
      e.total++;
      if (a.category === 'promoter') e.p++;
      else if (a.category === 'detractor') e.d++;
      map.set(month, e);
    });
    return Array.from(map.values()).map((e) => ({ ...e, nps: e.total ? Math.round(((e.p - e.d) / e.total) * 100) : 0 })).sort((a, b) => a.month.localeCompare(b.month));
  }, [answers]);

  const exportCSV = () => {
    const header = ['Chave', 'Total', 'Promotores', 'Neutros', 'Detratores', 'NPS'].join(';');
    const rows = grouped.map(g => [g.key, g.total, g.p, g.pas, g.d, g.nps].join(';'));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nps-relatorio-${groupBy}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => window.print();

  return (
    <div className="space-y-4 print:bg-white">
      <div className="flex justify-between items-end flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Relatórios</h2>
          <p className="text-sm text-muted-foreground">NPS agrupado por dimensão. Gráficos, CSV e PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={exportPDF}><Printer className="mr-2 h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl print:hidden">
        <div><Label>Campanha</Label>
          <Select value={campaignId ?? 'all'} onValueChange={(v) => setCampaignId(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
            <CardHeader><CardTitle className="text-base">Comparativo por {groupBy}</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grouped}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="key" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="p" name="Promotores" stackId="a" fill={COLORS.promoter} />
                  <Bar dataKey="pas" name="Neutros" stackId="a" fill={COLORS.passive} />
                  <Bar dataKey="d" name="Detratores" stackId="a" fill={COLORS.detractor} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr><th className="text-left p-3">Chave</th><th className="text-right p-3">Total</th><th className="text-right p-3">Prom.</th><th className="text-right p-3">Neut.</th><th className="text-right p-3">Detrat.</th><th className="text-right p-3">NPS</th></tr>
                </thead>
                <tbody>
                  {grouped.map((g) => (
                    <tr key={g.key} className="border-t border-border">
                      <td className="p-3">{g.key}</td>
                      <td className="p-3 text-right">{g.total}</td>
                      <td className="p-3 text-right text-emerald-500">{g.p}</td>
                      <td className="p-3 text-right text-yellow-500">{g.pas}</td>
                      <td className="p-3 text-right text-red-500">{g.d}</td>
                      <td className="p-3 text-right font-bold">{g.nps}</td>
                    </tr>
                  ))}
                  {grouped.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem dados</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
