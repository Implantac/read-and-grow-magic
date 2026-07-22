import { useState } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAIProductionInsights } from '@/hooks/production/useAIProductionInsights';

export function AIInsightsPanel() {
  const { insights, refetch } = useAIProductionInsights();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('ai-production', {
        body: { action: 'generate_insights' },
      });
      if (error) throw error;
      toast.success('Insights gerados pela IA!');
      refetch();
    } catch {
      toast.error('Erro ao gerar insights');
    } finally {
      setGenerating(false);
    }
  };

  const active = insights.filter((i: any) => i.status === 'active').slice(0, 10);

  return (
    <>
      <div className="mb-4">
        <Button onClick={handleGenerate} disabled={generating} size="lg">
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          Gerar Insights com IA Generativa
        </Button>
      </div>
      <div className="space-y-3">
        {active.map((insight: any) => (
          <Card key={insight.id} className={cn('border-l-4', insight.severity === 'critical' ? 'border-l-destructive' : insight.severity === 'high' ? 'border-l-warning' : 'border-l-primary')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{insight.title}</span>
                <Badge variant={insight.severity === 'critical' ? 'destructive' : 'secondary'}>{insight.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
              {insight.recommended_action && (
                <p className="text-xs text-primary mt-2">➡️ {insight.recommended_action}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {active.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Clique em "Gerar Insights com IA Generativa" para análise preditiva avançada.
          </p>
        )}
      </div>
    </>
  );
}
