import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  ShieldCheck,
  Search,
  Cpu
} from 'lucide-react';
import { Progress } from '@/ui/base/progress';

export function AIConsensusPanel() {
  const analytics = [
    { label: 'Precisão Preditiva', value: 94, icon: Target, color: 'text-blue-500' },
    { label: 'Autonomia Decisória', value: 78, icon: Zap, color: 'text-amber-500' },
    { label: 'Eficiência Operacional', value: 86, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Segurança de Dados', value: 99, icon: ShieldCheck, color: 'text-purple-500' }
  ];

  return (
    <Card className="h-full border-primary/20 bg-background/50 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-primary/5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/80">Métricas do Cérebro</CardTitle>
              <p className="text-[10px] text-muted-foreground font-medium">Performance da Inteligência</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] bg-background font-mono border-primary/30 text-primary">
            v2.4
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {analytics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs font-bold">{item.value}%</span>
                </div>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">{item.label}</p>
                <Progress value={item.value} className="h-1" />
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Search className="h-3 w-3" /> Foco de Análise Atual
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Otimização de Capital de Giro', priority: 'High' },
              { label: 'Previsão de Demanda Têxtil', priority: 'Medium' },
              { label: 'Detecção de Anomalias Fiscais', priority: 'High' }
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/40">
                <span className="text-[11px] font-medium">{task.label}</span>
                <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-[8px] h-4 px-1">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
