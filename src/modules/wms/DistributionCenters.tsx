import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Progress } from '@/ui/base/progress';
import { Building2, Search, Plus, MapPin, CheckCircle, Warehouse } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { useDistributionCenters } from '@/hooks/wms/useDistributionCenters';

import { formatNumber } from '@/lib/formatters';
export default function DistributionCentersPage() {
  const { centers, loading } = useDistributionCenters();
  const [search, setSearch] = useState('');

  const filtered = centers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = centers.reduce((s, c) => s + c.totalCapacity, 0);
  const totalUsed = centers.reduce((s, c) => s + c.usedCapacity, 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Centros de Distribuição"
        description="Gestão multi-CD para operação logística"
        actions={<Button><Plus className="h-4 w-4 mr-2" /> Novo CD</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de CDs" value={centers.length} icon={Building2} index={0} />
        <KPICard title="Ativos" value={centers.filter(c => c.status === 'active').length} icon={CheckCircle} index={1} color="success" />
        <KPICard title="Capacidade Total" value={`${formatNumber(totalCapacity)} m³`} icon={Warehouse} index={2} />
        <KPICard title="Ocupação Média" value={`${avgOccupancy}%`} icon={Building2} index={3} color={avgOccupancy > 85 ? 'danger' : avgOccupancy > 70 ? 'warning' : undefined} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar CD por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dc => {
            const occupancy = dc.totalCapacity > 0 ? Math.round((dc.usedCapacity / dc.totalCapacity) * 100) : 0;
            return (
              <Card key={dc.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" /> {dc.code}
                    </CardTitle>
                    <Badge variant={dc.status === 'active' ? 'default' : 'secondary'}>
                      {dc.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{dc.name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dc.city || dc.state) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {dc.city}{dc.state ? `, ${dc.state}` : ''}
                    </p>
                  )}
                  {dc.manager && <p className="text-sm"><span className="text-muted-foreground">Gestor:</span> {dc.manager}</p>}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Ocupação</span>
                      <span className="font-medium">{formatNumber(dc.usedCapacity)}/{formatNumber(dc.totalCapacity)} m³ ({occupancy}%)</span>
                    </div>
                    <Progress value={occupancy} className={`h-2 ${occupancy > 85 ? '[&>div]:bg-destructive' : occupancy > 70 ? '[&>div]:bg-amber-500' : ''}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Building2} title="Nenhum CD cadastrado" description="Cadastre centros de distribuição para operação multi-CD com transferências e roteirização." />
      )}
    </PageContainer>
  );
}
