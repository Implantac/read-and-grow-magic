import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Brain, MessageSquare, CheckCircle2, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrainRuns } from '@/hooks/ai/useAIBrain';
import { useExecutiveDashboard } from '@/hooks/ai/useExecutiveAI';

const fallbackConsensus = [
  {
    specialist: 'IA CFO',
    insight: 'Recomendo antecipação de recebíveis para garantir liquidez diante do aumento sazonal de compras.',
    status: 'recommendation',
  },
  {
    specialist: 'Especialista PCP',
    insight: 'Gargalo detectado na linha de tecelagem 04. Sugestão: Re-alocação de ordens para teares tipo B.',
    status: 'alert',
  },
  {
    specialist: 'Market Intelligence',
    insight: 'Nova normativa de ICMS-ST para o setor têxtil integrada com sucesso ao motor de regras.',
    status: 'success',
  }
];

export function ExecutiveConsensus({ consensus = [] }: { consensus?: any[] }) {
  const { data: runs = [] } = useBrainRuns();
  const lastRun = runs[0];
  
  // Extrair riscos e oportunidades do Brain Run real para o Consenso
  const brainRisks = lastRun?.structured?.riscos || [];
  const brainOpps = lastRun?.structured?.oportunidades || [];
  
  const { data: dashboardData } = useExecutiveDashboard();
  
  const brainConsensus = [
    ...brainRisks.map((r: any) => ({
      specialist: 'Risk Advisor',
      insight: `${r.titulo}: ${r.acao}`,
      status: 'alert'
    })),
    ...brainOpps.map((o: any) => ({
      specialist: 'Growth Strategist',
      insight: `${o.titulo}: ${o.acao}`,
      status: 'recommendation'
    }))
  ];

  // Integrar consenso do dashboard executivo
  const dashboardConsensus = dashboardData?.consensus || [];

  const items = [
    ...brainConsensus,
    ...dashboardConsensus
  ].slice(0, 6);

  if (items.length === 0) {
    items.push(...(consensus.length > 0 ? consensus : fallbackConsensus));
  }

  return (
    <Card className="border-primary/20 bg-background/50 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/80">Consenso AI Enterprise</CardTitle>
          </div>
          <Badge variant="outline" className="text-[9px] bg-background font-mono border-primary/30">
            AUTO-SYNC
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="divide-y divide-border/30">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className="group flex items-start gap-3 p-3.5 hover:bg-primary/5 transition-all cursor-default relative overflow-hidden"
            >
              <div className={cn(
                "mt-0.5 p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110",
                item.status === 'success' ? "bg-success/10 text-success" :
                item.status === 'alert' ? "bg-destructive/10 text-destructive shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                item.status === 'recommendation' ? "bg-info/10 text-info" :
                "bg-muted text-muted-foreground"
              )}>
                {item.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                 item.status === 'alert' ? <AlertCircle className="h-3.5 w-3.5" /> :
                 item.status === 'recommendation' ? <Lightbulb className="h-3.5 w-3.5" /> :
                 <MessageSquare className="h-3.5 w-3.5" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-black uppercase text-primary/60 tracking-tighter">
                    {item.specialist}
                  </p>
                  {item.status === 'recommendation' && <TrendingUp className="h-2.5 w-2.5 text-info animate-bounce" />}
                </div>
                <p className="text-xs font-semibold leading-relaxed text-foreground/90">
                  {item.insight}
                </p>
              </div>
              {item.status === 'alert' && (
                <div className="absolute top-0 right-0 h-full w-1 bg-destructive/50" />
              )}
            </div>
          ))}
        </div>
        <div className="p-3 bg-muted/20">
          <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-50">
            Inteligência Coletiva • Latência {lastRun?.duration_ms ? `${(lastRun.duration_ms/1000).toFixed(1)}s` : '0.8s'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
