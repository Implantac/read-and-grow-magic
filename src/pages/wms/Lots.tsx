import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Plus, Layers } from 'lucide-react';
import { useWMSLots } from '@/hooks/useWMSLots';
import { ExportButton } from '@/components/shared/ExportButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'outline',
  reserved: 'default',
  consumed: 'secondary',
  expired: 'destructive',
  blocked: 'destructive',
};

export default function LotsPage() {
  const { lots, loading, create } = useWMSLots();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newLot, setNewLot] = useState({
    lot_number: '', product_code: '', product_name: '',
    supplier: '', quantity: 0, origin: 'purchase',
    manufacture_date: '', expiration_date: '', location: '',
  });

  const filteredLots = lots.filter(l => {
    const matchesSearch = l.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return '-'; }
  };

  const handleCreate = async () => {
    if (!newLot.lot_number || !newLot.product_code) return;
    await create(newLot);
    setCreateOpen(false);
    setNewLot({ lot_number: '', product_code: '', product_name: '', supplier: '', quantity: 0, origin: 'purchase', manufacture_date: '', expiration_date: '', location: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Lotes</h1>
          <p className="text-muted-foreground">Rastreabilidade completa por lote de produto</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Lote</Button>
          <ExportButton
            data={filteredLots as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'lotNumber', label: 'Lote' },
              { key: 'productCode', label: 'Código' },
              { key: 'productName', label: 'Produto' },
              { key: 'quantity', label: 'Quantidade' },
              { key: 'remainingQty', label: 'Restante' },
              { key: 'status', label: 'Status' },
            ]}
            filename="lotes_wms"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{lots.filter(l => l.status === 'available').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
            <Package className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lots.filter(l => {
                if (!l.expirationDate) return false;
                const diff = (new Date(l.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                return diff > 0 && diff <= 30;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{lots.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por lote, código ou produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="reserved">Reservado</SelectItem>
                <SelectItem value="consumed">Consumido</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Lotes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Qtd Original</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-mono font-medium">{lot.lotNumber}</TableCell>
                    <TableCell>{lot.productCode}</TableCell>
                    <TableCell>{lot.productName}</TableCell>
                    <TableCell>{lot.supplier || '-'}</TableCell>
                    <TableCell>{lot.quantity}</TableCell>
                    <TableCell className={lot.remainingQty === 0 ? 'text-muted-foreground' : 'font-semibold'}>{lot.remainingQty}</TableCell>
                    <TableCell>{formatDate(lot.expirationDate)}</TableCell>
                    <TableCell>{lot.location || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lot.origin === 'purchase' ? 'Compra' : lot.origin === 'production' ? 'Produção' : lot.origin}</Badge>
                    </TableCell>
                    <TableCell><Badge variant={statusColors[lot.status] || 'secondary'}>{lot.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {filteredLots.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum lote encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Lote</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nº Lote *</Label><Input value={newLot.lot_number} onChange={e => setNewLot(p => ({ ...p, lot_number: e.target.value }))} /></div>
              <div><Label>Código Produto *</Label><Input value={newLot.product_code} onChange={e => setNewLot(p => ({ ...p, product_code: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Nome Produto</Label><Input value={newLot.product_name} onChange={e => setNewLot(p => ({ ...p, product_name: e.target.value }))} /></div>
              <div><Label>Fornecedor</Label><Input value={newLot.supplier} onChange={e => setNewLot(p => ({ ...p, supplier: e.target.value }))} /></div>
              <div><Label>Quantidade</Label><Input type="number" value={newLot.quantity || ''} onChange={e => setNewLot(p => ({ ...p, quantity: Number(e.target.value) }))} /></div>
              <div><Label>Data Fabricação</Label><Input type="date" value={newLot.manufacture_date} onChange={e => setNewLot(p => ({ ...p, manufacture_date: e.target.value }))} /></div>
              <div><Label>Validade</Label><Input type="date" value={newLot.expiration_date} onChange={e => setNewLot(p => ({ ...p, expiration_date: e.target.value }))} /></div>
              <div><Label>Localização</Label><Input value={newLot.location} onChange={e => setNewLot(p => ({ ...p, location: e.target.value }))} /></div>
              <div>
                <Label>Origem</Label>
                <Select value={newLot.origin} onValueChange={v => setNewLot(p => ({ ...p, origin: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Lote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
