import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Skeleton } from '@/ui/base/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { Truck, Search, MoreHorizontal, PackageCheck, MapPin, Clock, CheckCircle, FileText, Plus } from 'lucide-react';
import { useWMSShipments } from '@/hooks/wms/useWMSShipments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    <PageContainer>
      <PageHeader title="Expedição" description="Controle de embarques, romaneio e rastreamento">
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Expedição</Button>
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
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Aguardando" value={pendingCount} subtitle="Pendentes de envio" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Enviados" value={shippedCount} subtitle="Em trânsito" icon={<Truck className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Entregues" value={deliveredCount} subtitle="Confirmados" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Total" value={shipments.length} subtitle="Expedições registradas" icon={<PackageCheck className="h-5 w-5" />} accentColor="primary" index={3} />
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
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Expedição</TableHead>
                  <TableHead>Progresso</TableHead>
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
                  const progressValue = s.status === 'delivered' ? 100 : s.status === 'shipped' ? 75 : s.status === 'ready' ? 50 : 25;
                  
                  return (
                    <TableRow key={s.id} className="group hover:bg-muted/30">
                      <TableCell className="font-medium font-mono">
                        <div className="flex flex-col">
                          <span>{s.shipmentNumber}</span>
                          {s.romaneioNumber && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <FileText className="h-2.5 w-2.5" /> {s.romaneioNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground font-medium uppercase tracking-tighter">Fluxo</span>
                            <span className="font-bold">{progressValue}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                s.status === 'cancelled' ? 'bg-destructive' : 'bg-primary'
                              )} 
                              style={{ width: `${progressValue}%` }} 
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{s.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{s.carrier || 'FOB'}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <div className="flex items-center gap-1">
                          <PackageCheck className="h-3 w-3 text-muted-foreground" />
                          {s.volumes}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-mono text-xs">{s.totalWeight > 0 ? `${s.totalWeight.toFixed(1)}kg` : '-'}</TableCell>
                      <TableCell>
                        {s.trackingNumber ? (
                          <div className="flex items-center gap-1 font-mono text-[10px] bg-muted px-2 py-0.5 rounded-md border border-border/50">
                            <MapPin className="h-2.5 w-2.5 text-primary" />{s.trackingNumber}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell><StatusBadge status={s.status} type="shipment" /></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhuma expedição encontrada
                    </TableCell>
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
              <div><Label>Cliente *</Label><Input value={newShipment.customer_name} onChange={e => setNewShipment(p => ({ ...p, customer_name: e.target.value }))} /></div>
              <div><Label>Nº Pedido</Label><Input value={newShipment.order_number} onChange={e => setNewShipment(p => ({ ...p, order_number: e.target.value }))} /></div>
              <div><Label>Transportadora</Label><Input value={newShipment.carrier} onChange={e => setNewShipment(p => ({ ...p, carrier: e.target.value }))} /></div>
              <div><Label>Volumes</Label><Input type="number" value={newShipment.volumes} onChange={e => setNewShipment(p => ({ ...p, volumes: Number(e.target.value) }))} /></div>
              <div><Label>Peso Total (kg)</Label><Input type="number" value={newShipment.total_weight || ''} onChange={e => setNewShipment(p => ({ ...p, total_weight: Number(e.target.value) }))} /></div>
              <div><Label>Valor Total (R$)</Label><Input type="number" value={newShipment.total_value || ''} onChange={e => setNewShipment(p => ({ ...p, total_value: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Endereço de Entrega</Label><Input value={newShipment.shipping_address} onChange={e => setNewShipment(p => ({ ...p, shipping_address: e.target.value }))} /></div>
            <div><Label>Operador</Label><Input value={newShipment.operator} onChange={e => setNewShipment(p => ({ ...p, operator: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Expedição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
