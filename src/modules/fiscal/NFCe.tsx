import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toastSuccess } from '@/lib/toastHelpers';
import { formatBRL, formatDate } from '@/lib/formatters';

import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { OfflinePDVIndicator } from '@/components/pdv/OfflinePDVIndicator';

import { useNFCe } from '@/hooks/fiscal/useNFCe';
import { NFCeCancelDialog } from '@/components/fiscal/NFCeCancelDialog';
import { NFCeReturnDialog } from '@/components/fiscal/NFCeReturnDialog';
import type { NFCe } from '@/types/fiscal';

import { NFCeKPIs } from './nfce/NFCeKPIs';
import { NFCeFilters } from './nfce/NFCeFilters';
import { NFCeTable } from './nfce/NFCeTable';
import { NFCeDetailsDialog } from './nfce/NFCeDetailsDialog';

export default function NFCePage() {
  const navigate = useNavigate();
  const { nfces, loading, cancel: cancelNFCe, createReturn } = useNFCe();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [terminalFilter, setTerminalFilter] = useState<string>('all');
  const [selectedNFCe, setSelectedNFCe] = useState<NFCe | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<NFCe | null>(null);
  const [returnTarget, setReturnTarget] = useState<NFCe | null>(null);

  // Mantém o modal de detalhes sincronizado com atualizações em tempo real
  useEffect(() => {
    if (!selectedNFCe) return;
    const fresh = nfces.find((n) => n.id === selectedNFCe.id);
    if (fresh && fresh !== selectedNFCe) setSelectedNFCe(fresh);
  }, [nfces, selectedNFCe]);

  const terminals = useMemo(() => [...new Set(nfces.map((n) => n.terminalId))], [nfces]);

  const filteredNFCes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return nfces.filter((nfce) => {
      const matchesSearch =
        nfce.number.toLowerCase().includes(term) ||
        (nfce.customerName?.toLowerCase().includes(term) ?? false) ||
        nfce.accessKey.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || nfce.status === statusFilter;
      const matchesTerminal = terminalFilter === 'all' || nfce.terminalId === terminalFilter;
      return matchesSearch && matchesStatus && matchesTerminal;
    });
  }, [nfces, searchTerm, statusFilter, terminalFilter]);

  const handleView = (n: NFCe) => {
    setSelectedNFCe(n);
    setDetailsOpen(true);
  };
  const handlePrint = (n: NFCe) => toastSuccess('Imprimindo Cupom', `Cupom fiscal ${n.number} enviado para impressão`);
  const handleReprint = (n: NFCe) => toastSuccess('2ª Via', `Reimpressão do cupom ${n.number} enviada`);

  return (
    <PageContainer>
      <PageHeader title="NFC-e - Nota Fiscal de Consumidor" description="Gerencie suas notas fiscais de consumidor eletrônicas">
        <ExportButton
          data={filteredNFCes as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Número' },
            { key: 'customerName', label: 'Cliente' },
            { key: 'totalValue', label: 'Valor', format: (v) => formatBRL(Number(v)) },
            { key: 'paymentMethod', label: 'Pagamento' },
            { key: 'status', label: 'Status' },
            { key: 'issuedAt', label: 'Emissão', format: (v) => formatDate(v as string) },
            { key: 'terminalId', label: 'Terminal' },
          ]}
          filename="nfce"
        />
        <OfflinePDVIndicator />
        <Button className="gap-2" onClick={() => navigate('/comercial/pdv')}>
          <Plus className="h-4 w-4" />
          Nova Venda PDV
        </Button>
      </PageHeader>

      <NFCeKPIs nfces={nfces} />

      <NFCeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        terminalFilter={terminalFilter}
        onTerminalChange={setTerminalFilter}
        terminals={terminals}
      />

      <NFCeTable
        nfces={filteredNFCes}
        onView={handleView}
        onReprint={handleReprint}
        onReturn={(n) => setReturnTarget(n)}
        onCancel={(n) => setCancelTarget(n)}
      />

      <NFCeDetailsDialog
        nfce={selectedNFCe}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onPrint={handlePrint}
      />

      <NFCeCancelDialog
        nfce={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(v) => { if (!v) setCancelTarget(null); }}
        onConfirm={async (reason) => {
          if (!cancelTarget) return false;
          return cancelNFCe(cancelTarget.id, reason);
        }}
      />

      <NFCeReturnDialog
        nfce={returnTarget}
        open={!!returnTarget}
        onOpenChange={(v) => { if (!v) setReturnTarget(null); }}
        onConfirm={async ({ reason, refundMethod, items }) => {
          if (!returnTarget) return null;
          return createReturn({
            nfceId: returnTarget.id,
            reason,
            refundMethod,
            items,
            terminalId: returnTarget.terminalId,
            operatorName: returnTarget.operatorName,
          });
        }}
      />
    </PageContainer>
  );
}
