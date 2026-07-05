import { useState } from 'react';
import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timer, Search, Clock, Play, Pause, CheckCircle, Eye, PlayCircle, StopCircle, AlertCircle, User, Wrench } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useTimeEntries, TimeEntryRow } from '@/hooks/system/useTimeEntries';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';


const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  started: { label: 'Em Andamento', variant: 'default', icon: <PlayCircle className="h-4 w-4" /> },
  paused: { label: 'Pausado', variant: 'secondary', icon: <Pause className="h-4 w-4" /> },
  completed: { label: 'Concluído', variant: 'outline', icon: <CheckCircle className="h-4 w-4" /> },
};

export default function TimeEntriesPage() {
  const { entries, loading, create, update } = useTimeEntries();
  const { orders, update: updateOrder } = useProductionOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workCenterFilter, setWorkCenterFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ orderId: '', operationName: '', workCenter: '', operator: '' });

  const activeOrders = orders.filter(o => ['planned', 'in_progress'].includes(o.status));
  const workCenters = [...new Set(entries.map(e => e.work_center).filter(Boolean))];

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      entry.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.operation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesWorkCenter = workCenterFilter === 'all' || entry.work_center === workCenterFilter;
    return matchesSearch && matchesStatus && matchesWorkCenter;
  });

  const today = new Date().toDateString();
  const activeCount = entries.filter(e => e.status === 'started').length;
  const pausedCount = entries.filter(e => e.status === 'paused').length;
  const completedToday = entries.filter(e => e.status === 'completed' && e.end_time && new Date(e.end_time).toDateString() === today).length;
  const totalProduced = entries.filter(e => new Date(e.start_time).toDateString() === today).reduce((s, e) => s + e.produced_quantity, 0);
  const totalRejected = entries.filter(e => new Date(e.start_time).toDateString() === today).reduce((s, e) => s + e.rejected_quantity, 0);

  const handlePause = async (entry: TimeEntryRow) => {
    await update(entry.id, { status: 'paused' });
    toast.info(`Apontamento pausado: ${entry.operation_name}`);
  };

  const handleResume = async (entry: TimeEntryRow) => {
    await update(entry.id, { status: 'started' });
    toast.success(`Apontamento retomado: ${entry.operation_name}`);
  };

  const handleComplete = async (entry: TimeEntryRow) => {
    await update(entry.id, { status: 'completed', end_time: new Date().toISOString() });
    // Update production order produced quantity
    if (entry.production_order_id && entry.produced_quantity > 0) {
      const order = orders.find(o => o.id === entry.production_order_id);
      if (order) {
        await updateOrder(order.id, {
          produced_quantity: order.produced_quantity + entry.produced_quantity,
          rejected_quantity: order.rejected_quantity + entry.rejected_quantity,
        });
      }
    }
    toast.success(`Apontamento concluído: ${entry.operation_name}`);
  };

  const handleStartNew = async () => {
    if (!newEntry.orderId || !newEntry.operationName || !newEntry.operator) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const order = orders.find(o => o.id === newEntry.orderId);
    if (!order) return;

    await create({
      production_order_id: newEntry.orderId,
      order_number: order.order_number,
      operation_id: null,
      operation_name: newEntry.operationName,
      operator: newEntry.operator,
      start_time: new Date().toISOString(),
      end_time: null,
      paused_time: 0,
      produced_quantity: 0,
      rejected_quantity: 0,
      status: 'started',
      notes: null,
      work_center: newEntry.workCenter || null,
    });

    // Auto start OP if planned
    if (order.status === 'planned') {
      await updateOrder(order.id, { status: 'in_progress', start_date: new Date().toISOString() });
    }

    setStartOpen(false);
    setNewEntry({ orderId: '', operationName: '', workCenter: '', operator: '' });
  };

  const getElapsedTime = (entry: TimeEntryRow) => {
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : new Date();
    const minutes = Math.max(0, differenceInMinutes(end, start) - (entry.paused_time || 0));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Apontamentos" description="Registro de tempo e produção por operação">
        <ExportButton
          data={filteredEntries as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'order_number', label: 'Ordem' },
            { key: 'operation_name', label: 'Operação' },
            { key: 'operator', label: 'Operador' },
            { key: 'work_center', label: 'Centro de Trabalho' },
            { key: 'produced_quantity', label: 'Produzido' },
            { key: 'rejected_quantity', label: 'Rejeitado' },
            { key: 'status', label: 'Status' },
          ]}
          filename="apontamentos"
        />
        <Button onClick={() => setStartOpen(true)}>
          <Play className="h-4 w-4 mr-2" />Novo Apontamento
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-5">
        <KPICard title="Em Andamento" value={activeCount} subtitle="Operações ativas" icon={<PlayCircle className="h-5 w-5" />} accentColor="success" index={0} />
        <KPICard title="Pausados" value={pausedCount} subtitle="Aguardando" icon={<Pause className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Concluídos Hoje" value={completedToday} subtitle="Finalizados" icon={<CheckCircle className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="Produzidos Hoje" value={totalProduced} subtitle="Peças boas" icon={<CheckCircle className="h-5 w-5" />} accentColor="info" index={3} />
        <KPICard title="Rejeitados Hoje" value={totalRejected} subtitle="Refugo" icon={<AlertCircle className="h-5 w-5" />} accentColor="danger" index={4} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por ordem, operação ou operador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="started">Em Andamento</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workCenterFilter} onValueChange={setWorkCenterFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Centro de Trabalho" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Centros</SelectItem>
                {workCenters.map(wc => (
                  <SelectItem key={wc!} value={wc!}>{wc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" />Apontamentos de Produção</CardTitle></CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={Timer}
              title={entries.length === 0 ? 'Nenhum apontamento registrado' : 'Nenhum apontamento encontrado'}
              description={entries.length === 0
                ? 'Inicie um apontamento para acompanhar o tempo e a produção por operação.'
                : 'Ajuste a busca ou os filtros para localizar o apontamento desejado.'}
              action={entries.length === 0
                ? { label: 'Novo Apontamento', onClick: () => setStartOpen(true), icon: Play }
                : { label: 'Limpar filtros', onClick: () => { setSearchTerm(''); setStatusFilter('all'); setWorkCenterFilter('all'); }, variant: 'outline' }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Produzido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const sc = statusConfig[entry.status] || statusConfig.completed;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium font-mono text-sm">{entry.order_number}</TableCell>
                      <TableCell>{entry.operation_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {entry.operator}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          {entry.work_center || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {getElapsedTime(entry)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 dark:text-green-400">{entry.produced_quantity}</span>
                        {entry.rejected_quantity > 0 && (
                          <span className="text-destructive ml-1">/ -{entry.rejected_quantity}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="gap-1">
                          {sc.icon}{sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedEntry(entry); setDetailsOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {entry.status === 'started' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handlePause(entry)}>
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button variant="default" size="sm" onClick={() => handleComplete(entry)}>
                                <StopCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {entry.status === 'paused' && (
                            <Button variant="outline" size="sm" onClick={() => handleResume(entry)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Apontamento</DialogTitle></DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Ordem de Produção</p><p className="font-medium">{selectedEntry.order_number}</p></div>
                <div><p className="text-sm text-muted-foreground">Operação</p><p className="font-medium">{selectedEntry.operation_name}</p></div>
                <div><p className="text-sm text-muted-foreground">Operador</p><p className="font-medium">{selectedEntry.operator}</p></div>
                <div><p className="text-sm text-muted-foreground">Centro de Trabalho</p><p className="font-medium">{selectedEntry.work_center || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Início</p><p className="font-medium">{format(new Date(selectedEntry.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>
                <div><p className="text-sm text-muted-foreground">Término</p><p className="font-medium">{selectedEntry.end_time ? format(new Date(selectedEntry.end_time), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Tempo Total</p><p className="font-medium">{getElapsedTime(selectedEntry)}</p></div>
                <div><p className="text-sm text-muted-foreground">Tempo Pausado</p><p className="font-medium">{selectedEntry.paused_time || 0} min</p></div>
                <div><p className="text-sm text-muted-foreground">Quantidade Produzida</p><p className="font-medium text-green-600 dark:text-green-400">{selectedEntry.produced_quantity} UN</p></div>
                <div><p className="text-sm text-muted-foreground">Quantidade Rejeitada</p><p className="font-medium text-destructive">{selectedEntry.rejected_quantity} UN</p></div>
              </div>
              {selectedEntry.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedEntry.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Entry Dialog */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Apontamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Operador *</label>
              <Input
                value={newEntry.operator}
                onChange={e => setNewEntry({ ...newEntry, operator: e.target.value })}
                placeholder="Nome do operador"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ordem de Produção *</label>
              <Select value={newEntry.orderId} onValueChange={v => setNewEntry({ ...newEntry, orderId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma OP" /></SelectTrigger>
                <SelectContent>
                  {activeOrders.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.order_number} — {o.product_name} ({o.produced_quantity}/{o.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Operação / Etapa *</label>
              <Input
                value={newEntry.operationName}
                onChange={e => setNewEntry({ ...newEntry, operationName: e.target.value })}
                placeholder="Ex: Corte, Costura, Estamparia"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Centro de Trabalho</label>
              <Input
                value={newEntry.workCenter}
                onChange={e => setNewEntry({ ...newEntry, workCenter: e.target.value })}
                placeholder="Ex: Setor A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>Cancelar</Button>
            <Button onClick={handleStartNew} disabled={!newEntry.orderId || !newEntry.operationName || !newEntry.operator}>
              <Play className="h-4 w-4 mr-2" /> Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
