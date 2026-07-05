import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { useReturnItems, useDisposeReturnItem, Disposition } from '@/hooks/wms/useReturnItems';
import { Loader2, PackageCheck } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  returnId: string | null;
  returnNumber?: string;
}

const DISPOSITIONS: { value: Disposition; label: string; tone: string }[] = [
  { value: 'restock', label: 'Retornar ao estoque', tone: 'bg-emerald-500/15 text-emerald-700' },
  { value: 'quarantine', label: 'Quarentena (QA)', tone: 'bg-amber-500/15 text-amber-700' },
  { value: 'rework', label: 'Retrabalho', tone: 'bg-blue-500/15 text-blue-700' },
  { value: 'return_supplier', label: 'Devolver fornecedor', tone: 'bg-violet-500/15 text-violet-700' },
  { value: 'scrap', label: 'Sucata', tone: 'bg-rose-500/15 text-rose-700' },
];

export function ReturnItemsDialog({ open, onOpenChange, returnId, returnNumber }: Props) {
  const { data: items = [], isLoading } = useReturnItems(returnId);
  const dispose = useDisposeReturnItem(returnId);
  const [drafts, setDrafts] = useState<Record<string, { disposition?: Disposition; notes?: string }>>({});

  const setDraft = (id: string, patch: Partial<{ disposition: Disposition; notes: string }>) =>
    setDrafts((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Itens da devolução {returnNumber ?? ''}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Nenhum item cadastrado"
            description="Esta devolução ainda não possui itens registrados para tratamento."
          />
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const draft = drafts[it.id] ?? {};
              const processed = it.status === 'processed';
              return (
                <div key={it.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{it.product_name ?? it.product_sku ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.product_sku && <>SKU {it.product_sku} · </>}
                        Qtd <strong>{it.quantity}</strong> {it.unit ?? 'UN'}
                      </div>
                    </div>
                    <Badge variant={processed ? 'default' : 'outline'}>
                      {processed ? `Processado · ${it.disposition}` : 'Pendente'}
                    </Badge>
                  </div>

                  {!processed && (
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <Select
                        value={draft.disposition}
                        onValueChange={(v) => setDraft(it.id, { disposition: v as Disposition })}
                      >
                        <SelectTrigger><SelectValue placeholder="Disposição" /></SelectTrigger>
                        <SelectContent>
                          {DISPOSITIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Notas de inspeção (opcional)"
                        value={draft.notes ?? ''}
                        onChange={(e) => setDraft(it.id, { notes: e.target.value })}
                        rows={1}
                      />
                      <Button
                        disabled={!draft.disposition || dispose.isPending}
                        onClick={() =>
                          dispose.mutate({
                            itemId: it.id,
                            disposition: draft.disposition!,
                            notes: draft.notes,
                          })
                        }
                      >
                        Aplicar
                      </Button>
                    </div>
                  )}

                  {processed && it.inspection_notes && (
                    <p className="text-xs text-muted-foreground italic">"{it.inspection_notes}"</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
