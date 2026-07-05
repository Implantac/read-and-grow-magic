import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Progress } from '@/ui/base/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import {
  MapPin, Search, Package, Grid3X3, Warehouse, Thermometer, AlertTriangle, Plus, FilterX
} from 'lucide-react';
import { useWMSStorageLocations } from '@/hooks/wms/useWMSOperations';
import type { StorageType } from '@/types/wms';
import { cn } from '@/lib/utils';
import { WarehouseMap } from '@/components/wms/WarehouseMap';

const typeConfig: Record<StorageType, { label: string; icon: React.ReactNode; color: string }> = {
  rack: { label: 'Rack', icon: <Grid3X3 className="h-4 w-4" />, color: 'bg-blue-500' },
  shelf: { label: 'Prateleira', icon: <Package className="h-4 w-4" />, color: 'bg-green-500' },
  floor: { label: 'Piso', icon: <Warehouse className="h-4 w-4" />, color: 'bg-yellow-500' },
  cold: { label: 'Refrigerado', icon: <Thermometer className="h-4 w-4" />, color: 'bg-cyan-500' },
  hazardous: { label: 'Perigoso', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-destructive' },
};

export default function StoragePage() {
  const { locations, loading } = useWMSStorageLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const zones = [...new Set(locations.map(l => l.zone))].sort();

  // Prepare data for the map
  const zoneStats = zones.map(zone => {
    const zoneLocations = locations.filter(l => l.zone === zone);
    const totalCap = zoneLocations.reduce((s, l) => s + l.capacity, 0);
    const totalOcc = zoneLocations.reduce((s, l) => s + l.occupied, 0);
    return {
      zone,
      occupancy: totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0,
      totalLocations: zoneLocations.length,
      type: zoneLocations[0]?.type || 'rack'
    };
  });

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
    <PageContainer>
      <PageHeader title="Endereçamento" description="Gerenciamento visual e lógico de locais de armazenamento" />

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2">
          <WarehouseMap 
            zones={zoneStats} 
            selectedZone={zoneFilter === 'all' ? null : zoneFilter}
            onZoneClick={(zone) => setZoneFilter(prev => prev === zone ? 'all' : zone)}
            className="h-full border-none shadow-sm"
          />
        </div>
        <div className="grid gap-4">
          <KPICard title="Ocupação Total" value={`${occupancyRate}%`} subtitle={`${totalOccupied}/${totalCapacity} posições`} icon={<Warehouse className="h-5 w-5" />} accentColor={occupancyRate > 85 ? 'danger' : 'primary'} index={0} entityKey="wms_occupancy" numericValue={Number(occupancyRate)} progress={Number(occupancyRate)} status={Number(occupancyRate) > 85 ? 'critical' : Number(occupancyRate) > 70 ? 'warn' : 'healthy'} source="WMS Storage" />
          <KPICard title="Endereços Vazios" value={emptyLocations} subtitle="Prontos para alocação" icon={<Grid3X3 className="h-5 w-5" />} accentColor="success" index={1} entityKey="wms_occupancy" numericValue={emptyLocations} source="WMS Storage" />
          <KPICard title="Endereços Cheios" value={fullLocations} subtitle="Capacidade esgotada" icon={<Package className="h-5 w-5" />} accentColor={fullLocations > 0 ? 'danger' : 'primary'} index={2} entityKey="wms_occupancy" numericValue={fullLocations} status={fullLocations > 0 ? 'warn' : 'healthy'} source="WMS Storage" />

        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Zona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Zonas</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone} value={zone}>Zona {zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || zoneFilter !== 'all' || typeFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchTerm(''); setZoneFilter('all'); setTypeFilter('all'); }}
                className="gap-2 text-muted-foreground"
              >
                <FilterX className="h-4 w-4" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-28 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filteredLocations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => {
            const config = typeConfig[location.type] || typeConfig.rack;
            const occupancyPercent = location.capacity > 0 ? Math.round((location.occupied / location.capacity) * 100) : 0;

            return (
              <Card key={location.id} className="relative overflow-hidden hover-lift group">
                <div className={cn('absolute left-0 top-0 bottom-0 w-1', config.color)} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {config.icon}
                      <span className="font-mono">{location.code}</span>
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
                        <span className="text-muted-foreground">Ocupação</span>
                        <span className={cn(
                          'font-semibold tabular-nums',
                          occupancyPercent > 85 ? 'text-destructive' : occupancyPercent > 60 ? 'text-yellow-600' : 'text-green-600'
                        )}>
                          {location.occupied}/{location.capacity} ({occupancyPercent}%)
                        </span>
                      </div>
                      <Progress value={occupancyPercent} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {location.products && location.products.length > 0 ? (
                        <span>{location.products.length} produto(s) armazenado(s)</span>
                      ) : (
                        <span className="text-green-600">Endereço vazio — disponível</span>
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
          <CardContent className="p-0">
            <EmptyState
              icon={MapPin}
              title="Nenhum endereço encontrado"
              description={
                locations.length === 0
                  ? 'Configure os endereços do armazém para começar a operação WMS.'
                  : 'Nenhum endereço corresponde aos filtros aplicados.'
              }
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
