import { ArrowDownLeft, ArrowUpRight, Clock, Lock, Monitor, Unlock, X } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Separator } from '@/ui/base/separator';
import { DialogClose } from '@/ui/base/dialog';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PDVSessionBarProps {
  hasSession: boolean;
  cashBalance: number;
  sessionElapsed: number;
  asPage: boolean;
  onSuprimento: () => void;
  onSangria: () => void;
  onLock: () => void;
  onCloseSession: () => void;
  onOpenSession: () => void;
}

export function PDVSessionBar({
  hasSession, cashBalance, sessionElapsed, asPage,
  onSuprimento, onSangria, onLock, onCloseSession, onOpenSession,
}: PDVSessionBarProps) {
  return (
    <div className="min-h-14 border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-1.5 rounded-md text-primary-foreground">
            <Monitor className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none">Terminal</div>
            <div className="font-black text-sm leading-tight">PDV-01 · Loja Matriz</div>
          </div>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', hasSession ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none">
              {hasSession ? 'Caixa aberto' : 'Caixa fechado'}
            </div>
            <div className="text-xs font-semibold leading-tight">
              {hasSession ? (
                <>Saldo <span className="tabular-nums font-bold text-primary">{formatBRL(cashBalance)}</span> · <Clock className="inline h-3 w-3 -mt-0.5" /> {sessionElapsed}min</>
              ) : 'Abra o caixa para iniciar as vendas'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasSession ? (
          <>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onSuprimento}>
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Suprimento
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onSangria}>
              <ArrowUpRight className="h-3.5 w-3.5 text-red-600" /> Sangria
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={onLock}>
              <Lock className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={onCloseSession}>
              Fechar caixa
            </Button>
          </>
        ) : (
          <Button size="sm" className="h-8 gap-1.5" onClick={onOpenSession}>
            <Unlock className="h-3.5 w-3.5" /> Abrir caixa
          </Button>
        )}
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-2 text-xs">
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">OS</div>
          <div className="leading-tight">
            <div className="font-bold">Operador Sistema</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Caixa</div>
          </div>
        </div>
        {!asPage && (
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        )}
      </div>
    </div>
  );
}
