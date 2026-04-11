import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search, Package, Truck, Factory } from 'lucide-react';
import { useWMSReturns } from '@/hooks/useWMSReturns';

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  customer: { label: 'Cliente', icon: <Package className="h-4 w-4" /> },
  supplier: { label: 'Fornecedor', icon: <Truck className="h-4 w-4" /> },
  production: { label: 'Produção', icon: <Factory className="h-4 w-4" /> },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  receiving: { label: 'Recebendo', variant: 'secondary' },
  inspecting: { label: 'Inspecionando', variant: 'default' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function ReturnsPage() {
  const { returns, loading, updateStatus } = useWMSReturns();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = returns.filter(r => {
    const matchSearch = r.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.returnType === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devoluções</h1>
          <p className="text-muted-foreground">Logística reversa - devoluções e retornos</p>
        </div>
        <Button><RotateCcw className="h-4 w-4 mr-2" /> Nova Devolução</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{returns.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{returns.filter(r => r.status === 'pending').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Inspeção</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{returns.filter(r => r.status === 'inspecting').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{returns.filter(r => r.status === 'completed').length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(typeConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ret => {
            const cfg = statusConfig[ret.status] || statusConfig.pending;
            const tc = typeConfig[ret.returnType] || typeConfig.customer;
            return (
              <Card key={ret.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {tc.icon} {ret.returnNumber}
                    </CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Tipo:</span> {tc.label}</p>
                  {ret.customerName && <p><span className="text-muted-foreground">Cliente:</span> {ret.customerName}</p>}
                  {ret.supplierName && <p><span className="text-muted-foreground">Fornecedor:</span> {ret.supplierName}</p>}
                  {ret.reason && <p><span className="text-muted-foreground">Motivo:</span> {ret.reason}</p>}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <span>Total: {ret.totalItems}</span>
                    <span>Aprovados: {ret.approvedItems}</span>
                    <span>Rejeitados: {ret.rejectedItems}</span>
                    <span>Destino: {ret.destination}</span>
                  </div>
                  {ret.status === 'pending' && (
                    <Button size="sm" className="w-full mt-2" onClick={() => updateStatus(ret.id, 'inspecting')}>Iniciar Inspeção</Button>
                  )}
                  {ret.status === 'inspecting' && (
                    <Button size="sm" className="w-full mt-2" onClick={() => updateStatus(ret.id, 'completed')}>Concluir</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma devolução</h3>
            <p>Registre devoluções de clientes, fornecedores ou produção.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
