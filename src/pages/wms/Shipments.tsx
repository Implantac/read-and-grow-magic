import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Truck, Search, MoreHorizontal, PackageCheck, MapPin, Clock, CheckCircle, FileText, Plus } from 'lucide-react';
import { useWMSShipments } from '@/hooks/useWMSShipments';
import { ExportButton } from '@/components/shared/ExportButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  ready: { label: 'Pronto', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'outline' },
  delivered: { label: 'Entregue', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function ShipmentsPage() {
  const { shipments, loading, create, ship, deliver } = useWMSShipments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [newShipment, setNewShipment] = useState({
    customer_name: '', order_number: '', carrier: '',
    volumes: 1, total_weight: 0, total_value: 0,
    shipping_address: '', operator: '',
  });

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try { return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR }); }
    catch { return '-'; }
  };

  const handleCreate = async () => {
    if (!newShipment.customer_name) return;
    await create(newShipment);
    setCreateOpen(false);
    setNewShipment({ customer_name: '', order_number: '', carrier: '', volumes: 1, total_weight: 0, total_value: 0, shipping_address: '', operator: '' });
  };

  const handleShip = async () => {
    await ship(selectedId, trackingNumber);
    setTrackingOpen(false);
    setTrackingNumber('');
  };

  const pendingCount = shipments.filter(s => ['pending', 'ready'].includes(s.status)).length;
  const shippedCount = shipments.filter(s => s.status === 'shipped').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expedição</h1>
          <p className="text-muted-foreground">Controle de embarques, romaneio e rastreamento</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Expedição
          </Button>
          <ExportButton
            data={filteredShipments as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'shipmentNumber', label: 'Nº Expedição' },
              { key: 'customerName', label: 'Cliente' },
              { key: 'carrier', label: 'Transportadora' },
              { key: 'volumes', label: 'Volumes' },
              { key: 'status', label: 'Status' },
              { key: 'trackingNumber', label: 'Rastreio' },
            ]}
            filename="expedicao_wms"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{shippedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{deliveredCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{shipments.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número, cliente ou rastreio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Embarques</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Expedição</TableHead>
                  <TableHead>Romaneio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Volumes</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map(s => {
                  const cfg = statusConfig[s.status] || statusConfig.pending;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.shipmentNumber}</TableCell>
                      <TableCell>
                        {s.romaneioNumber ? (
                          <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{s.romaneioNumber}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell>{s.carrier || '-'}</TableCell>
                      <TableCell>{s.volumes}</TableCell>
                      <TableCell>{s.totalWeight > 0 ? s.totalWeight.toFixed(1) : '-'}</TableCell>
                      <TableCell>
                        {s.trackingNumber ? (
                          <Badge variant="outline" className="gap-1 font-mono text-xs">
                            <MapPin className="h-3 w-3" />{s.trackingNumber}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {['pending', 'ready'].includes(s.status) && (
                              <DropdownMenuItem onClick={() => { setSelectedId(s.id); setTrackingOpen(true); }}>
                                <Truck className="mr-2 h-4 w-4" /> Registrar Envio
                              </DropdownMenuItem>
                            )}
                            {s.status === 'shipped' && (
                              <DropdownMenuItem onClick={() => deliver(s.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Entrega
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredShipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma expedição encontrada</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tracking Dialog */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Envio</DialogTitle></DialogHeader>
          <div>
            <Label>Código de Rastreio</Label>
            <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Ex: BR123456789XX" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingOpen(false)}>Cancelar</Button>
            <Button onClick={handleShip}>Confirmar Envio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Expedição</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Input value={newShipment.customer_name} onChange={e => setNewShipment(p => ({ ...p, customer_name: e.target.value }))} />
              </div>
              <div>
                <Label>Nº Pedido</Label>
                <Input value={newShipment.order_number} onChange={e => setNewShipment(p => ({ ...p, order_number: e.target.value }))} />
              </div>
              <div>
                <Label>Transportadora</Label>
                <Input value={newShipment.carrier} onChange={e => setNewShipment(p => ({ ...p, carrier: e.target.value }))} />
              </div>
              <div>
                <Label>Volumes</Label>
                <Input type="number" value={newShipment.volumes} onChange={e => setNewShipment(p => ({ ...p, volumes: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Peso Total (kg)</Label>
                <Input type="number" value={newShipment.total_weight || ''} onChange={e => setNewShipment(p => ({ ...p, total_weight: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Valor Total (R$)</Label>
                <Input type="number" value={newShipment.total_value || ''} onChange={e => setNewShipment(p => ({ ...p, total_value: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Endereço de Entrega</Label>
              <Input value={newShipment.shipping_address} onChange={e => setNewShipment(p => ({ ...p, shipping_address: e.target.value }))} />
            </div>
            <div>
              <Label>Operador</Label>
              <Input value={newShipment.operator} onChange={e => setNewShipment(p => ({ ...p, operator: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Expedição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
