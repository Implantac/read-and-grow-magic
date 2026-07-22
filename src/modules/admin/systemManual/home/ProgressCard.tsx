import { RotateCcw, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { Button } from '@/ui/base/button';

export function ProgressCard({ count, total, onReset }: { count: number; total: number; onReset: () => void }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 ring-1 ring-amber-500/30">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <p className="text-sm font-semibold">Seu progresso no treinamento</p>
              <span className="text-sm font-bold text-primary tabular-nums">
                {count}/{total} <span className="text-muted-foreground font-normal">({pct}%)</span>
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {count === 0 && 'Marque um módulo como concluído após ler o manual e treinar em sandbox.'}
              {count > 0 && count < total && `Continue! Faltam ${total - count} módulos para completar o treinamento.`}
              {count === total && '🎉 Parabéns! Você concluiu o treinamento completo do ERP.'}
            </p>
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Zerar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
