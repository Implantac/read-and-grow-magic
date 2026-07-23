import { useState } from 'react';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Dialog, DialogTrigger } from '@/ui/base/dialog';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { CalendarClock, Plus, RefreshCw } from 'lucide-react';
import { useYardData } from './useYardData';
import { YardKPIs } from './YardKPIs';
import { VehiclesList } from './VehiclesList';
import { AppointmentsList } from './AppointmentsList';
import { CheckinDialog } from './CheckinDialog';
import { AppointmentDialog } from './AppointmentDialog';

export default function YardManagement() {
  const [openCheckin, setOpenCheckin] = useState(false);
  const [openAppt, setOpenAppt] = useState(false);
  const { vehicles, appts, docks, loadingV, loadingA, refetchV, refetchA, kpis, updateStatus, dockLabel } = useYardData();

  return (
    <PageContainer>
      <PageHeader title="🚛 Yard Management" description="Pátio, check-in de veículos e agendamento de docas">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchV(); refetchA(); }} className="h-8 gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Dialog open={openAppt} onOpenChange={setOpenAppt}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2"><CalendarClock className="h-4 w-4" /> Agendar</Button>
            </DialogTrigger>
            <AppointmentDialog docks={docks} onClose={() => setOpenAppt(false)} />
          </Dialog>
          <Dialog open={openCheckin} onOpenChange={setOpenCheckin}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-2"><Plus className="h-4 w-4" /> Check-in</Button>
            </DialogTrigger>
            <CheckinDialog onClose={() => setOpenCheckin(false)} />
          </Dialog>
        </div>
      </PageHeader>

      <YardKPIs kpis={kpis} />

      <Tabs defaultValue="yard">
        <TabsList>
          <TabsTrigger value="yard">Pátio em tempo real</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="yard">
          <VehiclesList
            vehicles={vehicles}
            loading={loadingV}
            docks={docks}
            dockLabel={dockLabel}
            onUpdate={(args) => updateStatus.mutate(args)}
          />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsList appts={appts} loading={loadingA} dockLabel={dockLabel} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
