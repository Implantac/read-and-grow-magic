import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Heart } from 'lucide-react';

type Row = { id: string; client_id: string; score: number; tier: string; factors: any; computed_at: string; clients?: { name: string } };

const tierColor: Record<string, string> = {
  excellent: 'bg-emerald-500/20 text-emerald-500',
  good: 'bg-blue-500/20 text-blue-500',
  attention: 'bg-amber-500/20 text-amber-500',
  critical: 'bg-red-500/20 text-red-500',
};

export default function HealthScores() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalc, setRecalc] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cx_health_scores')
      .select('id, client_id, score, tier, factors, computed_at, clients(name)')
      .order('score', { ascending: true })
      .limit(200);
    if (error) toast.error(error.message); else setRows((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function runRecalc() {
    setRecalc(true);
    const { error } = await supabase.functions.invoke('cx-health-recalc');
    if (error) toast.error(error.message); else { toast.success('Recalculado'); await load(); }
    setRecalc(false);
  }

  const stats = rows.reduce((a, r) => { a[r.tier] = (a[r.tier] ?? 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Heart className="h-5 w-5" /> Customer Health Score</h2>
        <Button onClick={runRecalc} disabled={recalc}>
          {recalc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Recalcular
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(['excellent', 'good', 'attention', 'critical'] as const).map(t => (
          <Card key={t} className="p-4">
            <div className="text-xs text-muted-foreground uppercase">{t}</div>
            <div className="text-2xl font-bold">{stats[t] ?? 0}</div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-right">Score</th>
              <th className="p-3 text-left">Tier</th>
              <th className="p-3 text-left">Última avaliação</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhum score. Clique em Recalcular.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.clients?.name ?? r.client_id.slice(0, 8)}</td>
                <td className="p-3 text-right font-mono">{r.score}</td>
                <td className="p-3"><Badge className={tierColor[r.tier]}>{r.tier}</Badge></td>
                <td className="p-3 text-muted-foreground">{new Date(r.computed_at).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
