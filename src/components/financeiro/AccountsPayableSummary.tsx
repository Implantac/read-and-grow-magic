import { DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { KPICard } from '@/shared/components/KPICard';
import { formatBRL } from '@/lib/formatters';

interface SummaryData {
  total: number;
  pending: number;
  overdue: number;
  paid: number;
  pendingCount: number;
}

interface AccountsPayableSummaryProps {
  summary: SummaryData;
}

export function AccountsPayableSummary({ summary }: AccountsPayableSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard 
        title="Total em Aberto" 
        value={formatBRL(summary.total)} 
        icon={<DollarSign className="h-5 w-5" />} 
        accentColor="primary" 
        index={0} 
      />
      <KPICard 
        title="A Vencer" 
        value={formatBRL(summary.pending)} 
        subtitle={`${summary.pendingCount} títulos`} 
        icon={<Clock className="h-5 w-5" />} 
        accentColor="warning" 
        index={1} 
      />
      <KPICard 
        title="Vencido" 
        value={formatBRL(summary.overdue)} 
        icon={<AlertTriangle className="h-5 w-5" />} 
        accentColor="danger" 
        index={2} 
      />
      <KPICard 
        title="Pago" 
        value={formatBRL(summary.paid)} 
        icon={<CheckCircle className="h-5 w-5" />} 
        accentColor="success" 
        index={3} 
      />
    </div>
  );
}
