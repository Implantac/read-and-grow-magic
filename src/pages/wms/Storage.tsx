import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  MapPin,
  Search,
  Package,
  Grid3X3,
  Eye,
  ArrowRightLeft,
  Warehouse,
  Thermometer,
  AlertTriangle
} from 'lucide-react';
import { storageLocations as initialLocations } from '@/data/wmsMockData';
import { StorageLocation, StorageType } from '@/types/wms';

const typeConfig: Record<StorageType, { label: string; icon: React.ReactNode; color: string }> = {
  rack: { label: 'Rack', icon: <Grid3X3 className="h-4 w-4" />, color: 'bg-blue-500' },
  shelf: { label: 'Prateleira', icon: <Package className="h-4 w-4" />, color: 'bg-green-500' },
  floor: { label: 'Piso', icon: <Warehouse className="h-4 w-4" />, color: 'bg-amber-500' },
  cold: { label: 'Refrigerado', icon: <Thermometer className="h-4 w-4" />, color: 'bg-cyan-500' },
  hazardous: { label: 'Perigoso', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-500' }
};

export default function StoragePage() {
  const [locations, setLocations] = useState<StorageLocation[]>(initialLocations);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState({ productId: '', toLocation: '', quantity: 0 });

  const zones = [...new Set(locations.map(l => l.zone))];

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = zoneFilter === 'all' || location.zone === zoneFilter;
    const matchesType = typeFilter === 'all' || location.type === typeFilter;
    return matchesSearch && matchesZone && matchesType;
  });

  const totalCapacity = locations.reduce((sum, l) => sum + l.capacity, 0);
  const totalOccupied = locations.reduce((sum, l) => sum + l.occupied, 0);
  const occupancyRate = Math.round((totalOccupied / totalCapacity) * 100);
  const emptyLocations = locations.filter(l => l.occupied === 0).length;
  const fullLocations = locations.filter(l => l.occupied >= l.capacity).length;

  const handleViewDetails = (location: StorageLocation) => {
    setSelectedLocation(location);
    setDetailsOpen(true);
  };

  const handleTransfer = (location: StorageLocation) => {
    setSelectedLocation(location);
    if (location.products.length > 0) {
      setTransferData({ 
        productId: location.products[0].id, 
        toLocation: '', 
        quantity: 0 
      });
    }
    setTransferOpen(true);
  };

  const handleConfirmTransfer = () => {
    if (!selectedLocation || !transferData.toLocation || transferData.quantity <= 0) {
      toast.error('Preencha todos os campos');
      return;
    }

    const product = selectedLocation.products.find(p => p.id === transferData.productId);
    if (!product || transferData.quantity > product.quantity) {
      toast.error('Quantidade inválida');
      return;
    }

    setLocations(locations.map(loc => {
      if (loc.id === selectedLocation.id) {
        const updatedProducts = loc.products.map(p => 
          p.id === transferData.productId 
            ? { ...p, quantity: p.quantity - transferData.quantity }
            : p
        ).filter(p => p.quantity > 0);
        
        return { 
          ...loc, 
          products: updatedProducts,
          occupied: loc.occupied - transferData.quantity 
        };
      }
      if (loc.code === transferData.toLocation) {
        const existingProduct = loc.products.find(p => p.id === transferData.productId);
        let updatedProducts;
        if (existingProduct) {
          updatedProducts = loc.products.map(p => 
            p.id === transferData.productId 
              ? { ...p, quantity: p.quantity + transferData.quantity }
              : p
          );
        } else {
          updatedProducts = [...loc.products, { ...product!, quantity: transferData.quantity }];
        }
        return { 
          ...loc, 
          products: updatedProducts,
          occupied: loc.occupied + transferData.quantity 
        };
      }
      return loc;
    }));

    toast.success('Transferência realizada com sucesso!');
    setTransferOpen(false);
    setSelectedLocation(null);
  };

  const getOccupancyColor = (occupied: number, capacity: number) => {
    const rate = (occupied / capacity) * 100;
    if (rate >= 90) return 'text-destructive';
    if (rate >= 70) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Endereçamento</h1>
          <p className="text-muted-foreground">Gerenciamento de locais de armazenamento</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <Progress value={occupancyRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Endereços</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">{zones.length} zonas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endereços Vazios</CardTitle>
            <Grid3X3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emptyLocations}</div>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endereços Cheios</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fullLocations}</div>
            <p className="text-xs text-muted-foreground">Capacidade máxima</p>
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
                placeholder="Buscar por código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Zonas</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone} value={zone}>Zona {zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.map((location) => {
          const config = typeConfig[location.type];
          const occupancyPercent = Math.round((location.occupied / location.capacity) * 100);
          
          return (
            <Card key={location.id} className="relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {config.icon}
                    {location.code}
                  </CardTitle>
                  <Badge variant={location.active ? 'default' : 'secondary'}>
                    {location.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Zona {location.zone} • {config.label}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ocupação</span>
                      <span className={getOccupancyColor(location.occupied, location.capacity)}>
                        {location.occupied}/{location.capacity} ({occupancyPercent}%)
                      </span>
                    </div>
                    <Progress value={occupancyPercent} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {location.products.length > 0 ? (
                      <span>{location.products.length} produto(s) armazenado(s)</span>
                    ) : (
                      <span>Endereço vazio</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(location)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    {location.products.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTransfer(location)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                        Transferir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum endereço encontrado
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Endereço - {selectedLocation?.code}</DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Zona</p>
                  <p className="font-medium">{selectedLocation.zone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{typeConfig[selectedLocation.type].label}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedLocation.active ? 'Ativo' : 'Inativo'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Corredor</p>
                  <p className="font-medium">{selectedLocation.aisle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rack</p>
                  <p className="font-medium">{selectedLocation.rack}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="font-medium">{selectedLocation.level}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Produtos Armazenados</h4>
                {selectedLocation.products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead>Lote</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLocation.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.productCode}</TableCell>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell>{product.batch || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum produto neste endereço</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Produto</DialogTitle>
          </DialogHeader>
          {selectedLocation && selectedLocation.products.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Produto</label>
                <Select 
                  value={transferData.productId} 
                  onValueChange={(v) => setTransferData({ ...transferData, productId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedLocation.products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.productName} ({p.quantity} un)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Destino</label>
                <Select 
                  value={transferData.toLocation} 
                  onValueChange={(v) => setTransferData({ ...transferData, toLocation: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter(l => l.id !== selectedLocation.id && l.occupied < l.capacity)
                      .map(l => (
                        <SelectItem key={l.id} value={l.code}>
                          {l.code} (Disp: {l.capacity - l.occupied})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Quantidade</label>
                <Input
                  type="number"
                  min={1}
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmTransfer}>
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
