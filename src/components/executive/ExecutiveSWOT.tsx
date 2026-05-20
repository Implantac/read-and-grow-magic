import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ShieldAlert, Zap, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SWOTItem {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

interface Props {
  data?: SWOTData;
  isLoading?: boolean;
}

export function ExecutiveSWOT({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-48 animate-pulse bg-muted/20" />
        ))}
      </div>
    );
  }

  const sections = [
    { 
      title: 'Forças (Strengths)', 
      items: data?.strengths || [], 
      icon: TrendingUp, 
      color: 'text-success', 
      bg: 'bg-success/5', 
      border: 'border-success/20',
      description: 'Vantagens competitivas e capacidades internas.'
    },
    { 
      title: 'Fraquezas (Weaknesses)', 
      items: data?.weaknesses || [], 
      icon: TrendingDown, 
      color: 'text-destructive', 
      bg: 'bg-destructive/5', 
      border: 'border-destructive/20',
      description: 'Pontos de melhoria e limitações operacionais.'
    },
    { 
      title: 'Oportunidades (Opportunities)', 
      items: data?.opportunities || [], 
      icon: Zap, 
      color: 'text-primary', 
      bg: 'bg-primary/5', 
      border: 'border-primary/20',
      description: 'Fatores externos favoráveis ao crescimento.'
    },
    { 
      title: 'Ameaças (Threats)', 
      items: data?.threats || [], 
      icon: ShieldAlert, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/5', 
      border: 'border-orange-500/20',
      description: 'Riscos externos e barreiras ao sucesso.'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section, idx) => (
        <Card key={idx} className={cn("border-l-4", section.border, section.bg)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <section.icon className={cn("h-5 w-5", section.color)} />
              <h3 className="font-bold text-sm uppercase tracking-tight">{section.title}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3 leading-tight">{section.description}</p>
            
            <div className="space-y-2">
              {section.items.length > 0 ? (
                section.items.map((item, i) => (
                  <div key={i} className="bg-background/60 rounded-lg p-2 border border-border/40">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold leading-tight">{item.title}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase shrink-0">
                        {item.impact}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg opacity-40">
                  <p className="text-[10px]">Nenhum item detectado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
