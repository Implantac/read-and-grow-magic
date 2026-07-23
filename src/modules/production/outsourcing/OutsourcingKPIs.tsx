import { KPICard } from '@/shared/components/KPICard';
import { Truck, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';

export function OutsourcingKPIs({ pendingCount, lateCount, returnedCount, totalCost }: {
  pendingCount: number; lateCount: number; returnedCount: number; totalCost: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard title="Em Andamento" value={pendingCount} icon={<Truck className="h-5 w-5" />} accentColor="primary" index={0} />
      <KPICard title="Atrasadas" value={lateCount} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={1} />
      <KPICard title="Retornadas" value={returnedCount} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
      <KPICard title="Custo Total" value={formatBRL(totalCost)} icon={<DollarSign className="h-5 w-5" />} accentColor="warning" index={3} />
    </div>
  );
}
