import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package, Search, Truck, CheckCircle, Clock, PlayCircle, MoreHorizontal, ShoppingCart, PackagePlus,
  FileText, ShieldCheck, AlertCircle, Info, Box, LayoutGrid
} from 'lucide-react';
import { useWMSReceiving } from '@/hooks/useWMSOperations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function ReceivingPage() {
  const { orders, loading, refetch, update } = useWMSReceiving();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  const formatDate = (date: string) => {
    try { return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return '-'; }
  };

  const handleStart = async (id: string) => {
    await update(id, { status: 'in_progress', received_date: null });
    refetch();
  };

  const handleComplete = async (id: string) => {
    await update(id, { status: 'completed', received_date: new Date().toISOString() });
    refetch();
  };

  return (
    <PageContainer>
      <PageHeader title="Recebimento" description="Gerenciamento de recebimento de mercadorias">
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'orderNumber', label: 'Nº Ordem' },
            { key: 'supplier', label: 'Fornecedor' },
            { key: 'dock', label: 'Doca' },
            { key: 'status', label: 'Status' },
            { key: 'expectedDate', label: 'Data Prevista', format: (v) => formatDate(v as string) },
          ]}
          filename="recebimento_wms"
        />
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Pendentes" value={pendingCount} subtitle="Aguardando recebimento" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Em Andamento" value={inProgressCount} subtitle="Sendo recebidos" icon={<PlayCircle className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Concluídos" value={completedCount} subtitle="Finalizados" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Total Ordens" value={orders.length} subtitle="Ordens cadastradas" icon={<Package className="h-5 w-5" />} accentColor="primary" index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número ou fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> Ordens de Recebimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Doca</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Origem</TableHead>
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
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(order.expectedDate)}</TableCell>
                      <TableCell>{order.dock || '-'}</TableCell>
                      <TableCell className="tabular-nums">{order.receivedItems || 0}/{order.itemsCount || 0}</TableCell>
                      <TableCell>
                        {order.notes?.includes('Gerado automaticamente') ? (
                          <Badge variant="outline" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" />Compras</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStart(order.id)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Recebimento
                              </DropdownMenuItem>
                            )}
                            {order.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleComplete(order.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Concluir Recebimento
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <PackagePlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
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
