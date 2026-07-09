import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';

type Cluster = { name: string; sentiment: string; count: number; sample: string[]; keywords: string[] };
type Row = { id: string; total_comments: number; clusters: Cluster[]; period_start: string; period_end: string; created_at: string };

const sentimentColor: Record<string, string> = {
  positive: 'bg-emerald-500/20 text-emerald-500',
  neutral: 'bg-slate-500/20 text-slate-400',
  negative: 'bg-red-500/20 text-red-500',
};

export default function CommentClusters() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  async function load() {
    const { data, error } = await supabase.from('cx_comment_clusters')
      .select('id, total_comments, clusters, period_start, period_end, created_at')
      .order('created_at', { ascending: false }).limit(10);
    if (error) toast.error(error.message); else setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setRunning(true);
    const { error } = await supabase.functions.invoke('cx-ai-cluster', { body: { days: 30 } });
    if (error) toast.error(error.message); else { toast.success('Clusters gerados'); await load(); }
    setRunning(false);
  }

  const latest = rows[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Clusters de Comentários (IA)</h2>
        <Button onClick={run} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gerar clusters (30d)
        </Button>
      </div>

      {!latest && <Card className="p-6 text-center text-muted-foreground">Nenhuma análise. Clique em "Gerar clusters".</Card>}

      {latest && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-3">
            {latest.total_comments} comentários • {new Date(latest.period_start).toLocaleDateString('pt-BR')} → {new Date(latest.period_end).toLocaleDateString('pt-BR')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {latest.clusters.map((c, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.name}</h3>
                  <div className="flex gap-2 items-center">
                    <Badge className={sentimentColor[c.sentiment] ?? ''}>{c.sentiment}</Badge>
                    <span className="font-mono">{c.count}</span>
                  </div>
                </div>
                {c.keywords?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">{c.keywords.map((k, j) => <Badge key={j} variant="outline">{k}</Badge>)}</div>
                )}
                {c.sample?.length > 0 && (
                  <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5">
                    {c.sample.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
