import { KPICard } from '@/shared/components/KPICard';
import { PlayCircle, Pause, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  activeCount: number;
  pausedCount: number;
  completedToday: number;
  totalProduced: number;
  totalRejected: number;
}

export function TimeEntriesKPIs({ activeCount, pausedCount, completedToday, totalProduced, totalRejected }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <KPICard title="Em Andamento" value={activeCount} subtitle="Operações ativas" icon={<PlayCircle className="h-5 w-5" />} accentColor="success" index={0} />
      <KPICard title="Pausados" value={pausedCount} subtitle="Aguardando" icon={<Pause className="h-5 w-5" />} accentColor="warning" index={1} />
      <KPICard title="Concluídos Hoje" value={completedToday} subtitle="Finalizados" icon={<CheckCircle className="h-5 w-5" />} accentColor="primary" index={2} />
      <KPICard title="Produzidos Hoje" value={totalProduced} subtitle="Peças boas" icon={<CheckCircle className="h-5 w-5" />} accentColor="info" index={3} />
      <KPICard title="Rejeitados Hoje" value={totalRejected} subtitle="Refugo" icon={<AlertCircle className="h-5 w-5" />} accentColor="danger" index={4} />
    </div>
  );
}
