import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Search,
  Package,
  Grid3X3,
  Warehouse,
  Thermometer,
  AlertTriangle
} from 'lucide-react';
import type { StorageLocation, StorageType } from '@/types/wms';

const typeConfig: Record<StorageType, { label: string; icon: React.ReactNode; color: string }> = {
  rack: { label: 'Rack', icon: <Grid3X3 className="h-4 w-4" />, color: 'bg-blue-500' },
  shelf: { label: 'Prateleira', icon: <Package className="h-4 w-4" />, color: 'bg-green-500' },
  floor: { label: 'Piso', icon: <Warehouse className="h-4 w-4" />, color: 'bg-amber-500' },
  cold: { label: 'Refrigerado', icon: <Thermometer className="h-4 w-4" />, color: 'bg-cyan-500' },
  hazardous: { label: 'Perigoso', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-500' }
};

export default function StoragePage() {
  const [locations] = useState<StorageLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const zones: string[] = [];

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = zoneFilter === 'all' || location.zone === zoneFilter;
    const matchesType = typeFilter === 'all' || location.type === typeFilter;
    return matchesSearch && matchesZone && matchesType;
  });

  const totalCapacity = locations.reduce((sum, l) => sum + l.capacity, 0);
  const totalOccupied = locations.reduce((sum, l) => sum + l.occupied, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const emptyLocations = locations.filter(l => l.occupied === 0).length;
  const fullLocations = locations.filter(l => l.occupied >= l.capacity).length;

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
      {filteredLocations.length > 0 ? (
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
                        <span>
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p>Configure os endereços do armazém para começar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
