import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Skeleton } from '@/ui/base/skeleton';
import { Brain, TrendingUp, AlertTriangle, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { formatBRL } from '@/lib/formatters';

interface Props {
  clientId: string;
}

export function ClientAIWidget({ clientId }: Props) {
  const { data: score, isLoading: loadingScore } = useQuery({
    queryKey: ['ai_score_client', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_sales_scores')
        .select('*')
        .eq('client_id', clientId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!clientId,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['ai_recs_client', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!clientId,
  });

  if (loadingScore) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" /> IA Comercial
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" /> IA Comercial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Score não calculado. Execute o motor de scoring na IA Comercial.</p>
        </CardContent>
      </Card>
    );
  }

  const gradeColors: Record<string, string> = {
    A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Análise IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${gradeColors[score.score_grade] || 'bg-muted'}`}>
            {score.score_grade}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Score: {score.score_numeric}/100</span>
              <Badge variant="outline" className="text-xs">{score.priority_level}</Badge>
            </div>
            <Progress value={score.score_numeric} className="h-1.5" />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-1.5 bg-muted/50 rounded">
            <div className="text-muted-foreground">Recência</div>
            <div className="font-semibold">{score.days_since_purchase}d</div>
          </div>
          <div className="text-center p-1.5 bg-muted/50 rounded">
            <div className="text-muted-foreground">Cancelamento</div>
            <div className={`font-semibold ${score.churn_probability > 0.5 ? 'text-red-500' : ''}`}>
              {Math.round(score.churn_probability * 100)}%
            </div>
          </div>
          <div className="text-center p-1.5 bg-muted/50 rounded">
            <div className="text-muted-foreground">Recompra</div>
            <div className="font-semibold text-emerald-600">{Math.round(score.recompra_probability * 100)}%</div>
          </div>
        </div>

        {/* Explanation */}
        {score.explanation && (
          <p className="text-xs text-muted-foreground italic">💡 {score.explanation}</p>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t">
            <div className="text-xs font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Recomendações
            </div>
            {recommendations.slice(0, 3).map((rec: any) => (
              <div key={rec.id} className="flex items-start gap-1.5 text-xs">
                <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{rec.title}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
