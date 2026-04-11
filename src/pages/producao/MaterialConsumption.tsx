import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PackageMinus, Search, Package, Eye, Plus, CheckCircle, AlertTriangle, MapPin, Box } from 'lucide-react';
import { MaterialConsumption } from '@/types/production';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';

export default function MaterialConsumptionPage() {
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [consumeQty, setConsumeQty] = useState(0);

  const activeOrders: { orderNumber: string }[] = [];

  const filteredConsumptions = consumptions.filter(consumption => {
    const matchesSearch = consumption.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || consumption.componentName.toLowerCase().includes(searchTerm.toLowerCase()) || consumption.componentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrder = orderFilter === 'all' || consumption.orderNumber === orderFilter;
    return matchesSearch && matchesOrder;
  });

  const totalExpected = consumptions.reduce((sum, c) => sum + c.expectedQuantity, 0);
  const totalConsumed = consumptions.reduce((sum, c) => sum + c.consumedQuantity, 0);
  const pendingItems = consumptions.filter(c => c.consumedQuantity < c.expectedQuantity).length;
  const consumptionRate = totalExpected > 0 ? Math.round((totalConsumed / totalExpected) * 100) : 0;

  const handleViewDetails = (consumption: MaterialConsumption) => { setSelectedConsumption(consumption); setDetailsOpen(true); };
  const handleOpenConsume = (consumption: MaterialConsumption) => { setSelectedConsumption(consumption); setConsumeQty(consumption.expectedQuantity - consumption.consumedQuantity); setConsumeOpen(true); };

  const handleConfirmConsume = () => {
    if (!selectedConsumption) return;
    setConsumptions(consumptions.map(c => c.id === selectedConsumption.id ? { ...c, consumedQuantity: c.consumedQuantity + consumeQty, consumedAt: new Date().toISOString(), consumedBy: 'Usuário Atual' } : c));
    toast.success('Consumo registrado com sucesso!');
    setConsumeOpen(false); setSelectedConsumption(null);
  };

  const getConsumptionStatus = (consumption: MaterialConsumption) => {
    const percentage = (consumption.consumedQuantity / consumption.expectedQuantity) * 100;
    if (percentage >= 100) return { label: 'Completo', variant: 'outline' as const };
    if (percentage > 0) return { label: 'Parcial', variant: 'secondary' as const };
    return { label: 'Pendente', variant: 'destructive' as const };
  };

  return (
    <PageContainer>
      <PageHeader title="Consumo de Matéria-Prima" description="Registro e acompanhamento do consumo de materiais">
        <ExportButton data={filteredConsumptions as unknown as Record<string, unknown>[]} columns={[
          { key: 'orderNumber', label: 'Ordem' }, { key: 'componentCode', label: 'Código' },
          { key: 'componentName', label: 'Material' }, { key: 'expectedQuantity', label: 'Qtd Esperada' },
          { key: 'consumedQuantity', label: 'Qtd Consumida' }, { key: 'unit', label: 'Unidade' },
        ]} filename="consumo_materiais" />
        <Button><Plus className="h-4 w-4 mr-2" />Registrar Consumo</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total Esperado" value={totalExpected} subtitle="Unidades planejadas" icon={<Package className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Total Consumido" value={totalConsumed} subtitle="Unidades consumidas" icon={<PackageMinus className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Taxa de Consumo" value={`${consumptionRate}%`} subtitle="Do planejado" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Itens Pendentes" value={pendingItems} subtitle="Aguardando consumo" icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por ordem, componente ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="Ordem de Produção" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as Ordens</SelectItem>{activeOrders.map(order => <SelectItem key={order.orderNumber} value={order.orderNumber}>{order.orderNumber}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><PackageMinus className="h-5 w-5" />Registros de Consumo</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ordem</TableHead><TableHead>Componente</TableHead><TableHead>Esperado</TableHead>
              <TableHead>Consumido</TableHead><TableHead>Progresso</TableHead><TableHead>Lote</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredConsumptions.map((consumption) => {
                const status = getConsumptionStatus(consumption);
                const progress = Math.round((consumption.consumedQuantity / consumption.expectedQuantity) * 100);
                return (
                  <TableRow key={consumption.id}>
                    <TableCell className="font-medium">{consumption.orderNumber}</TableCell>
                    <TableCell><div><p className="font-medium">{consumption.componentName}</p><p className="text-sm text-muted-foreground">{consumption.componentCode}</p></div></TableCell>
                    <TableCell>{consumption.expectedQuantity} {consumption.unit}</TableCell>
                    <TableCell>{consumption.consumedQuantity} {consumption.unit}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><Progress value={progress} className="w-20 h-2" /><span className="text-sm text-muted-foreground">{progress}%</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-1"><Box className="h-3 w-3 text-muted-foreground" />{consumption.batch || '-'}</div></TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(consumption)}><Eye className="h-4 w-4" /></Button>
                        {consumption.consumedQuantity < consumption.expectedQuantity && <Button variant="outline" size="sm" onClick={() => handleOpenConsume(consumption)}><PackageMinus className="h-4 w-4 mr-1" />Consumir</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredConsumptions.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Consumo</DialogTitle></DialogHeader>
          {selectedConsumption && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Ordem de Produção</p><p className="font-medium">{selectedConsumption.orderNumber}</p></div>
                <div><p className="text-sm text-muted-foreground">Componente</p><p className="font-medium">{selectedConsumption.componentName}</p><p className="text-sm text-muted-foreground">{selectedConsumption.componentCode}</p></div>
                <div><p className="text-sm text-muted-foreground">Quantidade Esperada</p><p className="font-medium">{selectedConsumption.expectedQuantity} {selectedConsumption.unit}</p></div>
                <div><p className="text-sm text-muted-foreground">Quantidade Consumida</p><p className="font-medium">{selectedConsumption.consumedQuantity} {selectedConsumption.unit}</p></div>
                <div><p className="text-sm text-muted-foreground">Lote</p><p className="font-medium">{selectedConsumption.batch || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Localização</p><div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><p className="font-medium">{selectedConsumption.location || '-'}</p></div></div>
                <div><p className="text-sm text-muted-foreground">Consumido Por</p><p className="font-medium">{selectedConsumption.consumedBy}</p></div>
                <div><p className="text-sm text-muted-foreground">Data/Hora</p><p className="font-medium">{format(new Date(selectedConsumption.consumedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={consumeOpen} onOpenChange={setConsumeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Consumo</DialogTitle></DialogHeader>
          {selectedConsumption && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg"><p className="font-medium">{selectedConsumption.componentName}</p><p className="text-sm text-muted-foreground">{selectedConsumption.componentCode}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Esperado</p><p className="font-medium">{selectedConsumption.expectedQuantity} {selectedConsumption.unit}</p></div>
                <div><p className="text-sm text-muted-foreground">Já Consumido</p><p className="font-medium">{selectedConsumption.consumedQuantity} {selectedConsumption.unit}</p></div>
              </div>
              <div>
                <label className="text-sm font-medium">Quantidade a Consumir</label>
                <Input type="number" min={0} max={selectedConsumption.expectedQuantity - selectedConsumption.consumedQuantity} value={consumeQty} onChange={(e) => setConsumeQty(parseInt(e.target.value) || 0)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Máximo: {selectedConsumption.expectedQuantity - selectedConsumption.consumedQuantity} {selectedConsumption.unit}</p>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setConsumeOpen(false)}>Cancelar</Button><Button onClick={handleConfirmConsume}>Confirmar Consumo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
