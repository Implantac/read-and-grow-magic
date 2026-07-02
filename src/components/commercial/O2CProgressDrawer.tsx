import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/ui/base/sheet';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { CheckCircle2, XCircle, Loader2, MinusCircle, Circle } from 'lucide-react';
import type { O2CStepEvent, O2CStepKey, O2CStepStatus } from '@/hooks/commercial/useO2COrchestrator';

const STEP_LABEL: Record<O2CStepKey, string> = {
  credit: 'Análise de Crédito',
  fiscal: 'Regras Fiscais',
  sefaz: 'Emissão NF-e (SEFAZ)',
  picking: 'Separação (WMS)',
  notify: 'Notificação ao Cliente',
};

function stepIcon(status: O2CStepStatus | 'pending') {
  switch (status) {
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case 'ok':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'skipped':
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  events: O2CStepEvent[];
  stepOrder: O2CStepKey[];
  running: boolean;
  error: string | null;
}

export function O2CProgressDrawer({ open, onOpenChange, orderId, events, stepOrder, running, error }: Props) {
  // último status por etapa
  const lastByStep = new Map<O2CStepKey, O2CStepEvent>();
  for (const ev of events) lastByStep.set(ev.step, ev);

  const done = stepOrder.filter((s) => {
    const st = lastByStep.get(s)?.status;
    return st === 'ok' || st === 'skipped' || st === 'failed';
  }).length;
  const percent = Math.round((done / stepOrder.length) * 100);
  const failed = events.find((e) => e.status === 'failed');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Order-to-Cash
            {running && <Badge variant="secondary">Em execução</Badge>}
            {!running && !failed && done === stepOrder.length && (
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Concluído</Badge>
            )}
            {failed && <Badge variant="destructive">Falha</Badge>}
          </SheetTitle>
          <SheetDescription>
            {orderId ? `Pedido ${orderId.slice(0, 8)}` : 'Nenhum pedido selecionado'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Progress value={percent} />

          <ol className="space-y-3">
            {stepOrder.map((step) => {
              const ev = lastByStep.get(step);
              const status = (ev?.status ?? 'pending') as O2CStepStatus | 'pending';
              return (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 p-3"
                >
                  <div className="mt-0.5">{stepIcon(status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{STEP_LABEL[step]}</div>
                    {ev?.message && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{ev.message}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
