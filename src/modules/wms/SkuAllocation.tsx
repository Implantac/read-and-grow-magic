import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/ui/base/dialog';
import { Package, MapPin, ArrowRightLeft, Plus } from 'lucide-react';

interface Balance {
  id: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  location_id: string | null;
  location_code: string | null;
  quantity: number;
  reserved_qty: number;
  available_qty: number | null;
  unit: string;
  lot_id: string | null;
  lot_number: string | null;
  stock_status: string;
}

interface LocOpt { id: string; code: string; zone_code?: string; warehouse_code?: string }

export default function SkuAllocationPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [locations, setLocations] = useState<LocOpt[]>([]);
  const [products, setProducts] = useState<{ id: string; code: string; name: string; unit: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoc, setFilterLoc] = useState<string>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [b, l, p] = await Promise.all([
      supabase.from('stock_balances').select('id,product_id,product_code,product_name,location_id,location_code,quantity,reserved_qty,available_qty,unit,lot_id,lot_number,stock_status').order('product_code'),
      supabase.from('warehouse_locations').select('id,code,zone:warehouse_zones(code,warehouse:warehouses(code))').eq('active', true).order('code'),
      supabase.from('products').select('id,code,name,unit').eq('status', 'active').order('code').limit(500),
    ]);
    if (b.error) toast.error('Erro ao carregar saldos');
    if (l.error) toast.error('Erro ao carregar endereços');
    setBalances((b.data as Balance[]) || []);
    setLocations(((l.data as any[]) || []).map(x => ({
      id: x.id, code: x.code, zone_code: x.zone?.code, warehouse_code: x.zone?.warehouse?.code,
    })));
    setProducts((p.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => balances.filter(b =>
    (filterLoc === 'all' || b.location_id === filterLoc) &&
    (!search || `${b.product_code} ${b.product_name} ${b.location_code ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  ), [balances, filterLoc, search]);

  const totalSkus = new Set(balances.map(b => b.product_code)).size;
  const totalLocsUsed = new Set(balances.filter(b => b.location_id && Number(b.quantity) > 0).map(b => b.location_id)).size;
  const totalQty = balances.reduce((s, b) => s + Number(b.quantity || 0), 0);

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Alocação de SKUs" description="Saldo por endereço e movimentações atômicas validadas por empresa" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="SKUs alocados" value={totalSkus} icon={Package} index={0} />
        <KPICard title="Endereços ocupados" value={totalLocsUsed} icon={MapPin} index={1} />
        <KPICard title="Qtd. total" value={totalQty.toLocaleString('pt-BR')} icon={Package} index={2} />
        <div className="flex items-end justify-end gap-2">
          <AllocateDialog products={products} locations={locations} mode="in" onDone={load} />
          <MoveDialog balances={balances} locations={locations} onDone={load} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Saldos por endereço</CardTitle>
          <div className="flex gap-2 flex-1 max-w-xl">
            <Input placeholder="Buscar SKU, nome ou endereço..." value={search} onChange={e => setSearch(e.target.value)} />
            <Select value={filterLoc} onValueChange={setFilterLoc}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos endereços</SelectItem>
                {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum saldo encontrado"
              description='Use "Alocar SKU" para posicionar produtos nos endereços do CD.'
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Produto</th>
                    <th className="py-2 pr-3">Endereço</th>
                    <th className="py-2 pr-3">Lote</th>
                    <th className="py-2 pr-3 text-right">Qtd</th>
                    <th className="py-2 pr-3 text-right">Reservado</th>
                    <th className="py-2 pr-3 text-right">Disponível</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="border-b hover:bg-muted/40">
                      <td className="py-2 pr-3 font-mono text-xs">{b.product_code}</td>
                      <td className="py-2 pr-3">{b.product_name}</td>
                      <td className="py-2 pr-3"><Badge variant="outline">{b.location_code || '—'}</Badge></td>
                      <td className="py-2 pr-3 text-xs">{b.lot_number || '—'}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{Number(b.quantity).toLocaleString('pt-BR')} {b.unit}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-amber-500">{Number(b.reserved_qty).toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium">{Number(b.available_qty ?? (b.quantity - b.reserved_qty)).toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-3"><Badge variant={b.stock_status === 'available' ? 'default' : 'secondary'}>{b.stock_status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function AllocateDialog({ products, locations, mode, onDone }: { products: any[]; locations: LocOpt[]; mode: 'in'; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ product_id: '', to_location_id: '', quantity: '', lot_number: '', reason: 'put-away' });

  const submit = async () => {
    const prod = products.find(p => p.id === form.product_id);
    if (!prod || !form.to_location_id || !form.quantity) return toast.error('Preencha todos os campos');
    setBusy(true);
    const { error } = await supabase.rpc('wms_move_stock', {
      p_product_id: prod.id,
      p_product_code: prod.code,
      p_product_name: prod.name,
      p_quantity: Number(form.quantity),
      p_unit: prod.unit || 'UN',
      p_from_location_id: null,
      p_to_location_id: form.to_location_id,
      p_lot_id: null,
      p_lot_number: form.lot_number || null,
      p_reason: form.reason,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('SKU alocado no endereço');
    setOpen(false);
    setForm({ product_id: '', to_location_id: '', quantity: '', lot_number: '', reason: 'put-away' });
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Alocar SKU</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Alocar SKU em Endereço</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Produto *</Label>
            <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o SKU" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Endereço destino *</Label>
            <Select value={form.to_location_id} onValueChange={v => setForm({ ...form, to_location_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o endereço" /></SelectTrigger>
              <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.code}{l.warehouse_code ? ` · ${l.warehouse_code}` : ''}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantidade *</Label><Input type="number" min="0" step="0.001" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
            <div><Label>Lote (opcional)</Label><Input value={form.lot_number} onChange={e => setForm({ ...form, lot_number: e.target.value })} /></div>
          </div>
          <div><Label>Motivo</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>{busy ? 'Alocando...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoveDialog({ balances, locations, onDone }: { balances: Balance[]; locations: LocOpt[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ balance_id: '', to_location_id: '', quantity: '', reason: 'transfer' });

  const selected = balances.find(b => b.id === form.balance_id);

  const submit = async () => {
    if (!selected || !form.to_location_id || !form.quantity) return toast.error('Preencha todos os campos');
    if (Number(form.quantity) > Number(selected.quantity)) return toast.error('Quantidade maior que saldo da origem');
    setBusy(true);
    const { error } = await supabase.rpc('wms_move_stock', {
      p_product_id: selected.product_id,
      p_product_code: selected.product_code,
      p_product_name: selected.product_name,
      p_quantity: Number(form.quantity),
      p_unit: selected.unit,
      p_from_location_id: selected.location_id,
      p_to_location_id: form.to_location_id,
      p_lot_id: selected.lot_id,
      p_lot_number: selected.lot_number,
      p_reason: form.reason,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Movimentação registrada');
    setOpen(false);
    setForm({ balance_id: '', to_location_id: '', quantity: '', reason: 'transfer' });
    onDone();
  };

  const available = balances.filter(b => b.location_id && Number(b.quantity) > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><ArrowRightLeft className="h-4 w-4 mr-1" /> Mover</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Mover SKU entre Endereços</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Saldo de origem *</Label>
            <Select value={form.balance_id} onValueChange={v => setForm({ ...form, balance_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione SKU + endereço" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {available.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.product_code} @ {b.location_code} · {Number(b.quantity)} {b.unit}{b.lot_number ? ` · lote ${b.lot_number}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Endereço destino *</Label>
            <Select value={form.to_location_id} onValueChange={v => setForm({ ...form, to_location_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione destino" /></SelectTrigger>
              <SelectContent>{locations.filter(l => l.id !== selected?.location_id).map(l => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade *{selected ? ` (máx ${selected.quantity})` : ''}</Label>
              <Input type="number" min="0" step="0.001" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div><Label>Motivo</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>{busy ? 'Movendo...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
