import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Dialog, DialogTrigger } from '@/ui/base/dialog';
import { CostDialog } from './CostDialog';
import { CostLine } from './StopRow';
import { fmtBRL } from './helpers';

type Props = {
  routeId: string;
  cost: any;
  totalCost: number;
  costPerKm: number;
  costOpen: boolean;
  setCostOpen: (v: boolean) => void;
  onSubmit: (payload: any) => void;
};

export function RouteCostCard({ routeId, cost, totalCost, costPerKm, costOpen, setCostOpen, onSubmit }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Custos da rota</CardTitle>
          {cost && Number(cost.total_distance_km ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {fmtBRL(costPerKm)} / km · {Number(cost.total_distance_km).toLocaleString('pt-BR')} km
            </p>
          )}
        </div>
        <Dialog open={costOpen} onOpenChange={setCostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Editar custos</Button>
          </DialogTrigger>
          <CostDialog
            routeId={routeId}
            current={cost}
            onClose={() => setCostOpen(false)}
            onSubmit={onSubmit}
          />
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <CostLine label="Combustível" value={fmtBRL(Number(cost?.fuel_cost ?? 0))} />
          <CostLine label="Pedágios" value={fmtBRL(Number(cost?.toll_cost ?? 0))} />
          <CostLine label="Motorista" value={fmtBRL(Number(cost?.driver_cost ?? 0))} />
          <CostLine label="Manutenção" value={fmtBRL(Number(cost?.maintenance_cost ?? 0))} />
          <CostLine label="Outros" value={fmtBRL(Number(cost?.other_cost ?? 0))} />
          <CostLine label="Litros" value={`${Number(cost?.fuel_liters ?? 0).toLocaleString('pt-BR')} L`} />
          <CostLine label="Distância" value={`${Number(cost?.total_distance_km ?? 0).toLocaleString('pt-BR')} km`} />
          <CostLine label="Total" value={fmtBRL(totalCost)} highlight />
        </div>
      </CardContent>
    </Card>
  );
}
