import { ArrowLeft, Plus, Trash2, Hash } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Separator } from '@/ui/base/separator';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { paymentMethods, type SplitMethod, type SplitPayment } from './types';
import { PDVNumericPad } from './PDVNumericPad';
import { useState } from 'react';

interface Props {
  total: number;
  paidTotal: number;
  remaining: number;
  change: number;
  splits: SplitPayment[];
  splitDrafts: Record<string, string>;
  installments: number;
  onBack: () => void;
  onInstallmentsChange: (n: number) => void;
  onAddSplit: (method: SplitMethod) => void;
  onSplitAmountChange: (id: string, text: string) => void;
  onCommitSplitAmount: (id: string) => void;
  onRemoveSplit: (id: string) => void;
}

export function PDVPaymentPanel({
  total,
  paidTotal,
  remaining,
  change,
  splits,
  splitDrafts,
  installments,
  onBack,
  onInstallmentsChange,
  onAddSplit,
  onSplitAmountChange,
  onCommitSplitAmount,
  onRemoveSplit,
}: Props) {
  const [activeSplitId, setActiveSplitId] = useState<string | null>(null);

  return (
    <div className="space-y-5 animate-in zoom-in-95">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3 gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao resumo
      </Button>

      {/* Status */}
      <div className="rounded-xl bg-background border-2 border-primary/20 p-4 space-y-2 shadow-xl shadow-primary/5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total da Venda</span>
          <span className="text-lg font-bold tabular-nums">{formatBRL(total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Recebido</span>
          <span className="text-lg font-bold tabular-nums text-emerald-600">{formatBRL(paidTotal)}</span>
        </div>
        <Separator className="bg-primary/10" />
        <div className="flex justify-between items-end">
          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
            {remaining > 0.001 ? 'Valor Restante' : change > 0.001 ? 'Troco a Devolver' : 'Venda Quitada'}
          </span>
          <div className="text-right">
            <span className={cn(
              'text-3xl font-black tabular-nums tracking-tighter transition-all',
              remaining > 0.001 ? 'text-primary' : 'text-emerald-600 animate-pulse',
            )}>
              {remaining > 0.001 ? formatBRL(remaining) : formatBRL(change)}
            </span>
          </div>
        </div>
        {remaining > 0.001 && total > 0 && (
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
              style={{ width: `${Math.min(100, (paidTotal / total) * 100)}%` }} 
            />
          </div>
        )}
      </div>

      {/* Installments */}
      <div className="space-y-2 bg-muted/20 p-3 rounded-lg border">
        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Parcelas (Crédito)</Label>
        <div className="grid grid-cols-6 gap-1">
          {[1, 2, 3, 4, 6, 12].map((n) => (
            <button
              key={n}
              onClick={() => onInstallmentsChange(n)}
              className={cn(
                'h-9 rounded text-xs font-bold border-2 transition-all',
                installments === n 
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-background hover:border-primary/40 border-transparent',
              )}
            >{n}x</button>
          ))}
        </div>
      </div>

      {/* Methods */}
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Formas de Pagamento</Label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((pm) => {
            const Icon = pm.icon;
            const isDisabled = remaining <= 0.001;
            return (
              <button
                key={pm.value}
                disabled={isDisabled}
                onClick={() => onAddSplit(pm.value)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden group',
                  isDisabled 
                    ? 'opacity-40 cursor-not-allowed bg-muted/50 border-transparent' 
                    : `bg-background border-transparent hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5`,
                )}
              >
                <div className={cn('p-2 rounded-lg transition-transform group-hover:scale-110', pm.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs uppercase tracking-tight">{pm.label}</div>
                  <div className="text-[9px] text-muted-foreground font-bold tracking-widest">{pm.hint}</div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Splits */}
      {splits.length > 0 && (
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pagamentos Aplicados</Label>
          <div className="space-y-2">
            {splits.map((s) => {
              const meta = paymentMethods.find((pm) => pm.value === s.method)!;
              const Icon = meta.icon;
              const isActive = activeSplitId === s.id;

              return (
                <div key={s.id} className={cn(
                  "flex flex-col gap-2 bg-background p-2.5 rounded-xl border transition-all",
                  isActive ? "ring-2 ring-primary border-primary shadow-xl" : "hover:border-primary/30"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-xs uppercase tracking-tight">
                        {meta.label}{s.installments && s.installments > 1 ? ` · ${s.installments}x` : ''}
                      </div>
                      {s.method === 'credit_card' && s.installments && s.installments > 1 && (
                        <div className="text-[9px] text-muted-foreground font-bold">{formatBRL(s.amount / s.installments)} por parcela</div>
                      )}
                    </div>
                    <div className="relative w-32 group/input">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">R$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={(splitDrafts[s.id] ?? (s.amount ? s.amount.toFixed(2) : '')).replace('.', ',')}
                        onChange={(e) => onSplitAmountChange(s.id, e.target.value)}
                        onFocus={(e) => {
                          e.currentTarget.select();
                          setActiveSplitId(s.id);
                        }}
                        onBlur={() => {
                          onCommitSplitAmount(s.id);
                          // Delay to allow clicking on numpad buttons
                          setTimeout(() => {
                            if (document.activeElement?.tagName !== 'BUTTON') {
                              setActiveSplitId(null);
                            }
                          }, 150);
                        }}
                        placeholder="0,00"
                        className="h-10 pl-8 pr-8 text-right font-black tabular-nums text-sm bg-muted/30 border-none focus-visible:ring-0"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-40 hover:opacity-100"
                        onClick={() => setActiveSplitId(isActive ? null : s.id)}
                      >
                        <Hash className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => onRemoveSplit(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isActive && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <Separator className="my-1" />
                      <PDVNumericPad
                        value={(splitDrafts[s.id] ?? (s.amount ? s.amount.toFixed(2) : '')).replace('.', ',')}
                        onChange={(v) => onSplitAmountChange(s.id, v)}
                        onCommit={() => {
                          onCommitSplitAmount(s.id);
                          setActiveSplitId(null);
                        }}
                        onClear={() => onSplitAmountChange(s.id, '')}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

