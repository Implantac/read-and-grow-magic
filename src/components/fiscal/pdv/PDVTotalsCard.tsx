import { Percent } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Separator } from '@/ui/base/separator';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/formatters';
import { toSafeNumber } from '@/lib/numericValidation';
import { toastError } from '@/lib/toastHelpers';

interface Props {
  subtotal: number;
  discount: number;
  discountType: 'value' | 'percent';
  discountValue: number;
  total: number;
  onChangeDiscount: (v: number) => void;
  onChangeDiscountType: (t: 'value' | 'percent') => void;
}

export function PDVTotalsCard({ subtotal, discount, discountType, discountValue, total, onChangeDiscount, onChangeDiscountType }: Props) {
  return (
    <div className="rounded-xl bg-background border p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground font-bold text-xs uppercase">Subtotal</span>
        <span className="text-lg font-bold tabular-nums">{formatBRL(subtotal)}</span>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-muted-foreground font-bold text-xs uppercase">Desconto</span>
          <div className="inline-flex bg-muted/60 rounded p-0.5">
            <button className={cn('px-2 py-0.5 text-[10px] font-bold rounded', discountType === 'value' ? 'bg-background shadow-sm' : 'text-muted-foreground')} onClick={() => onChangeDiscountType('value')}>R$</button>
            <button className={cn('px-2 py-0.5 text-[10px] font-bold rounded', discountType === 'percent' ? 'bg-background shadow-sm' : 'text-muted-foreground')} onClick={() => onChangeDiscountType('percent')}>%</button>
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
            {discountType === 'value' ? 'R$' : <Percent className="h-3 w-3" />}
          </span>
          <Input
            type="number" min={0} step="0.01" value={discount || ''}
            onChange={(e) => {
              const v = toSafeNumber(e.target.value);
              if (!Number.isFinite(v) || v < 0) { toastError('Desconto inválido.'); return; }
              if (discountType === 'percent' && v > 100) { toastError('Desconto máximo 100%.'); return; }
              if (discountType === 'value' && v > subtotal) { toastError('Desconto maior que subtotal.'); onChangeDiscount(subtotal); return; }
              onChangeDiscount(Math.round(v * 100) / 100);
            }}
            className="text-right font-bold h-10 pl-8 bg-background"
            placeholder="0,00"
          />
        </div>
        {discountValue > 0 && <div className="text-right text-[10px] text-emerald-600 font-bold mt-1">− {formatBRL(discountValue)}</div>}
      </div>
      <Separator />
      <div className="space-y-0.5">
        <div className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Total a pagar</div>
        <div className="text-4xl font-black text-primary tracking-tight tabular-nums leading-none">{formatBRL(total)}</div>
      </div>
    </div>
  );
}
