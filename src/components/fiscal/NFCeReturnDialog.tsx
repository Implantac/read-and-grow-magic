import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Label } from '@/ui/base/label';
import { Input } from '@/ui/base/input';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { supabase } from '@/integrations/supabase/client';
import { formatBRL } from '@/lib/formatters';
import { Undo2 } from 'lucide-react';
import type { NFCe } from '@/types/fiscal';

interface ReturnedMap { [nfceItemId: string]: number }

interface Props {
  nfce: NFCe | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (payload: {
    reason: string;
    refundMethod: string;
    items: { nfceItemId: string; productId?: string | null; productCode?: string; productName?: string; quantity: number; unitPrice: number }[];
  }) => Promise<unknown>;
}

const refundMethods = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Estorno Crédito' },
  { value: 'debit_card', label: 'Estorno Débito' },
  { value: 'store_credit', label: 'Crédito em loja' },
];

export function NFCeReturnDialog({ nfce, open, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [alreadyReturned, setAlreadyReturned] = useState<ReturnedMap>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !nfce) return;
    setReason('');
    setRefundMethod('cash');
    setQty({});
    (async () => {
      const { data } = await (supabase.from('nfce_returns' as any) as any)
        .select('id, status')
        .eq('nfce_id', nfce.id)
        .eq('status', 'authorized');
      const ids = (data || []).map((r: any) => r.id);
      if (ids.length === 0) { setAlreadyReturned({}); return; }
      const { data: its } = await (supabase.from('nfce_return_items' as any) as any)
        .select('nfce_item_id, quantity')
        .in('return_id', ids);
      const map: ReturnedMap = {};
      (its || []).forEach((it: any) => {
        if (!it.nfce_item_id) return;
        map[it.nfce_item_id] = (map[it.nfce_item_id] || 0) + Number(it.quantity || 0);
      });
      setAlreadyReturned(map);
    })();
  }, [open, nfce]);

  const remainingByItem = useMemo(() => {
    const m: Record<string, number> = {};
    (nfce?.items || []).forEach((i) => {
      m[i.id] = Math.max(0, i.quantity - (alreadyReturned[i.id] || 0));
    });
    return m;
  }, [nfce, alreadyReturned]);

  const total = useMemo(() => {
    if (!nfce) return 0;
    return nfce.items.reduce((s, i) => s + (qty[i.id] || 0) * i.unitPrice, 0);
  }, [nfce, qty]);

  const anyQty = Object.values(qty).some((v) => v > 0);

  const setAllMax = () => {
    if (!nfce) return;
    const next: Record<string, number> = {};
    nfce.items.forEach((i) => { next[i.id] = remainingByItem[i.id] || 0; });
    setQty(next);
  };

  const submit = async () => {
    if (!nfce) return;
    setSaving(true);
    try {
      const items = nfce.items
        .map((i) => ({
          nfceItemId: i.id,
          productId: i.productId,
          productCode: i.productCode,
          productName: i.productName,
          quantity: Math.min(qty[i.id] || 0, remainingByItem[i.id] || 0),
          unitPrice: i.unitPrice,
        }))
        .filter((i) => i.quantity > 0);
      const res = await onConfirm({ reason, refundMethod, items });
      if (res) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" /> Devolução — NFC-e {nfce?.number}
          </DialogTitle>
          <DialogDescription>
            Selecione os itens e quantidades a devolver. O estorno é registrado no caixa e o cupom é marcado como devolução parcial ou total.
          </DialogDescription>
        </DialogHeader>

        {nfce && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total original: <span className="font-semibold text-foreground">{formatBRL(nfce.total)}</span>
              </p>
              <Button variant="outline" size="sm" onClick={setAllMax}>Devolver tudo</Button>
            </div>

            <div className="rounded-lg border max-h-[320px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Vendido</TableHead>
                    <TableHead className="text-right">Já devolv.</TableHead>
                    <TableHead className="text-right">Devolver</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfce.items.map((it) => {
                    const remaining = remainingByItem[it.id] || 0;
                    const cur = qty[it.id] || 0;
                    return (
                      <TableRow key={it.id}>
                        <TableCell>
                          <div className="font-medium">{it.productName}</div>
                          <div className="text-xs text-muted-foreground">{it.productCode} · {formatBRL(it.unitPrice)}</div>
                        </TableCell>
                        <TableCell className="text-right">{it.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{alreadyReturned[it.id] || 0}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            step="0.001"
                            value={cur || ''}
                            onChange={(e) => {
                              const raw = Number(e.target.value || 0);
                              const v = Math.min(Math.max(0, raw), remaining);
                              setQty((prev) => ({ ...prev, [it.id]: v }));
                            }}
                            className="ml-auto h-8 w-24 text-right"
                            disabled={remaining <= 0}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatBRL(cur * it.unitPrice)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Forma de reembolso</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {refundMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total a reembolsar</Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-lg font-bold text-primary">
                  {formatBRL(total)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-reason">Motivo da devolução</Label>
              <Textarea
                id="return-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: Produto com defeito, cliente desistiu, troca por tamanho..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving || !anyQty || reason.trim().length < 5}
          >
            {saving ? 'Registrando...' : 'Confirmar devolução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
