import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { toast } from 'sonner';
import { Loader2, FileText, Sparkles } from 'lucide-react';

type Row = { id: string; summary: string; key_insights: string[]; recommendations: string[]; metrics: any; period_start: string; period_end: string; created_at: string };

export default function ExecutiveSummary() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  async function load() {
    const { data, error } = await supabase.from('cx_executive_summaries')
      .select('id, summary, key_insights, recommendations, metrics, period_start, period_end, created_at')
      .order('created_at', { ascending: false }).limit(5);
    if (error) toast.error(error.message); else setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setRunning(true);
    const { error } = await supabase.functions.invoke('cx-executive-summary', { body: {} });
    if (error) toast.error(error.message); else { toast.success('Resumo gerado'); await load(); }
    setRunning(false);
  }

  const latest = rows[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Resumo Executivo IA</h2>
        <Button onClick={run} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gerar resumo
        </Button>
      </div>

      {!latest && <Card className="p-6 text-center text-muted-foreground">Nenhum resumo. Clique em "Gerar resumo".</Card>}

      {latest && (
        <Card className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            {new Date(latest.period_start).toLocaleDateString('pt-BR')} → {new Date(latest.period_end).toLocaleDateString('pt-BR')}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 bg-muted/40 rounded"><div className="text-xs text-muted-foreground">NPS</div><div className="text-2xl font-bold">{latest.metrics?.nps ?? 0}</div></div>
            <div className="p-3 bg-muted/40 rounded"><div className="text-xs text-muted-foreground">Respostas</div><div className="text-2xl font-bold">{latest.metrics?.total ?? 0}</div></div>
            <div className="p-3 bg-muted/40 rounded"><div className="text-xs text-muted-foreground">Promotores</div><div className="text-2xl font-bold">{latest.metrics?.promoters ?? 0}</div></div>
            <div className="p-3 bg-muted/40 rounded"><div className="text-xs text-muted-foreground">Detratores</div><div className="text-2xl font-bold">{latest.metrics?.detractors ?? 0}</div></div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Resumo</h3>
            <p className="text-sm">{latest.summary}</p>
          </div>
          {latest.key_insights?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Insights</h3>
              <ul className="text-sm list-disc pl-5">{latest.key_insights.map((i, k) => <li key={k}>{i}</li>)}</ul>
            </div>
          )}
          {latest.recommendations?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Recomendações</h3>
              <ul className="text-sm list-disc pl-5">{latest.recommendations.map((i, k) => <li key={k}>{i}</li>)}</ul>
            </div>
          )}
        </Card>
      )}

      {rows.slice(1).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Histórico</h3>
          {rows.slice(1).map(r => (
            <Card key={r.id} className="p-3 flex justify-between text-sm">
              <span>{new Date(r.period_start).toLocaleDateString('pt-BR')} → {new Date(r.period_end).toLocaleDateString('pt-BR')}</span>
              <Badge variant="outline">NPS {r.metrics?.nps ?? 0}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
