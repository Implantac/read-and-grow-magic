import { KPICard } from '@/shared/components/KPICard';
import { DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import { AccountReceivable } from '@/types/financial';

interface Props {
  accounts: AccountReceivable[];
}

export function AccountsReceivableSummary({ accounts }: Props) {
  const now = new Date();
  const pendingAccounts = accounts.filter(a => a.status !== 'paid' && a.status !== 'cancelled');
  
  const summaryData = {
    total: pendingAccounts.reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    pending: accounts.filter(a => a.status === 'pending').reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    overdue: accounts.filter(a => {
      const isOverdue = a.status === 'overdue' || (a.status === 'pending' && new Date(a.due_date) < now);
      return isOverdue;
    }).reduce((s, a) => s + Number(a.open_amount ?? a.amount), 0),
    received: accounts.filter(a => a.status === 'paid').reduce((s, a) => s + Number(a.paid_amount ?? a.amount), 0),
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard title="Total em Aberto" value={formatBRL(summaryData.total)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
      <KPICard title="A Vencer" value={formatBRL(summaryData.pending)} subtitle={`${accounts.filter(a => a.status === 'pending').length} títulos`} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
      <KPICard title="Vencido" value={formatBRL(summaryData.overdue)} subtitle={`${accounts.filter(a => a.status === 'overdue' || (a.status === 'pending' && new Date(a.due_date) < now)).length} títulos`} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
      <KPICard title="Recebido" value={formatBRL(summaryData.received)} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
    </div>
  );
}
