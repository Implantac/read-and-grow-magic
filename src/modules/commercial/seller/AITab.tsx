import {
  AlertTriangle, ArrowRight, Brain, CheckCircle, Phone, RefreshCw, ShieldAlert, Sparkles, TrendingUp,
} from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';

interface AITabProps {
  aiActions: any[];
  aiRecs: any[];
  runAIEngine: { mutate: (v: string) => void; isPending: boolean };
  completeAIAction: { mutate: (v: { id: string; result: string }) => void };
  actOnAIRec: { mutate: (v: { id: string; result: string }) => void };
}

export function AITab({ aiActions, aiRecs, runAIEngine, completeAIAction, actOnAIRec }: AITabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Suas Ações do Dia (IA)
        </h3>
        <Button size="sm" variant="outline" onClick={() => runAIEngine.mutate('generate_daily_actions')} disabled={runAIEngine.isPending}>
          <RefreshCw className={`h-3 w-3 mr-1 ${runAIEngine.isPending ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {aiActions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Nenhuma ação gerada pela IA hoje.</p>
            <Button size="sm" onClick={() => runAIEngine.mutate('full_analysis')} disabled={runAIEngine.isPending}>
              <Brain className="h-3 w-3 mr-1" /> Gerar Análise Completa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {aiActions.map(action => {
            const isDone = action.status === 'completed';
            const ActionIcon = action.action_type === 'urgent_call' ? ShieldAlert : action.action_type === 'recovery' ? AlertTriangle : action.action_type === 'upsell' ? TrendingUp : action.action_type === 'reorder' ? RefreshCw : Phone;
            return (
              <Card key={action.id} className={isDone ? 'opacity-50' : ''}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDone ? 'bg-muted' : action.priority <= 2 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                    <ActionIcon className={`h-4 w-4 ${isDone ? 'text-muted-foreground' : action.priority <= 2 ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{action.title}</span>
                      <Badge variant={action.priority <= 2 ? 'destructive' : 'outline'} className="text-[10px]">P{action.priority}</Badge>
                      {isDone && <Badge className="bg-emerald-500 text-white text-[10px]">✓</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    {action.explanation && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1 italic border-l-2 border-primary/30 pl-2">💡 {action.explanation}</p>
                    )}
                    {action.clients && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{action.clients.cellphone || action.clients.phone}</span>
                        {action.estimated_value > 0 && <span className="text-primary font-medium">{formatBRL(action.estimated_value)}</span>}
                      </div>
                    )}
                  </div>
                  {!isDone && (
                    <Button size="sm" variant="outline" onClick={() => completeAIAction.mutate({ id: action.id, result: 'contacted' })}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Feito
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {aiRecs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            Recomendações da IA
            <Badge variant="secondary">{aiRecs.length}</Badge>
          </h3>
          <div className="space-y-2">
            {aiRecs.slice(0, 5).map(rec => (
              <Card key={rec.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{rec.title}</span>
                      {rec.estimated_value > 0 && <Badge variant="secondary" className="text-[10px]">{formatBRL(rec.estimated_value)}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                    {rec.explanation && <p className="text-[10px] text-muted-foreground/70 italic mt-1">💡 {rec.explanation}</p>}
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => actOnAIRec.mutate({ id: rec.id, result: 'applied' })}>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
