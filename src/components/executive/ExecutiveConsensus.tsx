import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Brain, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const consensusItems = [
  {
    specialist: 'CTO Global',
    insight: 'Escalabilidade horizontal recomendada para o módulo de faturamento devido ao pico de final de mês.',
    status: 'recommendation',
  },
  {
    specialist: 'Arquiteto SAP S/4HANA',
    insight: 'Estrutura de dados para integração via iDoc validada para o novo armazém.',
    status: 'success',
  },
  {
    specialist: 'Especialista PCP/MRP/APS',
    insight: 'Gargalo detectado na linha de tecelagem 04. Sugestão: Re-alocação de ordens para teares tipo B.',
    status: 'alert',
  },
  {
    specialist: 'Especialista Fiscal BR',
    insight: 'Nova normativa de ICMS-ST para o setor têxtil integrada com sucesso ao motor de regras.',
    status: 'success',
  }
];

export function ExecutiveConsensus({ consensus = [] }: { consensus?: any[] }) {
  const items = consensus.length > 0 ? consensus : consensusItems;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Consenso do Conselho (EEE)</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">
            Inteligência Coletiva Ativa
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-default border-b border-border/30 last:border-0"
            >
              <div className={cn(
                "mt-0.5 p-1.5 rounded-full shrink-0",
                item.status === 'success' ? "bg-success/10 text-success" :
                item.status === 'alert' ? "bg-destructive/10 text-destructive" :
                "bg-info/10 text-info"
              )}>
                {item.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                 item.status === 'alert' ? <AlertCircle className="h-3.5 w-3.5" /> :
                 <MessageSquare className="h-3.5 w-3.5" />}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">
                  {item.specialist}
                </p>
                <p className="text-xs font-medium leading-relaxed">
                  {item.insight}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 px-4 pb-2">
          <p className="text-[9px] text-center text-muted-foreground italic">
            Consenso gerado baseado em KPIs consolidados em tempo real.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
