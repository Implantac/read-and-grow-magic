import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Separator } from '@/ui/base/separator';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { paymentMethods, type SplitMethod, type SplitPayment } from './types';

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

/**
 * PDVPaymentPanel — painel de pagamento com totais, seleção de parcelas,
 * formas de pagamento (dinheiro, cartão, PIX, voucher, fiado) e divisão (split).
 * Suporta digitação livre por split (vírgula/ponto) para pagamentos parciais.
 */
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
  return (
    <div className="space-y-5 animate-in zoom-in-95">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3 gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar ao resumo
      </Button>

      {/* Status */}
      <div className="rounded-xl bg-background border-2 border-primary/20 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
          <span className="text-lg font-bold tabular-nums">{formatBRL(total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Pago</span>
          <span className="text-lg font-bold tabular-nums text-emerald-600">{formatBRL(paidTotal)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-end">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            {remaining > 0 ? 'Restante' : change > 0 ? 'Troco' : 'Pago integralmente'}
          </span>
          <span className={cn(
            'text-2xl font-black tabular-nums',
            remaining > 0 ? 'text-primary' : 'text-emerald-600',
          )}>
            {remaining > 0 ? formatBRL(remaining) : formatBRL(change)}
          </span>
        </div>
        {remaining > 0 && total > 0 && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (paidTotal / total) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Installments */}
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Parcelas (crédito)</Label>
        <div className="grid grid-cols-6 gap-1">
          {[1, 2, 3, 4, 6, 12].map((n) => (
            <button
              key={n}
              onClick={() => onInstallmentsChange(n)}
              className={cn(
                'h-9 rounded text-xs font-bold border-2 transition-all',
                installments === n ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:border-primary/40',
              )}
            >{n}x</button>
          ))}
        </div>
      </div>

      {/* Methods */}
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Formas de pagamento</Label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((pm) => {
            const Icon = pm.icon;
            return (
              <button
                key={pm.value}
                disabled={remaining <= 0}
                onClick={() => onAddSplit(pm.value)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left group',
                  remaining <= 0 ? 'opacity-40 cursor-not-allowed bg-background' : `bg-background hover:${pm.color}`,
                )}
              >
                <div className={cn('p-1.5 rounded', pm.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs uppercase">{pm.label}</div>
                  <div className="text-[9px] text-muted-foreground font-bold">{pm.hint}</div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Splits */}
      {splits.length > 0 && (
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pagamentos aplicados</Label>
          <div className="space-y-1.5">
            {splits.map((s) => {
              const meta = paymentMethods.find((pm) => pm.value === s.method)!;
              const Icon = meta.icon;
              return (
                <div key={s.id} className="flex items-center gap-2 bg-background p-2 rounded-lg border">
                  <div className={cn('p-1.5 rounded', meta.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xs">{meta.label}{s.installments && s.installments > 1 ? ` · ${s.installments}x` : ''}</div>
                    {s.method === 'credit_card' && s.installments && s.installments > 1 && (
                      <div className="text-[9px] text-muted-foreground">{formatBRL(s.amount / s.installments)} / parcela</div>
                    )}
                  </div>
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={(splitDrafts[s.id] ?? (s.amount ? s.amount.toFixed(2) : '')).replace('.', ',')}
                      onChange={(e) => onSplitAmountChange(s.id, e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onBlur={() => onCommitSplitAmount(s.id)}
                      placeholder="0,00"
                      className="h-8 pl-7 pr-1 text-right font-bold tabular-nums text-xs"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveSplit(s.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
