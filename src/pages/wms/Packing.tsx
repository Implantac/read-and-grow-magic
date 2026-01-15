import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Package,
  Truck,
  Clock,
  CheckCircle,
  Box,
  Eye,
  PackageCheck,
  PackagePlus
} from 'lucide-react';
import { packingOrders as initialOrders } from '@/data/wmsMockData';
import { PackingOrder, PackingStatus, Package as PackageType } from '@/types/wms';

const statusConfig: Record<PackingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  packing: { label: 'Embalando', variant: 'default' },
  packed: { label: 'Embalado', variant: 'outline' },
  shipped: { label: 'Expedido', variant: 'outline' }
};

export default function PackingPage() {
  const [orders, setOrders] = useState<PackingOrder[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PackingOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [packingOpen, setPackingOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<PackageType>>({
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    items: []
  });
  const [shippingData, setShippingData] = useState({ carrier: '', trackingNumber: '' });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const packingCount = orders.filter(o => o.status === 'packing').length;
  const packedCount = orders.filter(o => o.status === 'packed').length;
  const shippedToday = orders.filter(o => 
    o.status === 'shipped' && 
    o.shippedAt?.startsWith(format(new Date(), 'yyyy-MM-dd'))
  ).length;

  const handleViewDetails = (order: PackingOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStartPacking = (order: PackingOrder) => {
    if (order.status === 'pending') {
      setOrders(orders.map(o => 
        o.id === order.id 
          ? { ...o, status: 'packing' as PackingStatus, operator: 'Usuário Atual', startedAt: new Date().toISOString() }
          : o
      ));
    }
    setSelectedOrder(order);
    setNewPackage({
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      items: []
    });
    setPackingOpen(true);
  };

  const handleAddPackage = () => {
    if (!selectedOrder || !newPackage.weight || newPackage.weight <= 0) {
      toast.error('Preencha o peso do volume');
      return;
    }

    const packageNumber = `VOL-${String(selectedOrder.packages.length + 1).padStart(3, '0')}`;
    const pkg: PackageType = {
      id: Date.now().toString(),
      packageNumber,
      weight: newPackage.weight!,
      dimensions: newPackage.dimensions as { length: number; width: number; height: number },
      items: []
    };

    setOrders(orders.map(o => 
      o.id === selectedOrder.id 
        ? { ...o, packages: [...o.packages, pkg] }
        : o
    ));

    setSelectedOrder(prev => prev ? { ...prev, packages: [...prev.packages, pkg] } : null);
    setNewPackage({
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      items: []
    });
    toast.success(`Volume ${packageNumber} adicionado!`);
  };

  const handleFinishPacking = () => {
    if (!selectedOrder || selectedOrder.packages.length === 0) {
      toast.error('Adicione pelo menos um volume');
      return;
    }

    setOrders(orders.map(o => 
      o.id === selectedOrder.id 
        ? { ...o, status: 'packed' as PackingStatus, completedAt: new Date().toISOString() }
        : o
    ));

    toast.success('Embalagem concluída!');
    setPackingOpen(false);
    setSelectedOrder(null);
  };

  const handleOpenShip = (order: PackingOrder) => {
    setSelectedOrder(order);
    setShippingData({ carrier: '', trackingNumber: '' });
    setShipOpen(true);
  };

  const handleConfirmShipping = () => {
    if (!selectedOrder || !shippingData.carrier || !shippingData.trackingNumber) {
      toast.error('Preencha todos os campos');
      return;
    }

    setOrders(orders.map(o => 
      o.id === selectedOrder.id 
        ? { 
            ...o, 
            status: 'shipped' as PackingStatus, 
            shippedAt: new Date().toISOString(),
            carrier: shippingData.carrier,
            trackingNumber: shippingData.trackingNumber
          }
        : o
    ));

    toast.success('Expedição registrada!');
    setShipOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packing</h1>
          <p className="text-muted-foreground">Embalagem e expedição de pedidos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Para embalar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Embalando</CardTitle>
            <Box className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingCount}</div>
            <p className="text-xs text-muted-foreground">Em processo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontos</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packedCount}</div>
            <p className="text-xs text-muted-foreground">Para expedir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expedidos Hoje</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedToday}</div>
            <p className="text-xs text-muted-foreground">Enviados hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="packing">Embalando</SelectItem>
                <SelectItem value="packed">Embalado</SelectItem>
                <SelectItem value="shipped">Expedido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ordens de Packing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Volumes</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.packages.length} volume(s)</TableCell>
                  <TableCell>{order.operator || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[order.status].variant}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(order.status === 'pending' || order.status === 'packing') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartPacking(order)}
                        >
                          <Box className="h-4 w-4 mr-1" />
                          Embalar
                        </Button>
                      )}
                      {order.status === 'packed' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenShip(order)}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Expedir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Packing - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Picking</p>
                  <p className="font-medium">{selectedOrder.pickingOrderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-medium">{selectedOrder.operator || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedOrder.status].variant}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                </div>
              </div>

              {selectedOrder.status === 'shipped' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Transportadora</p>
                      <p className="font-medium">{selectedOrder.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rastreio</p>
                      <p className="font-medium">{selectedOrder.trackingNumber}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Volumes ({selectedOrder.packages.length})</h4>
                {selectedOrder.packages.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Volume</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>Dimensões (CxLxA)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.packageNumber}</TableCell>
                          <TableCell>{pkg.weight} kg</TableCell>
                          <TableCell>
                            {pkg.dimensions.length} x {pkg.dimensions.width} x {pkg.dimensions.height} cm
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum volume registrado</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Packing Dialog */}
      <Dialog open={packingOpen} onOpenChange={setPackingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embalagem - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Cliente:</strong> {selectedOrder.customerName}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <PackagePlus className="h-4 w-4" />
                  Adicionar Volume
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Peso (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newPackage.weight || ''}
                      onChange={(e) => setNewPackage({ ...newPackage, weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Comprimento (cm)</label>
                    <Input
                      type="number"
                      min="0"
                      value={newPackage.dimensions?.length || ''}
                      onChange={(e) => setNewPackage({ 
                        ...newPackage, 
                        dimensions: { ...newPackage.dimensions!, length: parseInt(e.target.value) || 0 } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Largura (cm)</label>
                    <Input
                      type="number"
                      min="0"
                      value={newPackage.dimensions?.width || ''}
                      onChange={(e) => setNewPackage({ 
                        ...newPackage, 
                        dimensions: { ...newPackage.dimensions!, width: parseInt(e.target.value) || 0 } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Altura (cm)</label>
                    <Input
                      type="number"
                      min="0"
                      value={newPackage.dimensions?.height || ''}
                      onChange={(e) => setNewPackage({ 
                        ...newPackage, 
                        dimensions: { ...newPackage.dimensions!, height: parseInt(e.target.value) || 0 } 
                      })}
                    />
                  </div>
                </div>
                <Button className="mt-3" onClick={handleAddPackage}>
                  <PackagePlus className="h-4 w-4 mr-1" />
                  Adicionar Volume
                </Button>
              </div>

              {selectedOrder.packages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Volumes Adicionados</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Volume</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>Dimensões</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>{pkg.packageNumber}</TableCell>
                          <TableCell>{pkg.weight} kg</TableCell>
                          <TableCell>
                            {pkg.dimensions.length} x {pkg.dimensions.width} x {pkg.dimensions.height} cm
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackingOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinishPacking} disabled={!selectedOrder || selectedOrder.packages.length === 0}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Finalizar Embalagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expedir Pedido - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Transportadora</label>
              <Input
                value={shippingData.carrier}
                onChange={(e) => setShippingData({ ...shippingData, carrier: e.target.value })}
                placeholder="Nome da transportadora"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código de Rastreio</label>
              <Input
                value={shippingData.trackingNumber}
                onChange={(e) => setShippingData({ ...shippingData, trackingNumber: e.target.value })}
                placeholder="Código de rastreamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmShipping}>
              <Truck className="h-4 w-4 mr-1" />
              Confirmar Expedição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
