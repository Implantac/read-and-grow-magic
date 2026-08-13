import { ArrowDownLeft, ArrowUpRight, Clock, Lock, Monitor, Unlock, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Separator } from '@/ui/base/separator';
import { DialogClose } from '@/ui/base/dialog';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';

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
  // Simulação de status de rede para UX profissional
  const isOnline = true; 

  return (
    <div className="min-h-16 border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-background/50 p-1.5 rounded-xl border border-primary/10 shadow-inner">
          <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-lg shadow-primary/20">
            <Monitor className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black leading-none mb-1">Terminal ID</div>
            <div className="font-bold text-sm leading-tight flex items-center gap-2">
              PDV-01 
              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase">Loja Matriz</span>
            </div>
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-10 bg-primary/10" />
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn('h-3 w-3 rounded-full', hasSession ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]')} />
            {hasSession && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />}
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black leading-none mb-1">
              {hasSession ? 'Sessão Ativa' : 'Sessão Encerrada'}
            </div>
            <div className="text-xs font-semibold leading-tight flex items-center gap-2">
              {hasSession ? (
                <>
                  <span className="tabular-nums font-black text-primary">{formatBRL(cashBalance)}</span>
                  <span className="text-muted-foreground font-normal">|</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {sessionElapsed}m
                  </span>
                </>
              ) : (
                <span className="text-red-500/80 animate-pulse font-bold">Aguardando Abertura</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TooltipProvider>
          <div className="flex items-center gap-2 mr-2 border-r pr-4 border-primary/10">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", isOnline ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? "Online" : "Offline"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[10px] font-bold">Conectado ao Cloud Gateway (v2.4.0)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {hasSession ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9 px-4 gap-2 border-primary/20 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all font-bold text-xs" onClick={onSuprimento}>
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> Suprimento
            </Button>
            <Button size="sm" variant="outline" className="h-9 px-4 gap-2 border-primary/20 hover:bg-red-500/5 hover:border-red-500/40 transition-all font-bold text-xs" onClick={onSangria}>
              <ArrowUpRight className="h-4 w-4 text-red-600" /> Sangria
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-primary/10" onClick={onLock}>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px] font-bold">Bloquear Terminal (Ctrl+L)</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" variant="ghost" className="h-9 px-4 text-destructive hover:bg-destructive/10 font-bold text-xs uppercase tracking-widest" onClick={onCloseSession}>
              Fechar Caixa
            </Button>
          </div>
        ) : (
          <Button size="sm" className="h-9 px-6 gap-2 font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20" onClick={onOpenSession}>
            <Unlock className="h-4 w-4" /> Abrir Caixa
          </Button>
        )}
        
        <Separator orientation="vertical" className="h-8 mx-1 bg-primary/10" />
        
        <div className="flex items-center gap-3 bg-muted/30 p-1 rounded-full pl-1 pr-4 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-md">OS</div>
          <div className="leading-tight hidden sm:block">
            <div className="font-black text-xs uppercase tracking-tight">Operador Sistema</div>
            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Master Admin</div>
          </div>
        </div>
        
        {!asPage && (
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        )}
      </div>
    </div>
  );
}

