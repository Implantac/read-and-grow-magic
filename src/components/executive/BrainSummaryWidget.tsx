import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Brain, Sparkles, AlertTriangle, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { useBrainDecisions, useBrainRuns, useRunBrain } from '@/hooks/ai/useAIBrain';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const saudeIcon: Record<string, string> = {
  critico: '🔴',
  alerta: '⚠️',
  ok: '✅',
};

export function BrainSummaryWidget() {
  const { data: pending = [] } = useBrainDecisions('pending');
  const { data: runs = [] } = useBrainRuns();
  const runBrain = useRunBrain();
  const last = runs[0];
  const veredicto = last?.structured?.veredicto;
  const saude = last?.structured?.saude_geral;
  const critical = pending.filter((d) => d.impact_level === 'critical').length;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Cérebro Nativo
          {saude && <span className="text-xs text-muted-foreground font-normal ml-1">{saudeIcon[saude] || ''} {saude}</span>}
        </CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => runBrain.mutate('analyze')} disabled={runBrain.isPending} className="h-7 px-2">
            <RefreshCw className={`h-3 w-3 ${runBrain.isPending ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-7 px-2 gap-1">
            <Link to="/executive/brain">Abrir <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {veredicto ? (
          <div className="flex gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{veredicto}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma análise ainda. Clique em <Zap className="h-3 w-3 inline" /> para o cérebro avaliar o ERP.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {critical > 0 && (
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {critical} crítica(s)</Badge>
          )}
          <Badge variant="outline">{pending.length} pendente(s)</Badge>
          {last && (
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(last.created_at), "dd/MM HH:mm", { locale: ptBR })} · {last.decisions_count} decisões
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
