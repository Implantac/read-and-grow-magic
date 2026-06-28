import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLoading } from '@/shared/components/PageLoading';
import { Button } from '@/ui/base/button';
import { Printer, ChevronLeft } from 'lucide-react';
import { useRouteStops, useRouteCost } from '@/hooks/tms/useRoutePlanning';
import { useTMS } from '@/hooks/operational/useTMSQuery';

const STOP_TYPE: Record<string, string> = {
  pickup: 'Coleta',
  delivery: 'Entrega',
  depot: 'Depósito',
};

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RouteManifest = () => {
  const { id } = useParams<{ id: string }>();
  const { routes, routesLoading, carriers, vehicles } = useTMS();
  const route = routes.find((r) => r.id === id);
  const { data: stops = [], isLoading: stopsLoading } = useRouteStops(id);
  const { data: cost } = useRouteCost(id);

  const carrier = carriers.find((c: any) => c.id === route?.carrierId);
  const vehicle = vehicles.find((v: any) => v.id === route?.vehicleId);

  const totals = useMemo(() => {
    const weight = stops.reduce((s, x) => s + Number(x.weight ?? 0), 0);
    const volume = stops.reduce((s, x) => s + Number(x.volume ?? 0), 0);
    const totalCost =
      Number(cost?.fuel_cost ?? 0) +
      Number(cost?.toll_cost ?? 0) +
      Number(cost?.driver_cost ?? 0) +
      Number(cost?.maintenance_cost ?? 0) +
      Number(cost?.other_cost ?? 0);
    return { weight, volume, totalCost };
  }, [stops, cost]);

  // Auto-trigger print dialog on first render (after data loads)
  useEffect(() => {
    if (!routesLoading && !stopsLoading && route && stops.length >= 0) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [routesLoading, stopsLoading, route, stops.length]);

  if (routesLoading || stopsLoading) return <PageLoading />;
  if (!route) {
    return (
      <div className="p-6">
        <Link to="/tms/rotas" className="text-primary underline">Voltar para rotas</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .no-print { display: none !important; }
          .manifest-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-background border-b px-4 py-2 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/tms/rotas/${route.id}/planejamento`}>
            <ChevronLeft className="h-4 w-4 mr-1" />Voltar ao planner
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Imprimir
        </Button>
      </div>

      <div className="manifest-page max-w-[210mm] mx-auto p-8 bg-card print:p-0">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manifesto de Rota</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Documento de bordo — entregar via assinatura ao destinatário
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-muted-foreground">Nº da rota</div>
            <div className="text-xl font-mono font-bold">{route.routeNumber ?? route.id.slice(0, 8)}</div>
            <div className="text-xs mt-1">Data: {route.plannedDate ?? '—'}</div>
          </div>
        </div>

        {/* Dados de operação */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Motorista</div>
            <div className="font-medium">{route.driverName ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Transportadora</div>
            <div className="font-medium">{(carrier as any)?.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Veículo</div>
            <div className="font-medium">
              {(vehicle as any)?.plate ?? '—'} {(vehicle as any)?.model ? `· ${(vehicle as any).model}` : ''}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Distância prevista</div>
            <div className="font-medium">
              {cost?.total_distance_km ? `${Number(cost.total_distance_km).toLocaleString('pt-BR')} km` : '—'}
            </div>
          </div>
        </div>

        {/* Paradas */}
        <h2 className="text-base font-semibold mb-2">Sequência de Paradas ({stops.length})</h2>
        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-foreground/40">
              <th className="text-left py-2 w-8">#</th>
              <th className="text-left py-2">Tipo</th>
              <th className="text-left py-2">Cliente / Endereço</th>
              <th className="text-right py-2">Peso</th>
              <th className="text-right py-2">Vol.</th>
              <th className="text-left py-2 w-32">ETA</th>
              <th className="text-left py-2 w-40">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            {stops.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhuma parada cadastrada</td></tr>
            ) : stops.map((s, i) => (
              <tr key={s.id} className="border-b align-top">
                <td className="py-2 font-mono font-bold">{i + 1}</td>
                <td className="py-2">{STOP_TYPE[s.stop_type] ?? s.stop_type}</td>
                <td className="py-2">
                  <div className="font-medium">{(s as any).customer_id ? `Cliente #${String((s as any).customer_id).slice(0, 8)}` : '—'}</div>
                  <div className="text-muted-foreground">{s.address ?? '—'}{s.city ? ` — ${s.city}/${s.state ?? ''}` : ''}</div>
                  {s.notes && <div className="text-muted-foreground italic mt-1">Obs: {s.notes}</div>}
                </td>
                <td className="py-2 text-right">{s.weight ? `${Number(s.weight).toLocaleString('pt-BR')} kg` : '—'}</td>
                <td className="py-2 text-right">{s.volume ? Number(s.volume).toLocaleString('pt-BR') : '—'}</td>
                <td className="py-2">{(s as any).planned_eta ? new Date((s as any).planned_eta).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                <td className="py-2">
                  <div className="h-10 border-b border-dashed border-foreground/60"></div>
                </td>
              </tr>
            ))}
          </tbody>
          {stops.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground/40 font-semibold">
                <td colSpan={3} className="py-2 text-right">Totais:</td>
                <td className="py-2 text-right">{totals.weight.toLocaleString('pt-BR')} kg</td>
                <td className="py-2 text-right">{totals.volume.toLocaleString('pt-BR')}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Resumo financeiro */}
        {cost && (
          <div className="border rounded p-3 mb-6 text-xs">
            <div className="font-semibold mb-2">Custos previstos</div>
            <div className="grid grid-cols-5 gap-2">
              <div><div className="text-muted-foreground">Combustível</div><div>{fmtBRL(Number(cost.fuel_cost ?? 0))}</div></div>
              <div><div className="text-muted-foreground">Pedágios</div><div>{fmtBRL(Number(cost.toll_cost ?? 0))}</div></div>
              <div><div className="text-muted-foreground">Motorista</div><div>{fmtBRL(Number(cost.driver_cost ?? 0))}</div></div>
              <div><div className="text-muted-foreground">Manutenção</div><div>{fmtBRL(Number(cost.maintenance_cost ?? 0))}</div></div>
              <div className="font-bold"><div className="text-muted-foreground">Total</div><div>{fmtBRL(totals.totalCost)}</div></div>
            </div>
          </div>
        )}

        {/* Assinaturas finais */}
        <div className="grid grid-cols-2 gap-8 mt-12 text-xs">
          <div>
            <div className="border-t border-foreground pt-1 text-center">Assinatura do Motorista</div>
            <div className="text-center text-muted-foreground mt-1">Saída: ____/____/______  Horário: ____:____</div>
          </div>
          <div>
            <div className="border-t border-foreground pt-1 text-center">Conferência / Expedição</div>
            <div className="text-center text-muted-foreground mt-1">Carimbo e visto</div>
          </div>
        </div>

        {route.notes && (
          <div className="mt-6 text-xs border-t pt-3">
            <span className="font-semibold">Observações da rota:</span> {route.notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteManifest;
