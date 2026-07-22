import { Receipt, CreditCard, XCircle, CheckCircle } from 'lucide-react';
import { KPICard } from '@/shared/components/KPICard';
import { formatBRL } from '@/lib/formatters';
import type { NFCe } from '@/types/fiscal';

export function NFCeKPIs({ nfces }: { nfces: NFCe[] }) {
  const total = nfces.length;
  const cancelled = nfces.filter((n) => n.status === 'cancelled').length;
  const avgTicket = total > 0 ? nfces.reduce((s, n) => s + n.total, 0) / total : 0;
  const approval = total > 0 ? (((total - cancelled) / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard title="NFC-e Emitidas" value={String(total)} icon={<Receipt className="h-5 w-5" />} accentColor="primary" index={0} />
      <KPICard title="Ticket Médio" value={formatBRL(avgTicket)} icon={<CreditCard className="h-5 w-5" />} accentColor="info" index={1} />
      <KPICard title="Canceladas" value={String(cancelled)} icon={<XCircle className="h-5 w-5" />} accentColor="danger" index={2} />
      <KPICard title="Taxa Aprovação" value={`${approval}%`} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
    </div>
  );
}
