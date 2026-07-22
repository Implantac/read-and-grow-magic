import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { useReinf } from '@/hooks/fiscal/useReinf';
import { ReinfCertificateStatus } from './ReinfCertificateStatus';
import { ReinfPeriodCard } from './reinf/ReinfPeriodCard';
import { ReinfTotalsCard } from './reinf/ReinfTotalsCard';
import { ReinfEventsCard } from './reinf/ReinfEventsCard';
import { useReinfTransmit } from './reinf/useReinfTransmit';

export default function Reinf() {
  const {
    competencia, setCompetencia,
    events, currentPeriod, loading, busy,
    openPeriod, generateR2010, generateR2020, generateR4020, closePeriod, reopen,
  } = useReinf();
  const { transmit, transmitting } = useReinfTransmit();

  const totals = currentPeriod?.totals || {};
  const isClosed = currentPeriod?.status === 'fechado';

  return (
    <PageContainer>
      <PageHeader
        title="EFD-Reinf"
        description="Eventos de retenções de INSS (R-2010) e IR/CSLL/PIS/COFINS (R-4020) com fechamento mensal R-2099/R-4099"
      />

      <div className="mb-6">
        <ReinfCertificateStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReinfPeriodCard
          competencia={competencia}
          setCompetencia={setCompetencia}
          currentPeriod={currentPeriod}
          busy={busy}
          isClosed={isClosed}
          eventsCount={events.length}
          transmitting={transmitting}
          openPeriod={openPeriod}
          generateR2010={generateR2010}
          generateR2020={generateR2020}
          generateR4020={generateR4020}
          closePeriod={closePeriod}
          reopen={reopen}
          onTransmit={() => transmit(currentPeriod?.id, events.length)}
        />
        <ReinfTotalsCard totals={totals} />
      </div>

      <ReinfEventsCard
        events={events}
        loading={loading}
        competencia={competencia}
        currentPeriod={currentPeriod}
      />
    </PageContainer>
  );
}
