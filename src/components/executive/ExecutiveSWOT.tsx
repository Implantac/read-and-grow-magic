import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ShieldAlert, Zap, Check } from 'lucide-react';
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

const SWOT_FILTERS_KEY = 'executive-swot-filters';

export function ExecutiveSWOT({ data, isLoading }: Props) {
  const [activeFilters, setActiveFilters] = useState<string[]>(() => {
    const saved = localStorage.getItem(SWOT_FILTERS_KEY);
    return saved ? JSON.parse(saved) : ['strengths', 'weaknesses', 'opportunities', 'threats'];
  });

  useEffect(() => {
    localStorage.setItem(SWOT_FILTERS_KEY, JSON.stringify(activeFilters));
  }, [activeFilters]);

  const toggleFilter = (id: string) => {
    setActiveFilters(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(f => f !== id) : prev) 
        : [...prev, id]
    );
  };


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
      id: 'strengths',
      title: 'Forças', 
      items: data?.strengths || [], 
      icon: TrendingUp, 
      color: 'text-success', 
      bg: 'bg-success/5', 
      border: 'border-success/20',
      description: 'Vantagens competitivas e capacidades internas.'
    },
    { 
      id: 'weaknesses',
      title: 'Fraquezas', 
      items: data?.weaknesses || [], 
      icon: TrendingDown, 
      color: 'text-destructive', 
      bg: 'bg-destructive/5', 
      border: 'border-destructive/20',
      description: 'Pontos de melhoria e limitações operacionais.'
    },
    { 
      id: 'opportunities',
      title: 'Oportunidades', 
      items: data?.opportunities || [], 
      icon: Zap, 
      color: 'text-primary', 
      bg: 'bg-primary/5', 
      border: 'border-primary/20',
      description: 'Fatores externos favoráveis ao crescimento.'
    },
    { 
      id: 'threats',
      title: 'Ameaças', 
      items: data?.threats || [], 
      icon: ShieldAlert, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/5', 
      border: 'border-orange-500/20',
      description: 'Riscos externos e barreiras ao sucesso.'
    },
  ];

  const filteredSections = sections.filter(s => activeFilters.includes(s.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {sections.map(section => (
          <Button
            key={section.id}
            variant={activeFilters.includes(section.id) ? "secondary" : "outline"}
            size="sm"
            onClick={() => toggleFilter(section.id)}
            className={cn(
              "h-8 gap-2 text-[10px] font-bold uppercase tracking-wider transition-all",
              activeFilters.includes(section.id) ? "opacity-100 shadow-sm" : "opacity-50 grayscale"
            )}
          >
            <section.icon className={cn("h-3.5 w-3.5", section.color)} />
            {section.title}
            {activeFilters.includes(section.id) && <Check className="h-3 w-3 ml-1 opacity-50" />}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSections.map((section, idx) => (
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
    </div>
  );
}
