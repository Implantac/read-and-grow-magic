import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardCheck, Search, MoreHorizontal, PlayCircle, CheckCircle, AlertTriangle, Clock, Eye, ScanBarcode,
} from 'lucide-react';
import { useWMSConference, ConferenceItem } from '@/hooks/useWMSConference';
import { BarcodeScanner, ScanFeedback } from '@/components/wms/BarcodeScanner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluída', variant: 'outline' },
  divergence: { label: 'Divergência', variant: 'destructive' },
};

export default function ConferencePage() {
  const { records, loading, startConference, completeConference, fetchItems, checkItem, scanBarcode, createConference } = useWMSConference();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ConferenceItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isBlind, setIsBlind] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newConf, setNewConf] = useState({ referenceNumber: '', operator: '', conferenceType: 'normal' as string });
  const [newItems, setNewItems] = useState([{ product_code: '', product_name: '', expected_qty: 0 }]);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.conferenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewItems = async (id: string, confType: string) => {
    const items = await fetchItems(id);
    setSelectedItems(items);
    setSelectedRecord(id);
    setIsBlind(confType === 'blind');
    setDetailOpen(true);
  };

  const handleCheckItem = async (itemId: string, qty: number) => {
    await checkItem(itemId, qty);
    if (selectedRecord) {
      const items = await fetchItems(selectedRecord);
      setSelectedItems(items);
    }
  };

  const handleScan = async (code: string): Promise<ScanFeedback> => {
    if (!selectedRecord) {
      return { type: 'error', message: 'Nenhuma conferência selecionada', code };
    }
    const result = await scanBarcode(selectedRecord, code);
    // Refresh items
    const items = await fetchItems(selectedRecord);
    setSelectedItems(items);
    return {
      type: result.success ? 'success' : 'error',
      message: result.message,
      code,
    };
  };

  const handleCreate = async () => {
    const validItems = newItems.filter(i => i.product_code && i.product_name);
    if (validItems.length === 0) return;
    await createConference({
      reference_type: 'manual',
      reference_number: newConf.referenceNumber,
      conference_type: newConf.conferenceType,
      operator: newConf.operator,
      items: validItems,
    });
    setCreateOpen(false);
    setNewConf({ referenceNumber: '', operator: '', conferenceType: 'normal' });
    setNewItems([{ product_code: '', product_name: '', expected_qty: 0 }]);
  };

  const pendingCount = records.filter(r => r.status === 'pending').length;
  const inProgressCount = records.filter(r => r.status === 'in_progress').length;
  const divergenceCount = records.filter(r => r.status === 'divergence').length;

  return (
    <PageContainer>
      <PageHeader title="Conferência" description="Validação obrigatória de itens recebidos e separados">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <ClipboardCheck className="h-4 w-4" /> Nova Conferência
        </Button>
        <ExportButton
          data={filteredRecords as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'conferenceNumber', label: 'Número' },
            { key: 'referenceNumber', label: 'Referência' },
            { key: 'conferenceType', label: 'Tipo' },
            { key: 'status', label: 'Status' },
            { key: 'divergences', label: 'Divergências' },
          ]}
          filename="conferencias_wms"
        />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Pendentes" value={pendingCount} subtitle="Aguardando conferência" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Em Andamento" value={inProgressCount} subtitle="Sendo conferidas" icon={<PlayCircle className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Divergências" value={divergenceCount} subtitle="Requerem ação" icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Total" value={records.length} subtitle="Conferências registradas" icon={<ClipboardCheck className="h-5 w-5" />} accentColor="primary" index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número ou referência..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="divergence">Divergência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScanBarcode className="h-5 w-5" /> Conferências</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Divergências</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(rec => {
                  const cfg = statusConfig[rec.status] || statusConfig.pending;
                  return (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium font-mono">{rec.conferenceNumber}</TableCell>
                      <TableCell>{rec.referenceNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={rec.conferenceType === 'blind' ? 'destructive' : 'outline'}>
                          {rec.conferenceType === 'blind' ? 'Cega' : 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>{rec.operator || '-'}</TableCell>
                      <TableCell className="tabular-nums">{rec.checkedItems}/{rec.totalItems}</TableCell>
                      <TableCell>
                        {rec.divergences > 0 ? (
                          <Badge variant="destructive">{rec.divergences}</Badge>
                        ) : rec.status === 'completed' ? (
                          <Badge variant="outline">0</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewItems(rec.id, rec.conferenceType)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver Itens
                            </DropdownMenuItem>
                            {rec.status === 'pending' && (
                              <DropdownMenuItem onClick={() => startConference(rec.id, 'Operador')}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Iniciar
                              </DropdownMenuItem>
                            )}
                            {rec.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => completeConference(rec.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Concluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <ScanBarcode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhuma conferência encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanBarcode className="h-5 w-5" />
              Itens da Conferência {isBlind && <Badge variant="destructive">Cega</Badge>}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                {!isBlind && <TableHead>Esperado</TableHead>}
                <TableHead>Conferido</TableHead>
                {!isBlind && <TableHead>Divergência</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.productCode}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  {!isBlind && <TableCell className="tabular-nums">{item.expectedQty}</TableCell>}
                  <TableCell>
                    {item.status === 'pending' ? (
                      <Input
                        type="number"
                        className="w-20"
                        placeholder="Qtd"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCheckItem(item.id, Number((e.target as HTMLInputElement).value));
                        }}
                      />
                    ) : <span className="tabular-nums">{item.checkedQty}</span>}
                  </TableCell>
                  {!isBlind && (
                    <TableCell>
                      {item.status === 'checked' && (
                        <span className={item.divergence !== 0 ? 'text-destructive font-bold' : 'text-green-600'}>
                          {item.divergence > 0 ? '+' : ''}{item.divergence}
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={item.status === 'checked' ? (item.divergence !== 0 ? 'destructive' : 'outline') : 'secondary'}>
                      {item.status === 'checked' ? (item.divergence !== 0 ? 'Divergente' : 'OK') : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckItem(item.id, item.expectedQty)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> OK
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Conferência</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Referência</Label>
                <Input value={newConf.referenceNumber} onChange={e => setNewConf(p => ({ ...p, referenceNumber: e.target.value }))} placeholder="Nº pedido/recebimento" />
              </div>
              <div>
                <Label>Operador</Label>
                <Input value={newConf.operator} onChange={e => setNewConf(p => ({ ...p, operator: e.target.value }))} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={newConf.conferenceType} onValueChange={v => setNewConf(p => ({ ...p, conferenceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="blind">Cega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Itens</Label>
              {newItems.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="Código" value={item.product_code} onChange={e => { const arr = [...newItems]; arr[i].product_code = e.target.value; setNewItems(arr); }} />
                  <Input placeholder="Nome" value={item.product_name} onChange={e => { const arr = [...newItems]; arr[i].product_name = e.target.value; setNewItems(arr); }} />
                  <Input type="number" placeholder="Qtd esperada" value={item.expected_qty || ''} onChange={e => { const arr = [...newItems]; arr[i].expected_qty = Number(e.target.value); setNewItems(arr); }} />
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewItems([...newItems, { product_code: '', product_name: '', expected_qty: 0 }])}>
                + Adicionar Item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Conferência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
