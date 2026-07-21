import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BrainHistoryProps {
  runs: any[];
}

export function BrainHistory({ runs }: BrainHistoryProps) {
  return (
    <div className="space-y-2">
      {runs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma execução registrada ainda.
          </CardContent>
        </Card>
      )}
      {runs.map((r) => (
        <Card key={r.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              'h-2 w-2 rounded-full shrink-0',
              r.status === 'completed' && 'bg-emerald-500',
              r.status === 'failed' && 'bg-destructive',
              r.status === 'running' && 'bg-amber-500 animate-pulse',
            )} />
            <Badge variant="outline" className="text-[10px] uppercase shrink-0">{r.mode}</Badge>
            <div className="flex-1 text-sm truncate text-muted-foreground">{r.synthesis || '—'}</div>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{r.decisions_count} dec.</span>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {r.created_at ? format(new Date(r.created_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
