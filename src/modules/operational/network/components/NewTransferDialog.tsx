import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/ui/base/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/base/popover';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
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
  const { data: branches = [], isLoading: loadingBranches, isError: branchesError, refetch: retryBranches } = useBranchesList();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [priority, setPriority] = useState('normal');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ productId: '', quantity: 1 }]);
  const { data: balances = [], isLoading: loadingBalances, isError: balancesError, refetch: retryBalances } = useAvailableBalances(origin || undefined);
  const [openProductRow, setOpenProductRow] = useState<number | null>(null);
  const { createTransfer, isCreating } = useTransferActions();

  const totalUnits = useMemo(() => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0), [items]);
  const requestedByProduct = useMemo(() => items.reduce<Record<string, number>>((totals, item) => {
    if (item.productId) totals[item.productId] = (totals[item.productId] || 0) + (Number(item.quantity) || 0);
    return totals;
  }, {}), [items]);
  const hasInvalidQuantity = items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0);
  const hasInsufficientStock = items.some((item) => item.productId && requestedByProduct[item.productId] >
    (balances.find((balance) => balance.productId === item.productId)?.available ?? 0));

  const reset = () => {
    setOrigin('');
    setDestination('');
    setPriority('normal');
    setReason('');
    setItems([{ productId: '', quantity: 1 }]);
    setOpenProductRow(null);
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
    balances.find((balance) => balance.productId === productId)?.available ?? 0;

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
              <Select value={origin} onValueChange={(v) => { setOrigin(v); setItems([{ productId: '', quantity: 1 }]); setOpenProductRow(null); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade de origem" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade de destino" /></SelectTrigger>
                <SelectContent>
                  {branches.filter((b) => b.id !== origin).map((b) => (
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
          {loadingBranches && <p className="text-sm text-muted-foreground">Carregando unidades...</p>}
          {branchesError && <div role="alert" className="text-sm text-destructive">Não foi possível consultar as unidades. <Button type="button" variant="link" size="sm" onClick={() => retryBranches()}>Tentar novamente</Button></div>}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Produtos</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { productId: '', quantity: 1 }])}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar produto
              </Button>
            </div>

            {!origin && <p className="text-sm text-muted-foreground">Selecione a origem para ver o que há disponível.</p>}
            {origin && loadingBalances && <p className="text-sm text-muted-foreground">Consultando saldos da origem...</p>}
            {origin && balancesError && <div role="alert" className="text-sm text-destructive">Não foi possível consultar os saldos. <Button type="button" variant="link" size="sm" onClick={() => retryBalances()}>Tentar novamente</Button></div>}
            {origin && !loadingBalances && !balancesError && balances.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum saldo disponível nesta unidade de origem.</p>
            )}

            {origin && !loadingBalances && !balancesError && balances.length > 0 && items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Popover open={openProductRow === idx} onOpenChange={(next) => setOpenProductRow(next ? idx : null)}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" aria-expanded={openProductRow === idx} aria-label={`Produto ${idx + 1}`} className="w-full justify-between font-normal">
                        <span className="truncate">{item.productId ? (() => {
                          const product = balances.find((balance) => balance.productId === item.productId);
                          return product ? `${product.code ? `${product.code} — ` : ''}${product.name}` : 'Selecione um produto';
                        })() : 'Buscar produto por nome ou código'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(86vw,28rem)] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar nome ou código..." aria-label="Buscar produto" />
                        <CommandList>
                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                          <CommandGroup>
                            {balances.map((balance) => (
                              <CommandItem key={balance.productId} value={`${balance.code} ${balance.name}`} onSelect={() => {
                                setItems((current) => current.map((row, i) => i === idx ? { ...row, productId: balance.productId } : row));
                                setOpenProductRow(null);
                              }}>
                                <Check className={`mr-2 h-4 w-4 shrink-0 ${item.productId === balance.productId ? 'opacity-100' : 'opacity-0'}`} />
                                <span className="min-w-0 flex-1 truncate">{balance.code ? `${balance.code} — ` : ''}{balance.name}</span>
                                <span className="ml-2 shrink-0 text-xs text-muted-foreground">{balance.available} disp.</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {item.productId && requestedByProduct[item.productId] > availableFor(item.productId) && (
                    <p role="alert" className="text-xs text-destructive">Solicitado: {requestedByProduct[item.productId]} no total; disponível: {availableFor(item.productId)}.</p>
                  )}
                </div>
                <div className="w-24 space-y-1">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    aria-label={`Quantidade do produto ${idx + 1}`}
                    value={item.quantity}
                    onChange={(e) => setItems(items.map((it, i) => (i === idx ? { ...it, quantity: Number(e.target.value) } : it)))}
                  />
                  {(!Number.isInteger(item.quantity) || item.quantity <= 0) && <p className="text-xs text-destructive">Use um inteiro positivo.</p>}
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
            disabled={isCreating || loadingBranches || branchesError || loadingBalances || balancesError || !origin || !destination || origin === destination || hasInvalidQuantity || hasInsufficientStock || items.some((i) => !i.productId)}
          >
            {isCreating ? 'Criando...' : 'Criar transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
