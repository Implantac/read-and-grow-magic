import { Card, CardContent } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Radio, Tag, Activity, AlertTriangle, WifiOff, Zap } from 'lucide-react';

interface Props {
  loading: boolean;
  summary: { totalReaders: number; activeReaders: number; totalTags: number; activeTags: number; eventsToday: number; unprocessedEvents: number };
  tagAlertsCount: number;
  offlineReadersCount: number;
}

export function KPICards({ loading, summary, tagAlertsCount, offlineReadersCount }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16 mb-1" /><Skeleton className="h-3 w-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const procRate = summary.eventsToday > 0
    ? Math.round(((summary.eventsToday - summary.unprocessedEvents) / summary.eventsToday) * 100)
    : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1"><Radio className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-muted-foreground">Leitores</span></div>
          <p className="text-2xl font-bold tabular-nums">{summary.totalReaders}</p>
          <p className="text-xs text-muted-foreground">{summary.activeReaders} ativos</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[hsl(142_76%_36%)]">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1"><Tag className="h-4 w-4 text-[hsl(142,76%,36%)]" /><span className="text-xs font-medium text-muted-foreground">Tags</span></div>
          <p className="text-2xl font-bold tabular-nums">{summary.totalTags}</p>
          <p className="text-xs text-muted-foreground">{summary.activeTags} ativas</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[hsl(199_89%_48%)]">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1"><Activity className="h-4 w-4 text-[hsl(199,89%,48%)]" /><span className="text-xs font-medium text-muted-foreground">Eventos Hoje</span></div>
          <p className="text-2xl font-bold tabular-nums">{summary.eventsToday}</p>
          <p className="text-xs text-muted-foreground">{summary.unprocessedEvents} pendentes</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[hsl(45_93%_47%)]">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-[hsl(45,93%,47%)]" /><span className="text-xs font-medium text-muted-foreground">Alertas Tags</span></div>
          <p className="text-2xl font-bold tabular-nums">{tagAlertsCount}</p>
          <p className="text-xs text-muted-foreground">perdidas/inativas</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-destructive">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1"><WifiOff className="h-4 w-4 text-destructive" /><span className="text-xs font-medium text-muted-foreground">Offline</span></div>
          <p className="text-2xl font-bold tabular-nums">{offlineReadersCount}</p>
          <p className="text-xs text-muted-foreground">leitores sem sinal</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[hsl(262_83%_58%)]">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-[hsl(262,83%,58%)]" /><span className="text-xs font-medium text-muted-foreground">Taxa Proc.</span></div>
          <p className="text-2xl font-bold tabular-nums">{procRate}%</p>
          <p className="text-xs text-muted-foreground">processamento</p>
        </CardContent>
      </Card>
    </div>
  );
}
