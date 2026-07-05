import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Badge } from '@/ui/base/badge';
import { Layers, Play, Save, Users, PackageX } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { useWavePlanning } from '@/hooks/wms/useWavePlanning';

export default function WavePlanningV2() {
  const { plan, loading, result } = useWavePlanning();
  const [operators, setOperators] = useState(2);
  const [maxOrders, setMaxOrders] = useState(15);
  const [minPriority, setMinPriority] = useState<string>('low');
  const [carrier, setCarrier] = useState('');
  const [zone, setZone] = useState('');
  const [cutoff, setCutoff] = useState('');

  const run = (commit: boolean) => plan({
    operators,
    maxOrdersPerWave: maxOrders,
    minPriority,
    carrier: carrier || null,
    zone: zone || null,
    cutoff: cutoff ? new Date(cutoff).toISOString() : null,
    commit,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Wave Planning v2"
        description="Motor de planejamento de ondas com balanceamento entre operadores"
      />

      <Card>
        <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Operadores</Label>
            <Input type="number" min={1} max={20} value={operators} onChange={e => setOperators(Number(e.target.value)||1)} />
          </div>
          <div>
            <Label>Máx pedidos/onda</Label>
            <Input type="number" min={1} max={200} value={maxOrders} onChange={e => setMaxOrders(Number(e.target.value)||1)} />
          </div>
          <div>
            <Label>Prioridade mínima</Label>
            <Select value={minPriority} onValueChange={setMinPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Transportadora (opcional)</Label>
            <Input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="ex.: Correios" />
          </div>
          <div>
            <Label>Zona (opcional)</Label>
            <Input value={zone} onChange={e => setZone(e.target.value)} placeholder="ex.: A" />
          </div>
          <div>
            <Label>Cutoff (opcional)</Label>
            <Input type="datetime-local" value={cutoff} onChange={e => setCutoff(e.target.value)} />
          </div>
          <div className="md:col-span-3 flex gap-2 pt-2">
            <Button onClick={() => run(false)} disabled={loading} variant="outline">
              <Play className="h-4 w-4 mr-2" /> Simular
            </Button>
            <Button onClick={() => run(true)} disabled={loading || !result || result.waves_planned === 0}>
              <Save className="h-4 w-4 mr-2" /> Confirmar e Criar Ondas
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {result.committed ? 'Ondas criadas' : 'Simulação'} · {result.waves_planned} ondas · {result.orders_total} pedidos · <Users className="h-4 w-4" /> {result.operators} operador(es)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.waves.length === 0 && (
              <EmptyState
                icon={PackageX}
                title="Nenhum pedido elegível"
                description="Ajuste os filtros de prioridade, transportadora, zona ou cutoff para gerar ondas."
              />
            )}
            {result.waves.map((w, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="font-medium mb-2">Onda {i + 1} · {w.orders.length} pedidos</div>
                <div className="flex flex-wrap gap-2">
                  {w.orders.map(o => (
                    <Badge key={o.id} variant="outline" className="font-mono text-xs">
                      {o.order_number} · op{o.operator} · {o.items} itens · {o.priority}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
