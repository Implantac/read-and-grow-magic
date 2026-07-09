import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { toast } from 'sonner';
import { Loader2, Brain, AlertTriangle } from 'lucide-react';

type Row = {
  id: string; client_id: string; probability: number; risk_level: string;
  reasons: string[]; ai_summary: string | null; suggested_actions: string[]; predicted_at: string;
  clients?: { name: string };
};

const riskColor: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-500',
  medium: 'bg-amber-500/20 text-amber-500',
  high: 'bg-orange-500/20 text-orange-500',
  critical: 'bg-red-500/20 text-red-500',
};

export default function ChurnPrediction() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cx_churn_predictions')
      .select('id, client_id, probability, risk_level, reasons, ai_summary, suggested_actions, predicted_at, clients(name)')
      .order('probability', { ascending: false })
      .limit(100);
    if (error) toast.error(error.message); else setRows((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setRunning(true);
    const { error } = await supabase.functions.invoke('cx-churn-predict');
    if (error) toast.error(error.message); else { toast.success('Predição concluída'); await load(); }
    setRunning(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Brain className="h-5 w-5" /> Churn Prediction (IA)</h2>
        <Button onClick={run} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
          Rodar predição
        </Button>
      </div>

      {loading && <div className="p-6 text-center text-muted-foreground">Carregando…</div>}
      {!loading && rows.length === 0 && <Card className="p-6 text-center text-muted-foreground">Sem predições. Rode primeiro o Health Score, depois clique em "Rodar predição".</Card>}

      <div className="grid gap-3">
        {rows.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.clients?.name ?? r.client_id.slice(0, 8)}</span>
                  <Badge className={riskColor[r.risk_level]}>{r.risk_level}</Badge>
                  <span className="font-mono text-lg">{r.probability}%</span>
                </div>
                {r.ai_summary && <p className="text-sm text-muted-foreground mt-1">{r.ai_summary}</p>}
                {r.reasons?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.reasons.map((x, i) => <Badge key={i} variant="outline">{x}</Badge>)}
                  </div>
                )}
                {r.suggested_actions?.length > 0 && (
                  <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5">
                    {r.suggested_actions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.predicted_at).toLocaleString('pt-BR')}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
