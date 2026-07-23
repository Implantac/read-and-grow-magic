import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { ClipboardCheck, PlayCircle, AlertTriangle, Clock } from 'lucide-react';
import { useWMSConference, ConferenceItem } from '@/hooks/wms/useWMSConference';
import { ScanFeedback } from '@/components/wms/BarcodeScanner';
import { ConferenceFilters } from './conference/ConferenceFilters';
import { ConferenceTable } from './conference/ConferenceTable';
import { ConferenceDetailDialog } from './conference/ConferenceDetailDialog';
import { CreateConferenceDialog } from './conference/CreateConferenceDialog';

export default function ConferencePage() {
  const { records, loading, startConference, completeConference, fetchItems, checkItem, scanBarcode, createConference, finalizeReceivingToLedger } = useWMSConference();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ConferenceItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isBlind, setIsBlind] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newConf, setNewConf] = useState({ referenceNumber: '', operator: '', conferenceType: 'normal' });
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
    if (selectedRecord) setSelectedItems(await fetchItems(selectedRecord));
  };

  const handleScan = async (code: string): Promise<ScanFeedback> => {
    if (!selectedRecord) return { type: 'error', message: 'Nenhuma conferência selecionada', code };
    const result = await scanBarcode(selectedRecord, code);
    setSelectedItems(await fetchItems(selectedRecord));
    return { type: result.success ? 'success' : 'error', message: result.message, code };
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

      <ConferenceFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} statusFilter={statusFilter} onStatusChange={setStatusFilter} />

      <ConferenceTable
        loading={loading}
        records={filteredRecords}
        onViewItems={handleViewItems}
        onStart={(id) => startConference(id, 'Operador')}
        onComplete={(id) => completeConference(id)}
        onFinalize={(id) => finalizeReceivingToLedger(id)}
      />

      <ConferenceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isBlind={isBlind}
        items={selectedItems}
        onScan={handleScan}
        onCheckItem={handleCheckItem}
      />

      <CreateConferenceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        newConf={newConf}
        setNewConf={(fn) => setNewConf(fn)}
        newItems={newItems}
        setNewItems={setNewItems}
        onCreate={handleCreate}
      />
    </PageContainer>
  );
}
