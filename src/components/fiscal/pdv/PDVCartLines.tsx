import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { ScrollArea } from '@/ui/base/scroll-area';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/formatters';
import { toSafeNumber } from '@/lib/numericValidation';
import type { CartItem } from './types';

interface Props {
  cart: CartItem[];
  flashId: string | null;
  onUpdateQty: (productId: string, delta: number) => void;
  onSetQty: (productId: string, raw: number) => boolean;
  onSetUnitPrice: (productId: string, raw: number) => boolean;
  onRemove: (productId: string) => void;
}

export function PDVCartLines({ cart, flashId, onUpdateQty, onSetQty, onSetUnitPrice, onRemove }: Props) {
  return (
    <ScrollArea className="flex-1 px-6 pb-4">
      {cart.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl opacity-40">
          <Package className="h-10 w-10 mb-2" />
          <p className="font-semibold text-sm">Nenhum produto adicionado</p>
          <p className="text-xs mt-1">Use busca, leitor ou câmera para incluir itens</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {cart.map((item, idx) => (
            <div
              key={item.productId}
              className={cn(
                'flex items-center gap-3 bg-background p-2.5 rounded-lg border transition-all animate-in slide-in-from-left-2',
                flashId === item.productId ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'hover:border-primary/40',
              )}
            >
              <div className="bg-primary/10 text-primary w-7 h-7 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0">
                {cart.length - idx}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-sm">{item.productName}</div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                  {item.productCode} · {item.unit}
                </div>
              </div>

              <div className="w-24 shrink-0">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">R$</span>
                  <Input
                    type="number" step="0.01" min={0} value={item.unitPrice}
                    onChange={(e) => onSetUnitPrice(item.productId, toSafeNumber(e.target.value))}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-8 pl-7 pr-1 text-right font-bold tabular-nums text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded bg-background" onClick={() => onUpdateQty(item.productId, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number" min={0} step="1" value={item.quantity}
                  onChange={(e) => onSetQty(item.productId, toSafeNumber(e.target.value))}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-7 w-12 px-1 text-center font-bold tabular-nums border-none shadow-none focus-visible:ring-1 bg-background"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded bg-background" onClick={() => onUpdateQty(item.productId, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="w-24 text-right shrink-0">
                <div className="text-[9px] uppercase text-muted-foreground font-bold">Total</div>
                <div className="font-black tabular-nums text-primary text-sm">{formatBRL(item.quantity * item.unitPrice)}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full shrink-0" onClick={() => onRemove(item.productId)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
