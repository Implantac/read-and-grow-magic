import { Clock, PlayCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/shared/components/KPICard';

interface Props {
  pendingCount: number;
  inProgressCount: number;
  completedToday: number;
  urgentCount: number;
}

export function PickingKPIs({ pendingCount, inProgressCount, completedToday, urgentCount }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard title="Pendentes" value={pendingCount} subtitle="Aguardando separação" icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
      <KPICard title="Em Andamento" value={inProgressCount} subtitle="Sendo separados" icon={<PlayCircle className="h-5 w-5" />} accentColor="info" index={1} />
      <KPICard title="Concluídos Hoje" value={completedToday} subtitle="Finalizados hoje" icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
      <KPICard title="Urgentes" value={urgentCount} subtitle="Prioridade máxima" icon={<AlertTriangle className="h-5 w-5" />} accentColor={urgentCount > 0 ? 'danger' : 'primary'} index={3} />
    </div>
  );
}
