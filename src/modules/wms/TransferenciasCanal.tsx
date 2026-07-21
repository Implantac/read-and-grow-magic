import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import { ArrowRightLeft, Plus, Check, X, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBranches } from '@/hooks/useBranches';
import { useProducts } from '@/hooks/inventory/useProducts';
import {
  useTransferenciasCanal,
  useCreateTransferenciaCanal,
  useConfirmTransferenciaCanal,
  useCancelTransferenciaCanal,
  type TransferenciaCanalItem,
} from '@/hooks/wms/useTransferenciasCanal';
import type { CanalOperacional } from '@/stores/useCanalStore';

const CANAL_BADGE: Record<CanalOperacional, { label: string; variant: 'default' | 'secondary' }> = {
  VAREJO_PDV: { label: 'Varejo (PDV)', variant: 'secondary' },
  ATACADO_INDUSTRIA: { label: 'Indústria/Atacado', variant: 'default' },
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  em_transito: { label: 'Em trânsito', variant: 'secondary' },
  recebido: { label: 'Recebido', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
};

export default function TransferenciasCanal() {
  const { data: transfers = [], isLoading } = useTransferenciasCanal();
  const { data: branches = [] } = useBranches();
  const confirmM = useConfirmTransferenciaCanal();
  const cancelM = useCancelTransferenciaCanal();

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—';

  return (
    <PageContainer>
      <PageHeader
        title="Transferências entre Canais"
        description="Documento formal que move estoque entre filiais e canais (Varejo ↔ Indústria/Atacado)."
      >
        <NewTransferDialog />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Últimas transferências
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
          ) : transfers.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="Nenhuma transferência registrada"
              description="Crie a primeira transferência para mover estoque entre canais."
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => {
                    const st = STATUS_BADGE[t.status] ?? { label: t.status, variant: 'outline' as const };
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.numero}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(t.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{branchName(t.origem_branch_id)}</div>
                          <Badge variant={CANAL_BADGE[t.canal_origem].variant} className="text-[10px]">
                            {CANAL_BADGE[t.canal_origem].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{branchName(t.destino_branch_id)}</div>
                          <Badge variant={CANAL_BADGE[t.canal_destino].variant} className="text-[10px]">
                            {CANAL_BADGE[t.canal_destino].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.canal_origem === t.canal_destino ? 'Mesmo canal' : 'Entre canais'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {t.status === 'pendente' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => confirmM.mutate(t.id)}
                                disabled={confirmM.isPending}
                                className="gap-1"
                              >
                                <Check className="h-3 w-3" /> Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelM.mutate(t.id)}
                                disabled={cancelM.isPending}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" /> Cancelar
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function NewTransferDialog() {
  const { data: branches = [] } = useBranches();
  const { data: products = [] } = useProducts();
  const create = useCreateTransferenciaCanal();

  const [open, setOpen] = useState(false);
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [obs, setObs] = useState('');
  const [items, setItems] = useState<TransferenciaCanalItem[]>([]);
  const [pickProduct, setPickProduct] = useState('');
  const [pickQty, setPickQty] = useState('1');

  const origemBranch = branches.find((b) => b.id === origem);
  const destinoBranch = branches.find((b) => b.id === destino);

  const canSubmit = origem && destino && origem !== destino && items.length > 0;

  const addItem = () => {
    const qty = Number(pickQty.replace(',', '.'));
    if (!pickProduct || !qty || qty <= 0) return;
    if (items.some((i) => i.product_id === pickProduct)) return;
    setItems((prev) => [...prev, { product_id: pickProduct, quantidade: qty }]);
    setPickProduct('');
    setPickQty('1');
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.product_id !== id));

  const productName = (id: string) => {
    const p = products.find((x: any) => x.id === id);
    return p ? `${p.code} — ${p.name}` : id;
  };

  const submit = () => {
    if (!canSubmit || !origemBranch || !destinoBranch) return;
    create.mutate(
      {
        origem_branch_id: origem,
        destino_branch_id: destino,
        canal_origem: origemBranch.canal_padrao,
        canal_destino: destinoBranch.canal_padrao,
        observacoes: obs || undefined,
        itens: items,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setOrigem(''); setDestino(''); setObs(''); setItems([]);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova transferência
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova transferência entre canais</DialogTitle>
          <DialogDescription>
            Movimenta estoque de uma filial/canal para outro. Ao confirmar, o sistema debita a origem e credita o destino.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Filial de origem</Label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {branches.filter((b) => b.active !== false).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · <span className="text-muted-foreground">{b.canal_padrao}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Filial de destino</Label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {branches.filter((b) => b.active !== false && b.id !== origem).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · <span className="text-muted-foreground">{b.canal_padrao}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> Itens
            </div>
            <div className="flex gap-2">
              <Select value={pickProduct} onValueChange={setPickProduct}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Produto" /></SelectTrigger>
                <SelectContent>
                  {products.slice(0, 200).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="0.001"
                className="w-24"
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
                placeholder="Qtd"
              />
              <Button type="button" variant="outline" onClick={addItem}>Adicionar</Button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum item adicionado.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {items.map((i) => (
                  <li key={i.product_id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1">
                    <span className="truncate">{productName(i.product_id)}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{i.quantidade}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i.product_id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending}>
            {create.isPending ? 'Criando…' : 'Criar transferência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
