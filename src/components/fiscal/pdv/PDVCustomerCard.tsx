import { User, UserCheck, Star, HandCoins } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { formatBRL } from '@/lib/formatters';
import type { DbClient } from '@/hooks/commercial/useClients';
import { maskDoc } from './types';

interface Props {
  customer: DbClient | null;
  customerDocument: string;
  loyaltyPoints: number;
  availableCredit: number;
  onClear: () => void;
  onDocumentChange: (v: string) => void;
  onOpenPicker: () => void;
}

/**
 * PDVCustomerCard — bloco lateral do PDV com dados do cliente identificado,
 * pontuação de fidelidade e crédito disponível para fiado.
 */
export function PDVCustomerCard({
  customer,
  customerDocument,
  loyaltyPoints,
  availableCredit,
  onClear,
  onDocumentChange,
  onOpenPicker,
}: Props) {
  return (
    <div className="rounded-xl bg-background border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Cliente</Label>
        {customer && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onClear}>
            Remover
          </Button>
        )}
      </div>

      {customer ? (
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{customer.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{maskDoc(customer.document || '')}</div>
            </div>
            {customer.abc_classification && (
              <Badge variant="secondary" className="text-[9px] h-5">Cliente {customer.abc_classification}</Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground">Ticket médio</div>
              <div className="text-xs font-bold tabular-nums">{formatBRL(customer.avg_ticket || 0)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground">Compras</div>
              <div className="text-xs font-bold tabular-nums">{customer.total_purchases || 0}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" />Pontos
              </div>
              <div className="text-xs font-bold tabular-nums text-amber-600">+{loyaltyPoints}</div>
            </div>
          </div>
          {(customer.credit_limit || 0) > 0 && (
            <div className="mt-2 rounded-md bg-rose-500/5 border border-rose-500/20 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 uppercase tracking-widest">
                <HandCoins className="h-3 w-3" /> Crédito p/ fiado
              </div>
              <div className="text-xs font-black tabular-nums text-rose-700">{formatBRL(availableCredit)}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <Button variant="outline" className="w-full h-11 gap-2" onClick={onOpenPicker}>
            <User className="h-4 w-4" /> Identificar cliente
          </Button>
          <div className="grid gap-2">
            <Input
              placeholder="CPF/CNPJ no cupom (opcional)"
              value={customerDocument}
              onChange={(e) => onDocumentChange(maskDoc(e.target.value))}
              className="h-10 bg-background"
            />
          </div>
        </>
      )}
    </div>
  );
}
