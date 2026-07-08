import { useClientNPSHistory, useClientNPSSummary } from './hooks';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Star, MessageSquare } from 'lucide-react';

/**
 * Painel NPS reutilizável para a ficha do cliente (aba NPS).
 * Uso: <ClientNPSPanel clientId={id} /> — pode ser embutido em qualquer detalhe de cliente.
 */
export function ClientNPSPanel({ clientId }: { clientId: string | null | undefined }) {
  const { data: history, isLoading } = useClientNPSHistory(clientId);
  const summary = useClientNPSSummary(clientId);
  if (isLoading) return <Skeleton className="h-40" />;
  if (!history || history.length === 0) return <p className="text-sm text-muted-foreground">Este cliente ainda não respondeu pesquisas NPS.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Última nota" value={summary.last?.score ?? '—'} accent={npsColor(summary.last?.score ?? 0)} />
        <KPI label="Média" value={summary.avg.toFixed(1)} />
        <KPI label="Respostas" value={summary.total} />
        <KPI label="NPS" value={summary.score} accent={npsColor(summary.score)} />
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Histórico</h4>
        {history.map((a: any) => (
          <Card key={a.id}>
            <CardContent className="pt-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={a.category === 'promoter' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : a.category === 'detractor' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}>{a.score}</Badge>
                  <span className="text-sm font-medium">{a.nps_campaigns?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(a.responded_at).toLocaleString('pt-BR')}</span>
              </div>
              {a.comment && <p className="text-xs text-muted-foreground flex gap-1"><MessageSquare className="h-3 w-3 mt-0.5 shrink-0" /> "{a.comment}"</p>}
              {a.ai_summary && <p className="text-xs italic text-primary flex gap-1"><Star className="h-3 w-3 mt-0.5 shrink-0" /> {a.ai_summary}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <div className="text-xs text-muted-foreground uppercase">{label}</div>
        <div className={`text-2xl font-bold ${accent ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
function npsColor(s: number) {
  if (s >= 9) return 'text-emerald-500';
  if (s >= 7) return 'text-yellow-500';
  return 'text-red-500';
}
