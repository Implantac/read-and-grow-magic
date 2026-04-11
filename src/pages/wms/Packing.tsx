import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, Package, Truck, Clock, Box, PackageCheck, MoreHorizontal, FileText, PlayCircle, CheckCircle,
} from 'lucide-react';
import { useWMSPacking } from '@/hooks/useWMSOperations';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  packing: { label: 'Embalando', variant: 'default' },
  packed: { label: 'Embalado', variant: 'outline' },
  shipped: { label: 'Expedido', variant: 'outline' },
};

export default function PackingPage() {
  const { orders, loading, update } = useWMSPacking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
  const shippedCount = orders.filter(o => o.status === 'shipped').length;

  const handleStartPacking = async (id: string) => {
    await update(id, { status: 'packing', started_at: new Date().toISOString() });
  };
  const handleCompletePacking = async (id: string) => {
    await update(id, { status: 'packed', completed_at: new Date().toISOString() });
  };
  const handleShip = async (id: string) => {
    await update(id, { status: 'shipped', shipped_at: new Date().toISOString() });
    toast.success('📄 NF-e gerada automaticamente como rascunho!');
  };

  return (
    <PageContainer>
      <PageHeader title="Packing" description="Embalagem e expedição de pedidos" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Aguardando" value={pendingCount} subtitle="Para embalar" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Embalando" value={packingCount} subtitle="Em processo" icon={<Box className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Prontos" value={packedCount} subtitle="Para expedir" icon={<PackageCheck className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Expedidos" value={shippedCount} subtitle="Com NF-e gerada" icon={<Truck className="h-5 w-5" />} accentColor="primary" index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Ordens de Packing</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Volumes</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>NF-e</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium font-mono">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="tabular-nums">{order.volumes || 0}</TableCell>
                      <TableCell>{order.operator || '-'}</TableCell>
                      <TableCell className="text-xs font-mono">{order.trackingCode || '-'}</TableCell>
                      <TableCell>
                        {order.status === 'shipped' ? (
                          <Badge variant="outline" className="text-xs gap-1"><FileText className="h-3 w-3" />Gerada</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.status === 'pending' && <DropdownMenuItem onClick={() => handleStartPacking(order.id)}><PlayCircle className="mr-2 h-4 w-4" />Iniciar Embalagem</DropdownMenuItem>}
                            {order.status === 'packing' && <DropdownMenuItem onClick={() => handleCompletePacking(order.id)}><CheckCircle className="mr-2 h-4 w-4" />Concluir Embalagem</DropdownMenuItem>}
                            {order.status === 'packed' && <DropdownMenuItem onClick={() => handleShip(order.id)}><Truck className="mr-2 h-4 w-4" />Expedir (Gera NF-e)</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhuma ordem encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
