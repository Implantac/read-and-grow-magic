import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { toast } from 'sonner';
import {
  Activity, Heart, Brain, Sparkles, MessageSquare, TrendingUp, TrendingDown, AlertTriangle,
} from 'lucide-react';

type KPIs = {
  nps: number | null;
  nps_answers: number;
  promoters: number;
  passives: number;
  detractors: number;
  health_avg: number | null;
  health_low: number;
  churn_high: number;
  clusters: number;
  followups_open: number;
};

export default function CXDashboard() {
  const [k, setK] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ans, health, churn, clusters, followups] = await Promise.all([
          supabase.from('nps_answers').select('score, category').limit(5000),
          supabase.from('cx_health_scores').select('score'),
          supabase.from('cx_churn_predictions').select('risk_level').eq('risk_level', 'high'),
          supabase.from('cx_comment_clusters').select('id'),
          supabase.from('nps_followups').select('id').eq('status', 'open'),
        ]);

        const answers = (ans.data ?? []) as Array<{ score: number | null; category: string | null }>;
        const promoters = answers.filter(a => (a.category ?? '') === 'promoter').length;
        const passives = answers.filter(a => (a.category ?? '') === 'passive').length;
        const detractors = answers.filter(a => (a.category ?? '') === 'detractor').length;
        const total = promoters + passives + detractors;
        const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;

        const healthRows = (health.data ?? []) as Array<{ score: number }>;
        const health_avg = healthRows.length
          ? Math.round(healthRows.reduce((s, r) => s + Number(r.score || 0), 0) / healthRows.length)
          : null;
        const health_low = healthRows.filter(r => Number(r.score) < 50).length;

        setK({
          nps,
          nps_answers: total,
          promoters,
          passives,
          detractors,
          health_avg,
          health_low,
          churn_high: (churn.data ?? []).length,
          clusters: (clusters.data ?? []).length,
          followups_open: (followups.data ?? []).length,
        });
      } catch (e: any) {
        toast.error(e.message ?? 'Erro ao carregar KPIs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-center text-muted-foreground">Carregando KPIs…</div>;
  if (!k) return <div className="p-6 text-center text-muted-foreground">Sem dados.</div>;

  const npsColor =
    k.nps === null ? 'text-muted-foreground' : k.nps >= 50 ? 'text-emerald-500' : k.nps >= 0 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" /> Visão Consolidada — Customer Experience
        </h2>
        <p className="text-sm text-muted-foreground">
          KPIs unificados de NPS, Health Score, risco de churn e insights de IA.
        </p>
      </div>

      {/* Row 1 — Big KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> NPS Geral
            </span>
            {k.nps !== null && (k.nps >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ))}
          </div>
          <div className={`text-3xl font-bold ${npsColor}`}>{k.nps ?? '—'}</div>
          <div className="text-xs text-muted-foreground">{k.nps_answers} respostas</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="h-4 w-4" /> Health Score Médio
            </span>
          </div>
          <div className="text-3xl font-bold">{k.health_avg ?? '—'}</div>
          <Progress value={k.health_avg ?? 0} className="h-1.5" />
          <div className="text-xs text-muted-foreground">{k.health_low} clientes abaixo de 50</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Brain className="h-4 w-4" /> Risco de Churn (alto)
            </span>
            {k.churn_high > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          <div className="text-3xl font-bold text-red-500">{k.churn_high}</div>
          <div className="text-xs text-muted-foreground">clientes prioritários</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Follow-ups abertos
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-500">{k.followups_open}</div>
          <div className="text-xs text-muted-foreground">a serem tratados</div>
        </Card>
      </div>

      {/* Row 2 — Distribuição NPS + Clusters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3 md:col-span-2">
          <div className="text-sm font-medium">Distribuição NPS</div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600">Promotores {k.promoters}</Badge>
            <Badge className="bg-amber-500">Passivos {k.passives}</Badge>
            <Badge className="bg-red-600">Detratores {k.detractors}</Badge>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-muted">
            <div className="bg-emerald-500" style={{ width: `${pct(k.promoters, k.nps_answers)}%` }} />
            <div className="bg-amber-500" style={{ width: `${pct(k.passives, k.nps_answers)}%` }} />
            <div className="bg-red-500" style={{ width: `${pct(k.detractors, k.nps_answers)}%` }} />
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> Clusters de comentários (IA)
          </div>
          <div className="text-3xl font-bold">{k.clusters}</div>
          <div className="text-xs text-muted-foreground">temas identificados pela IA</div>
        </Card>
      </div>
    </div>
  );
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}
