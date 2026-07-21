import { ArrowDownLeft, ArrowUpRight, Unlock } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface OpenSessionDialogProps {
  open: boolean;
  openingAmount: number;
  onChangeAmount: (v: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PDVOpenSessionDialog({
  open, openingAmount, onChangeAmount, onCancel, onConfirm,
}: OpenSessionDialogProps) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}
    >
      <div
        className="bg-background border-2 rounded-2xl p-6 w-96 space-y-4 shadow-2xl"
        role="dialog"
        aria-label="Abertura de caixa"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg"><Unlock className="h-5 w-5" /></div>
          <div>
            <h3 className="font-black text-lg">Abertura de caixa</h3>
            <p className="text-xs text-muted-foreground">Informe o troco inicial em dinheiro.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground">Valor de abertura</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={openingAmount ? openingAmount.toFixed(2).replace('.', ',') : ''}
              onChange={(e) => {
                const cleaned = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                const n = Number(cleaned);
                onChangeAmount(Number.isFinite(n) && n >= 0 ? n : 0);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(); } }}
              placeholder="0,00"
              className="pl-10 h-12 text-lg font-bold tabular-nums"
              autoFocus
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm} className="gap-2"><Unlock className="h-4 w-4" /> Abrir caixa</Button>
        </div>
      </div>
    </div>
  );
}

interface CashMovementDialogProps {
  type: 'sangria' | 'suprimento' | null;
  cashBalance: number;
  amount: number;
  note: string;
  onChangeAmount: (v: number) => void;
  onChangeNote: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PDVCashMovementDialog({
  type, cashBalance, amount, note, onChangeAmount, onChangeNote, onCancel, onConfirm,
}: CashMovementDialogProps) {
  if (!type) return null;
  return (
    <div
      className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}
    >
      <div
        className="bg-background border-2 rounded-2xl p-6 w-96 space-y-4 shadow-2xl"
        role="dialog"
        aria-label={type === 'sangria' ? 'Sangria' : 'Suprimento'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-lg', type === 'sangria' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600')}>
            {type === 'sangria' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-black text-lg capitalize">{type}</h3>
            <p className="text-xs text-muted-foreground">
              {type === 'sangria' ? 'Retirar dinheiro do caixa' : 'Adicionar dinheiro ao caixa'}
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase">Saldo atual</span>
          <span className="font-black tabular-nums text-primary">{formatBRL(cashBalance)}</span>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground">Valor</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={amount ? amount.toFixed(2).replace('.', ',') : ''}
              onChange={(e) => {
                const cleaned = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                const n = Number(cleaned);
                onChangeAmount(Number.isFinite(n) && n >= 0 ? n : 0);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(); } }}
              placeholder="0,00"
              className="pl-10 h-12 text-lg font-bold tabular-nums"
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground">Observação (opcional)</Label>
          <Input value={note} onChange={(e) => onChangeNote(e.target.value)} placeholder="Motivo da movimentação" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
}
