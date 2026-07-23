import { KPICard } from '@/shared/components/KPICard';
import { ParkingSquare, Truck, CalendarClock, LogOut } from 'lucide-react';

export function YardKPIs({ kpis }: { kpis: { waiting: number; docked: number; apptsToday: number; noShow: number } }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard title="Aguardando" value={kpis.waiting} subtitle="veículos no pátio" icon={<ParkingSquare className="h-5 w-5" />} accentColor={kpis.waiting > 5 ? 'warning' : 'default'} index={0} />
      <KPICard title="Em doca" value={kpis.docked} subtitle="carregando/descarregando" icon={<Truck className="h-5 w-5" />} accentColor="success" index={1} />
      <KPICard title="Agendamentos hoje" value={kpis.apptsToday} subtitle="janelas do dia" icon={<CalendarClock className="h-5 w-5" />} index={2} />
      <KPICard title="No-show" value={kpis.noShow} subtitle="histórico" icon={<LogOut className="h-5 w-5" />} accentColor={kpis.noShow > 0 ? 'danger' : 'default'} index={3} />
    </div>
  );
}
