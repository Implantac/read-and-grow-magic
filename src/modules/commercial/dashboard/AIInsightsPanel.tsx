import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Brain, RefreshCw, Sparkles } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';

interface Props {
  aiActions: any[];
  aiRecs: any[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AIInsightsPanel({ aiActions, aiRecs, onRefresh, isRefreshing }: Props) {
  if (aiActions.length === 0 && aiRecs.length === 0) return null;
  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Inteligência Artificial — Resumo do Dia
          </CardTitle>
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> Atualizar IA
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {aiActions.filter(a => a.status === 'pending').slice(0, 4).map(action => (
            <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                {action.estimated_value > 0 && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">{formatBRL(action.estimated_value)}</Badge>
                )}
              </div>
            </div>
          ))}
          {aiRecs.slice(0, 4).map(rec => (
            <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg border bg-primary/5">
              <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{rec.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                {rec.estimated_value > 0 && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">{formatBRL(rec.estimated_value)}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
