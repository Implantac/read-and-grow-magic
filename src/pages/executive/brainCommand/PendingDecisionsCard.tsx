import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { ScrollArea } from '@/ui/base/scroll-area';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { impactColor } from './constants';

interface Props {
  pending: any[];
  onApprove: (id: string, approve: boolean) => void;
  approvePending: boolean;
}

export function PendingDecisionsCard({ pending, onApprove, approvePending }: Props) {
  return (
    <Card className="flex flex-col xl:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" /> Decisões Pendentes ({pending.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[480px] pr-3">
          {pending.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">✨ Tudo em ordem.</div>
          )}
          <div className="space-y-3">
            {pending.map((d) => (
              <div key={d.id} className="border-l-2 border-primary/60 pl-3 py-2 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={`${impactColor[d.impact_level]} text-[10px]`}>{d.impact_level.toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">{d.module}</Badge>
                  <span className="text-[10px] text-muted-foreground">conf. {(d.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="text-sm font-semibold">{d.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{d.rationale}</div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" onClick={() => onApprove(d.id, true)} disabled={approvePending} className="h-7 gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onApprove(d.id, false)} disabled={approvePending} className="h-7 gap-1 text-xs">
                    <XCircle className="h-3 w-3" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
