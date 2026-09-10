import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Plus, Trash2 } from 'lucide-react';
import { useAvailableBalances, useBranchesList, useTransferActions } from '@/hooks/operational/network/useTransfers';
import { AUTO_APPROVAL_LIMIT_UNITS } from '@/services/operational/inventory/transferService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemRow {
  productId: string;
  quantity: number;
}

export function NewTransferDialog({ open, onOpenChange }: Props) {
  const { data: branches = [] } = useBranchesList();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [priority, setPriority] = useState('normal');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ productId: '', quantity: 1 }]);
  const { data: balances = [], isLoading: loadingBalances } = useAvailableBalances(origin || undefined);
  const { createTransfer, isCreating } = useTransferActions();

  const totalUnits = useMemo(() => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0), [items]);

  const reset = () => {
    setOrigin('');
    setDestination('');
    setPriority('normal');
    setReason('');
    setItems([{ productId: '', quantity: 1 }]);
  };

  const handleSubmit = async () => {
    try {
      await createTransfer({
        originUnitId: origin,
        destinationUnitId: destination,
        priority,
        reason,
        items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 0 })),
      });
      reset();
      onOpenChange(false);
    } catch {
      /* feedback já exibido pela mutation */
    }
  };

  const availableFor = (productId: string) =>
    balances.find((b: any) => b.productId === productId)?.available ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transferência</DialogTitle>
          <DialogDescription>
            Envie mercadoria entre lojas, centros de distribuição e fábricas. Acima de {AUTO_APPROVAL_LIMIT_UNITS} unidades a aprovação passa pelo gestor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={origin} onValueChange={(v) => { setOrigin(v); setItems([{ productId: '', quantity: 1 }]); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade de origem" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade de destino" /></SelectTrigger>
                <SelectContent>
                  {branches.filter((b: any) => b.id !== origin).map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: reposição de ruptura" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Produtos</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { productId: '', quantity: 1 }])}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar produto
              </Button>
            </div>

            {!origin && <p className="text-sm text-muted-foreground">Selecione a origem para ver o que há disponível.</p>}
            {origin && !loadingBalances && balances.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum saldo disponível nesta unidade de origem.</p>
            )}

            {origin && balances.length > 0 && items.map((item, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Select
                    value={item.productId}
                    onValueChange={(v) => setItems(items.map((it, i) => (i === idx ? { ...it, productId: v } : it)))}
                  >
                    <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
                    <SelectContent>
                      {balances.map((b: any) => (
                        <SelectItem key={b.productId} value={b.productId}>
                          {b.code ? `${b.code} — ` : ''}{b.name} (disp. {b.available})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.productId && item.quantity > availableFor(item.productId) && (
                    <p className="text-xs text-destructive">Quantidade acima do disponível ({availableFor(item.productId)}).</p>
                  )}
                </div>
                <div className="w-24 space-y-1">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setItems(items.map((it, i) => (i === idx ? { ...it, quantity: Number(e.target.value) } : it)))}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                  aria-label="Remover produto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">Total: <strong>{totalUnits}</strong> unidades</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !origin || !destination || totalUnits <= 0 || items.some((i) => !i.productId)}
          >
            {isCreating ? 'Criando...' : 'Criar transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
