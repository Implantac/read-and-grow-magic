import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  FileText, ShieldCheck, AlertCircle, Info, Box, LayoutGrid, ScanBarcode, Zap, CheckCircle2
} from 'lucide-react';
import { useWMSReceiving } from '@/hooks/useWMSOperations';
import { BarcodeScanner, ScanFeedback } from '@/components/wms/BarcodeScanner';
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
  const [qualityCheck, setQualityCheck] = useState({ 
    damaged: false, 
    qtyMismatch: false, 
    tempChecked: true 
  });

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
    if (!date) return '-';
    try { return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return '-'; }
  };

  const handleStart = async (id: string) => {
    await update(id, { status: 'in_progress', received_date: null });
    refetch();
  };

  const handleComplete = async (id: string) => {
    await update(id, { status: 'completed', received_date: new Date().toISOString() });
    setIsDetailsOpen(false);
    refetch();
  };

  const openDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setScannedItems({}); // Reset scanner progress
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
                            <DropdownMenuItem onClick={() => openDetails(order)}>
                              <Info className="mr-2 h-4 w-4" /> Detalhes & Conferência
                            </DropdownMenuItem>
                            {order.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStart(order.id)}>
                                <PlayCircle className="mr-2 h-4 w-4 text-primary" /> Iniciar Recebimento
                              </DropdownMenuItem>
                            )}
                            {order.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleComplete(order.id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Concluir Recebimento
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details & Conference Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={selectedOrder ? (statusConfig[selectedOrder.status]?.variant || 'outline') : 'outline'}>
                {selectedOrder && statusConfig[selectedOrder.status]?.label}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">#{selectedOrder?.id?.slice(0, 8)}</span>
            </div>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Recebimento: {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Conferência de mercadorias do fornecedor <strong>{selectedOrder?.supplier}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Doca de Descarga</Label>
                  <div className="flex items-center gap-2 font-semibold">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    {selectedOrder.dock || 'Não atribuída'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Previsão de Entrega</Label>
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedOrder.expectedDate)}
                  </div>
                </div>
              </div>

              {/* Barcode Integration */}
              {selectedOrder.status === 'in_progress' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <ScanBarcode className="h-4 w-4 text-primary" />
                      Conferência por Coletor
                    </h4>
                    <Badge variant="outline" className="text-[10px] animate-pulse bg-primary/5">AGUARDANDO LEITURA</Badge>
                  </div>
                  <BarcodeScanner 
                    autoFocus 
                    onScan={async (code) => {
                      // Validation logic: Find product by barcode or code
                      const { data: product, error } = await supabase
                        .from('products')
                        .select('id, code, name, status')
                        .or(`barcode.eq.${code},code.eq.${code}`)
                        .maybeSingle();

                      if (error) return { type: 'error', message: 'Erro ao consultar produto.' };
                      if (!product) return { type: 'error', message: `SKU/EAN ${code} não encontrado.` };
                      if (product.status !== 'active') return { type: 'error', message: `Produto ${product.code} está inativo.` };

                      // In a real scenario, we'd check if the SKU belongs to the order.
                      // Here we simulate the validation against the order's expected count.
                      const currentCount = (scannedItems[product.code] || 0) + 1;
                      
                      if (currentCount > selectedOrder.itemsCount) {
                        return { type: 'error', message: `Quantidade máxima excedida para ${product.code}.` };
                      }

                      setScannedItems(prev => ({ ...prev, [product.code]: currentCount }));
                      
                      // Update main order progress (optimistic update)
                      if (selectedOrder.receivedItems < selectedOrder.itemsCount) {
                        setSelectedOrder((prev: any) => ({
                          ...prev,
                          receivedItems: (prev.receivedItems || 0) + 1
                        }));
                      }

                      return { type: 'success', message: `${product.name} (1 un) validado.`, code: product.code };
                    }}
                    placeholder="Escaneie o EAN do produto..."
                  />
                </div>
              )}

              {/* Progress and Items */}
              <div className="p-4 rounded-xl bg-muted/30 border border-muted space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Progresso da Conferência</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.receivedItems || 0} de {selectedOrder.itemsCount || 0} itens conferidos</p>
                  </div>
                  <span className="text-2xl font-black tabular-nums">
                    {Math.round(((selectedOrder.receivedItems || 0) / (selectedOrder.itemsCount || 1)) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={((selectedOrder.receivedItems || 0) / (selectedOrder.itemsCount || 1)) * 100} 
                  className="h-3" 
                />
              </div>

              {/* Quality Check Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Checklist de Qualidade (QA)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    qualityCheck.damaged ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
                  )}>
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="damaged" 
                        checked={qualityCheck.damaged} 
                        onCheckedChange={(v) => setQualityCheck(prev => ({ ...prev, damaged: !!v }))} 
                      />
                      <Label htmlFor="damaged" className="cursor-pointer">Existem itens avariados/danificados?</Label>
                    </div>
                    {qualityCheck.damaged && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    qualityCheck.qtyMismatch ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
                  )}>
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="mismatch" 
                        checked={qualityCheck.qtyMismatch} 
                        onCheckedChange={(v) => setQualityCheck(prev => ({ ...prev, qtyMismatch: !!v }))} 
                      />
                      <Label htmlFor="mismatch" className="cursor-pointer">Divergência entre NF e Físico?</Label>
                    </div>
                    {qualityCheck.qtyMismatch && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
              </div>

              {/* Simulation of Items List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Box className="h-4 w-4 text-blue-500" />
                  Itens na Ordem
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="h-8 text-[10px] uppercase font-bold">Produto</TableHead>
                        <TableHead className="h-8 text-[10px] uppercase font-bold text-center">Esperado</TableHead>
                        <TableHead className="h-8 text-[10px] uppercase font-bold text-center">Recebido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="py-2">
                          <p className="text-xs font-bold">Produto SKU-001</p>
                          <p className="text-[10px] text-muted-foreground">Caixa com 12 unidades</p>
                        </TableCell>
                        <TableCell className="text-center py-2 text-xs font-mono">{selectedOrder.itemsCount}</TableCell>
                        <TableCell className="text-center py-2 text-xs font-mono font-bold text-primary">{selectedOrder.receivedItems}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cancelar</Button>
            {selectedOrder?.status === 'pending' && (
              <Button onClick={() => handleStart(selectedOrder.id)}>
                <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Recebimento
              </Button>
            )}
            {selectedOrder?.status === 'in_progress' && (
              <Button 
                onClick={() => handleComplete(selectedOrder.id)}
                disabled={selectedOrder.receivedItems < selectedOrder.itemsCount}
                className={cn(
                  selectedOrder.receivedItems < selectedOrder.itemsCount ? "bg-muted text-muted-foreground" : "bg-green-600 hover:bg-green-700"
                )}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Recebimento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

