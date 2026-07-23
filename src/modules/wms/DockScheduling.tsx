import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { CalendarClock, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useDockScheduling } from './dockScheduling/useDockScheduling';
import { NewAppointmentDialog } from './dockScheduling/NewAppointmentDialog';
import { DockTimeline } from './dockScheduling/DockTimeline';
import { AppointmentsList } from './dockScheduling/AppointmentsList';

export default function DockScheduling() {
  const [day, setDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const { loading, appts, docks, kpis, byDock, load, changeStatus } = useDockScheduling(day);

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Agendamento de Docas"
        description="Janelas de chegada/expedição por doca com timeline operacional"
        actions={<NewAppointmentDialog docks={docks} onCreated={load} />}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Agendamentos" value={kpis.total} icon={CalendarClock} />
        <KPICard title="Em operação" value={kpis.inProg} icon={Truck} />
        <KPICard title="Concluídos" value={kpis.done} icon={CheckCircle2} />
        <KPICard title="Cancelados / No-show" value={kpis.issues} icon={AlertTriangle} />
      </div>

      <DockTimeline day={day} setDay={setDay} docks={docks} byDock={byDock} />
      <AppointmentsList appts={appts} docks={docks} onChangeStatus={changeStatus} />
    </PageContainer>
  );
}
