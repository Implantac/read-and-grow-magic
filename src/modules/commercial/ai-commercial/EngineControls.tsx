import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Brain, RefreshCw, Target, Percent, Sparkles, Lightbulb, BarChart3 } from 'lucide-react';

type Engine = 'score_clients' | 'generate_daily_actions' | 'generate_predictions' | 'generate_recommendations' | 'generate_insights' | 'generate_forecast' | 'full_analysis';

export function EngineControls({ isRunning, run }: { isRunning: boolean; run: (e: Engine) => void }) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-center gap-3 py-4">
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm">Motores da IA</span>
        <div className="flex flex-wrap gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={() => run('score_clients')} disabled={isRunning}>
            <RefreshCw className={`h-3 w-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} /> Scoring
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('generate_daily_actions')} disabled={isRunning}>
            <Target className="h-3 w-3 mr-1" /> Ações
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('generate_predictions')} disabled={isRunning}>
            <Percent className="h-3 w-3 mr-1" /> Previsões
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('generate_recommendations')} disabled={isRunning}>
            <Sparkles className="h-3 w-3 mr-1" /> Recomendações
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('generate_insights')} disabled={isRunning}>
            <Lightbulb className="h-3 w-3 mr-1" /> Insights
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('generate_forecast')} disabled={isRunning}>
            <BarChart3 className="h-3 w-3 mr-1" /> Forecast
          </Button>
          <Button size="sm" onClick={() => run('full_analysis')} disabled={isRunning}>
            <Brain className={`h-3 w-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} /> Análise Completa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
