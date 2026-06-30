import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { RotateCcw, Search, Package, Truck, Factory, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useWMSReturns } from '@/hooks/wms/useWMSReturns';
import { ReturnItemsDialog } from './returns/ReturnItemsDialog';

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
  const [selected, setSelected] = useState<{ id: string; number: string } | null>(null);

  const filtered = returns.filter(r => {
    const matchSearch = r.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.returnType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Devoluções"
        description="Logística reversa — devoluções e retornos"
        actions={<Button><RotateCcw className="h-4 w-4 mr-2" /> Nova Devolução</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total" value={returns.length} icon={RotateCcw} index={0} />
        <KPICard title="Pendentes" value={returns.filter(r => r.status === 'pending').length} icon={AlertTriangle} index={1} color="warning" />
        <KPICard title="Em Inspeção" value={returns.filter(r => r.status === 'inspecting').length} icon={Eye} index={2} />
        <KPICard title="Concluídas" value={returns.filter(r => r.status === 'completed').length} icon={CheckCircle} index={3} color="success" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar devolução ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
              <Card key={ret.id} className="hover-lift">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">{tc.icon} {ret.returnNumber}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Badge variant="outline">{tc.label}</Badge>
                  {ret.customerName && <p><span className="text-muted-foreground">Cliente:</span> {ret.customerName}</p>}
                  {ret.supplierName && <p><span className="text-muted-foreground">Fornecedor:</span> {ret.supplierName}</p>}
                  {ret.reason && <p><span className="text-muted-foreground">Motivo:</span> {ret.reason}</p>}
                  <div className="grid grid-cols-2 gap-1 pt-1 bg-muted/50 rounded-md p-2">
                    <span>Total: <strong>{ret.totalItems}</strong></span>
                    <span>Aprovados: <strong className="text-green-600">{ret.approvedItems}</strong></span>
                    <span>Rejeitados: <strong className="text-destructive">{ret.rejectedItems}</strong></span>
                    <span>Destino: <strong>{ret.destination}</strong></span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelected({ id: ret.id, number: ret.returnNumber })}>
                      Itens / Disposição
                    </Button>
                    {ret.status === 'pending' && (
                      <Button size="sm" onClick={() => updateStatus(ret.id, 'inspecting')}>Iniciar</Button>
                    )}
                    {ret.status === 'inspecting' && (
                      <Button size="sm" onClick={() => updateStatus(ret.id, 'completed')}>Concluir</Button>
                    )}
                  </div>
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

      <ReturnItemsDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        returnId={selected?.id ?? null}
        returnNumber={selected?.number}
      />
    </PageContainer>
  );
}
