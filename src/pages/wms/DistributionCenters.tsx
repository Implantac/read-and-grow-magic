import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Building2, Search, Plus, MapPin } from 'lucide-react';
import { useDistributionCenters } from '@/hooks/useDistributionCenters';

export default function DistributionCentersPage() {
  const { centers, loading } = useDistributionCenters();
  const [search, setSearch] = useState('');

  const filtered = centers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Distribuição</h1>
          <p className="text-muted-foreground">Gestão multi-CD para operação logística</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo CD</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de CDs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{centers.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{centers.filter(c => c.status === 'active').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {centers.reduce((s, c) => s + c.totalCapacity, 0).toLocaleString('pt-BR')} m³
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar CD..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dc => {
            const occupancy = dc.totalCapacity > 0 ? Math.round((dc.usedCapacity / dc.totalCapacity) * 100) : 0;
            return (
              <Card key={dc.id}>
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
                      <span>Ocupação</span>
                      <span>{dc.usedCapacity.toLocaleString('pt-BR')}/{dc.totalCapacity.toLocaleString('pt-BR')} m³ ({occupancy}%)</span>
                    </div>
                    <Progress value={occupancy} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum CD cadastrado</h3>
            <p>Cadastre centros de distribuição para operação multi-CD.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
