import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { CheckCircle2, ArrowRight, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendedAction {
  title: string;
  description: string;
  impact: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  module?: string;
}

interface Props {
  actions: RecommendedAction[];
  onExecute?: (action: string) => void;
}

const priorityConfig = {
  critical: { color: 'text-destructive bg-destructive/10', icon: AlertCircle, label: 'Crítico' },
  high: { color: 'text-orange-600 bg-orange-500/10', icon: Zap, label: 'Alta' },
  medium: { color: 'text-blue-600 bg-blue-500/10', icon: TrendingUp, label: 'Média' },
  low: { color: 'text-muted-foreground bg-muted', icon: CheckCircle2, label: 'Baixa' },
};

export function ExecutiveActionsPanel({ actions, onExecute }: Props) {
  if (!actions || actions.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Ações Estratégicas Recomendadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, i) => {
            const config = priorityConfig[action.priority] || priorityConfig.medium;
            return (
              <Card key={i} className="border-none shadow-none bg-background/50 hover:bg-background transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={cn('text-[10px] px-1.5 py-0', config.color)}>
                      {config.label}
                    </Badge>
                    {action.module && (
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        {action.module}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold leading-tight">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed">
                    <span className="text-[10px] font-medium text-primary">Impacto: {action.impact}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 px-2"
                      onClick={() => onExecute?.(`Como posso executar: ${action.title}?`)}
                    >
                      Executar <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
