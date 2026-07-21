import { Brain, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { cn } from '@/lib/utils';
import { impactColor, statusLabel } from './constants';

interface BrainDecisionsProps {
  decisions: any[];
  onApprove: (id: string, approve: boolean) => void;
  approvePending: boolean;
  onAnalyze: () => void;
}

export function BrainDecisions({ decisions, onApprove, approvePending, onAnalyze }: BrainDecisionsProps) {
  return (
    <div className="space-y-3">
      {decisions.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma decisão ainda.</p>
            <Button variant="link" size="sm" onClick={onAnalyze}>Analisar agora</Button>
          </CardContent>
        </Card>
      )}
      {decisions.map((d) => (
        <Card key={d.id} className={cn('transition-all hover:shadow-md', d.status === 'pending' && 'border-l-4 border-l-primary')}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Badge variant="outline" className={cn('text-[10px] border', impactColor[d.impact_level])}>
                    {d.impact_level.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="uppercase text-[10px]">{d.module}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{statusLabel[d.status] || d.status}</Badge>
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {(d.confidence * 100).toFixed(0)}% confiança
                  </span>
                </div>
                <h4 className="font-semibold text-sm">{d.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{d.rationale}</p>
                {d.proposed_action?.tool && (
                  <div className="mt-2 text-xs bg-muted/50 rounded-lg p-2 font-mono text-muted-foreground border border-dashed">
                    <Zap className="h-3 w-3 inline mr-1.5 text-primary" />
                    {d.proposed_action.tool}
                  </div>
                )}
              </div>
              {d.status === 'pending' && (
                <div className="flex flex-col gap-1.5 shrink-0" role="group" aria-label={`Ações para a decisão: ${d.title}`}>
                  <Button size="sm" onClick={() => onApprove(d.id, true)} disabled={approvePending} className="gap-1 h-8" aria-label={`Aprovar decisão: ${d.title}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onApprove(d.id, false)} disabled={approvePending} className="gap-1 h-8" aria-label={`Rejeitar decisão: ${d.title}`}>
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Rejeitar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
