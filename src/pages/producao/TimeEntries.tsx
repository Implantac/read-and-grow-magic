import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timer, Search, Clock, Play, Pause, CheckCircle, Eye, PlayCircle, StopCircle, AlertCircle, User, Wrench } from 'lucide-react';
import { TimeEntry, TimeEntryStatus } from '@/types/production';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';

const statusConfig: Record<TimeEntryStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  started: { label: 'Em Andamento', variant: 'default', icon: <PlayCircle className="h-4 w-4" /> },
  paused: { label: 'Pausado', variant: 'secondary', icon: <Pause className="h-4 w-4" /> },
  completed: { label: 'Concluído', variant: 'outline', icon: <CheckCircle className="h-4 w-4" /> }
};

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workCenterFilter, setWorkCenterFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ orderId: '', operationName: '', workCenter: '' });

  const activeOrders: { orderNumber: string }[] = [];

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || entry.operationName.toLowerCase().includes(searchTerm.toLowerCase()) || entry.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesWorkCenter = workCenterFilter === 'all' || entry.workCenter === workCenterFilter;
    return matchesSearch && matchesStatus && matchesWorkCenter;
  });

  const activeCount = entries.filter(e => e.status === 'started').length;
  const pausedCount = entries.filter(e => e.status === 'paused').length;
  const completedToday = entries.filter(e => e.status === 'completed' && e.endTime && format(new Date(e.endTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;
  const totalProduced = entries.reduce((sum, e) => sum + e.producedQuantity, 0);
  const totalRejected = entries.reduce((sum, e) => sum + e.rejectedQuantity, 0);

  const handleViewDetails = (entry: TimeEntry) => { setSelectedEntry(entry); setDetailsOpen(true); };
  const handlePause = (entry: TimeEntry) => { setEntries(entries.map(e => e.id === entry.id ? { ...e, status: 'paused' as TimeEntryStatus } : e)); toast.info(`Apontamento pausado: ${entry.operationName}`); };
  const handleResume = (entry: TimeEntry) => { setEntries(entries.map(e => e.id === entry.id ? { ...e, status: 'started' as TimeEntryStatus } : e)); toast.success(`Apontamento retomado: ${entry.operationName}`); };
  const handleComplete = (entry: TimeEntry) => { setEntries(entries.map(e => e.id === entry.id ? { ...e, status: 'completed' as TimeEntryStatus, endTime: new Date().toISOString() } : e)); toast.success(`Apontamento concluído: ${entry.operationName}`); };

  const handleStartNew = () => {
    const order = activeOrders.find(o => o.orderNumber === newEntry.orderId);
    if (!order) return;
    const newTimeEntry: TimeEntry = { id: `te${Date.now()}`, productionOrderId: newEntry.orderId, orderNumber: order.orderNumber, operationId: `op${Date.now()}`, operationName: newEntry.operationName, operator: 'Usuário Atual', startTime: new Date().toISOString(), producedQuantity: 0, rejectedQuantity: 0, status: 'started', workCenter: newEntry.workCenter };
    setEntries([newTimeEntry, ...entries]);
    toast.success('Novo apontamento iniciado!');
    setStartOpen(false); setNewEntry({ orderId: '', operationName: '', workCenter: '' });
  };

  const getElapsedTime = (entry: TimeEntry) => {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    const minutes = differenceInMinutes(end, start) - (entry.pausedTime || 0);
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <PageContainer>
      <PageHeader title="Apontamentos" description="Registro de tempo e produção por operação">
        <ExportButton data={filteredEntries as unknown as Record<string, unknown>[]} columns={[
          { key: 'orderNumber', label: 'Ordem' }, { key: 'operationName', label: 'Operação' },
          { key: 'operator', label: 'Operador' }, { key: 'workCenter', label: 'Centro de Trabalho' },
          { key: 'producedQuantity', label: 'Produzido' }, { key: 'rejectedQuantity', label: 'Rejeitado' },
          { key: 'status', label: 'Status' },
        ]} filename="apontamentos" />
        <Button onClick={() => setStartOpen(true)}><Play className="h-4 w-4 mr-2" />Novo Apontamento</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-5">
        <KPICard title="Em Andamento" value={activeCount} subtitle="Operações ativas" icon={<PlayCircle className="h-5 w-5" />} accentColor="success" index={0} />
        <KPICard title="Pausados" value={pausedCount} subtitle="Aguardando" icon={<Pause className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Concluídos Hoje" value={completedToday} subtitle="Finalizados" icon={<CheckCircle className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="Produzidos" value={totalProduced} subtitle="Unidades boas" icon={<CheckCircle className="h-5 w-5" />} accentColor="info" index={3} />
        <KPICard title="Rejeitados" value={totalRejected} subtitle="Unidades ruins" icon={<AlertCircle className="h-5 w-5" />} accentColor="danger" index={4} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por ordem, operação ou operador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Status</SelectItem><SelectItem value="started">Em Andamento</SelectItem><SelectItem value="paused">Pausado</SelectItem><SelectItem value="completed">Concluído</SelectItem></SelectContent>
            </Select>
            <Select value={workCenterFilter} onValueChange={setWorkCenterFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Centro de Trabalho" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Centros</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" />Apontamentos de Produção</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ordem</TableHead><TableHead>Operação</TableHead><TableHead>Operador</TableHead>
              <TableHead>Centro</TableHead><TableHead>Tempo</TableHead><TableHead>Produzido</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.orderNumber}</TableCell>
                  <TableCell>{entry.operationName}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><User className="h-3 w-3 text-muted-foreground" />{entry.operator}</div></TableCell>
                  <TableCell><div className="flex items-center gap-1"><Wrench className="h-3 w-3 text-muted-foreground" />{entry.workCenter}</div></TableCell>
                  <TableCell><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{getElapsedTime(entry)}</div></TableCell>
                  <TableCell><span className="text-success">{entry.producedQuantity}</span>{entry.rejectedQuantity > 0 && <span className="text-destructive ml-1">/ -{entry.rejectedQuantity}</span>}</TableCell>
                  <TableCell><Badge variant={statusConfig[entry.status].variant} className="gap-1">{statusConfig[entry.status].icon}{statusConfig[entry.status].label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(entry)}><Eye className="h-4 w-4" /></Button>
                      {entry.status === 'started' && (<><Button variant="outline" size="sm" onClick={() => handlePause(entry)}><Pause className="h-4 w-4" /></Button><Button variant="default" size="sm" onClick={() => handleComplete(entry)}><StopCircle className="h-4 w-4" /></Button></>)}
                      {entry.status === 'paused' && <Button variant="outline" size="sm" onClick={() => handleResume(entry)}><Play className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum apontamento encontrado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Apontamento</DialogTitle></DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Ordem de Produção</p><p className="font-medium">{selectedEntry.orderNumber}</p></div>
                <div><p className="text-sm text-muted-foreground">Operação</p><p className="font-medium">{selectedEntry.operationName}</p></div>
                <div><p className="text-sm text-muted-foreground">Operador</p><p className="font-medium">{selectedEntry.operator}</p></div>
                <div><p className="text-sm text-muted-foreground">Centro de Trabalho</p><p className="font-medium">{selectedEntry.workCenter}</p></div>
                <div><p className="text-sm text-muted-foreground">Início</p><p className="font-medium">{format(new Date(selectedEntry.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>
                <div><p className="text-sm text-muted-foreground">Término</p><p className="font-medium">{selectedEntry.endTime ? format(new Date(selectedEntry.endTime), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Tempo Total</p><p className="font-medium">{getElapsedTime(selectedEntry)}</p></div>
                <div><p className="text-sm text-muted-foreground">Tempo Pausado</p><p className="font-medium">{selectedEntry.pausedTime || 0} min</p></div>
                <div><p className="text-sm text-muted-foreground">Quantidade Produzida</p><p className="font-medium text-success">{selectedEntry.producedQuantity} UN</p></div>
                <div><p className="text-sm text-muted-foreground">Quantidade Rejeitada</p><p className="font-medium text-destructive">{selectedEntry.rejectedQuantity} UN</p></div>
              </div>
              {selectedEntry.notes && <div><p className="text-sm text-muted-foreground">Observações</p><p className="p-3 bg-muted rounded-lg">{selectedEntry.notes}</p></div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent><DialogHeader><DialogTitle>Novo Apontamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Ordem de Produção</label>
              <Select value={newEntry.orderId} onValueChange={v => setNewEntry({...newEntry, orderId: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{activeOrders.map(o => <SelectItem key={o.orderNumber} value={o.orderNumber}>{o.orderNumber}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Operação</label><Input value={newEntry.operationName} onChange={e => setNewEntry({...newEntry, operationName: e.target.value})} placeholder="Ex: Corte" /></div>
            <div><label className="text-sm font-medium">Centro de Trabalho</label><Input value={newEntry.workCenter} onChange={e => setNewEntry({...newEntry, workCenter: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStartOpen(false)}>Cancelar</Button><Button onClick={handleStartNew}>Iniciar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
