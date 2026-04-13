import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductionMachines } from '@/hooks/useProductionMachines';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { Activity, Cpu, Wifi, WifiOff, Thermometer, Gauge, Zap, AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, Wrench, Clock, TrendingUp, Battery } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, ComposedChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

interface MachTelemetry {
  temperature: number;
  vibration: number;
  power: number;
  rpm: number;
  connected: boolean;
  healthScore: number;
  mtbf: number;
  mttr: number;
  predictiveAlert: string | null;
  energyEfficiency: number;
  hoursToMaintenance: number;
}

function generateTelemetry(status: string, seed: number): MachTelemetry {
  const r = () => Math.random();
  const isRunning = status === 'running';
  const temp = isRunning ? 45 + r() * 30 : 20 + r() * 5;
  const vibration = isRunning ? 0.5 + r() * 2.5 : r() * 0.2;
  const power = isRunning ? 3 + r() * 7 : 0.1 + r() * 0.3;
  const rpm = isRunning ? 800 + r() * 1200 : 0;
  const healthScore = Math.max(0, 100 - (temp > 65 ? 20 : 0) - (vibration > 2 ? 15 : 0) - (status === 'maintenance' ? 40 : 0) - (r() * 10));
  const mtbf = 120 + seed * 10 + r() * 80;
  const mttr = 2 + r() * 6;
  const hoursToMaintenance = Math.max(0, 500 - seed * 30 + r() * 200);

  let predictiveAlert: string | null = null;
  if (temp > 70) predictiveAlert = 'Superaquecimento — risco de falha em 24h';
  else if (vibration > 2.5) predictiveAlert = 'Vibração anormal — verificar rolamentos';
  else if (hoursToMaintenance < 50) predictiveAlert = 'Manutenção preventiva programada';

  return {
    temperature: +temp.toFixed(1),
    vibration: +vibration.toFixed(2),
    power: +power.toFixed(1),
    rpm: Math.round(rpm),
    connected: true,
    healthScore: +healthScore.toFixed(0),
    mtbf: +mtbf.toFixed(0),
    mttr: +mttr.toFixed(1),
    predictiveAlert,
    energyEfficiency: isRunning ? +(70 + r() * 25).toFixed(1) : 0,
    hoursToMaintenance: +hoursToMaintenance.toFixed(0),
  };
}

export default function IoTDashboard() {
  const { machines } = useProductionMachines();
  const { capacities } = useProductionCapacity();
  const [telemetryData, setTelemetryData] = useState<Record<string, MachTelemetry>>({});
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const updateTelemetry = () => {
      const data: Record<string, MachTelemetry> = {};
      machines.forEach((m, i) => { data[m.id] = generateTelemetry(m.status, i); });
      setTelemetryData(data);
      setLastRefresh(new Date());

      setHistoricalData(prev => {
        const vals = Object.values(data);
        const point = {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          avgTemp: vals.reduce((s, d) => s + d.temperature, 0) / Math.max(vals.length, 1),
          avgPower: vals.reduce((s, d) => s + d.power, 0) / Math.max(vals.length, 1),
          totalPower: vals.reduce((s, d) => s + d.power, 0),
          avgVibration: vals.reduce((s, d) => s + d.vibration, 0) / Math.max(vals.length, 1),
          machinesRunning: machines.filter(m => m.status === 'running').length,
          avgHealth: vals.reduce((s, d) => s + d.healthScore, 0) / Math.max(vals.length, 1),
        };
        return [...prev, point].slice(-60);
      });
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 5000);
    return () => clearInterval(interval);
  }, [machines]);

  const allTelemetry = Object.entries(telemetryData);
  const connectedCount = allTelemetry.filter(([_, t]) => t.connected).length;
  const runningCount = machines.filter(m => m.status === 'running').length;
  const alertCount = allTelemetry.filter(([_, t]) => t.predictiveAlert).length;
  const avgHealth = allTelemetry.length > 0 ? allTelemetry.reduce((s, [_, t]) => s + t.healthScore, 0) / allTelemetry.length : 0;
  const totalEnergy = allTelemetry.reduce((s, [_, t]) => s + t.power, 0);
  const avgMTBF = allTelemetry.length > 0 ? allTelemetry.reduce((s, [_, t]) => s + t.mtbf, 0) / allTelemetry.length : 0;

  const machinesList = machines.map(m => {
    const t = telemetryData[m.id];
    return { ...m, telemetry: t };
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <PageContainer>
      <PageHeader title="🌐 IoT — Monitoramento Industrial em Tempo Real" description="Telemetria, manutenção preditiva, MTBF/MTTR, eficiência energética e saúde das máquinas" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-3 flex items-center gap-2">
            <Wifi className="h-5 w-5 text-success" />
            <div><p className="text-xs text-muted-foreground">Conectadas</p><p className="text-lg font-bold">{connectedCount}/{machines.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Operando</p><p className="text-lg font-bold">{runningCount}</p></div>
          </CardContent>
        </Card>
        <Card className={cn('border-l-4', alertCount > 0 ? 'border-l-warning' : 'border-l-success')}>
          <CardContent className="p-3 flex items-center gap-2">
            <ShieldAlert className={cn('h-5 w-5', alertCount > 0 ? 'text-warning' : 'text-success')} />
            <div><p className="text-xs text-muted-foreground">Alertas Preditivos</p><p className="text-lg font-bold">{alertCount}</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="p-3 flex items-center gap-2">
            <Gauge className={cn('h-5 w-5', getHealthColor(avgHealth))} />
            <div><p className="text-xs text-muted-foreground">Saúde Média</p><p className={cn('text-lg font-bold', getHealthColor(avgHealth))}>{avgHealth.toFixed(0)}%</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-3">
          <CardContent className="p-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-chart-3" />
            <div><p className="text-xs text-muted-foreground">Energia Total</p><p className="text-lg font-bold">{totalEnergy.toFixed(1)} kW</p></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-4">
          <CardContent className="p-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-chart-4" />
            <div><p className="text-xs text-muted-foreground">MTBF Médio</p><p className="text-lg font-bold">{avgMTBF.toFixed(0)}h</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Atualização em tempo real — {lastRefresh.toLocaleTimeString('pt-BR')}
      </div>

      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="machines">🏭 Máquinas</TabsTrigger>
          <TabsTrigger value="predictive">🔮 Manutenção Preditiva</TabsTrigger>
          <TabsTrigger value="telemetry">📊 Telemetria</TabsTrigger>
          <TabsTrigger value="energy">⚡ Energia</TabsTrigger>
          <TabsTrigger value="alerts">🚨 Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="machines">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machinesList.map(machine => {
              const t = machine.telemetry;
              return (
                <Card key={machine.id} className="relative overflow-hidden">
                  <div className={cn('absolute top-0 left-0 right-0 h-1', machine.status === 'running' ? 'bg-success' : machine.status === 'maintenance' ? 'bg-destructive' : machine.status === 'stopped' ? 'bg-warning' : 'bg-muted-foreground')} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{machine.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {t?.connected ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3 text-destructive" />}
                        <Badge variant="outline" className="text-xs">
                          {machine.status === 'running' ? '▶ Operando' : machine.status === 'maintenance' ? '🔧 Manutenção' : machine.status === 'stopped' ? '⏸ Parada' : '● Disponível'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{machine.code} • {machine.sector || 'Sem setor'}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {t ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Saúde</span>
                          <span className={cn('text-sm font-bold', getHealthColor(t.healthScore))}>{t.healthScore}%</span>
                        </div>
                        <Progress value={t.healthScore} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Thermometer className={cn('h-3 w-3', t.temperature > 65 ? 'text-destructive' : 'text-success')} />
                            <span>{t.temperature}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-primary" />
                            <span>{t.vibration} mm/s</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-chart-3" />
                            <span>{t.power} kW</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-chart-4" />
                            <span>{t.rpm} RPM</span>
                          </div>
                        </div>

                        {t.predictiveAlert && (
                          <div className="p-2 rounded bg-warning/10 text-xs flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-warning" />
                            <span>{t.predictiveAlert}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>MTBF: {t.mtbf}h</span>
                          <span>Próx. Manut: {t.hoursToMaintenance}h</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aguardando dados...</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {machines.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhuma máquina cadastrada. Cadastre máquinas no módulo de Capacidade.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="predictive">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Manutenção Preditiva — MTBF / MTTR</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Saúde</TableHead>
                  <TableHead className="text-right">MTBF (h)</TableHead>
                  <TableHead className="text-right">MTTR (h)</TableHead>
                  <TableHead className="text-right">Disponibilidade</TableHead>
                  <TableHead className="text-right">Próx. Manutenção</TableHead>
                  <TableHead>Alerta</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {machinesList.filter(m => m.telemetry).map(m => {
                    const t = m.telemetry!;
                    const availability = t.mtbf / (t.mtbf + t.mttr) * 100;
                    return (
                      <TableRow key={m.id} className={cn(t.predictiveAlert && 'bg-warning/5')}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{m.status}</Badge></TableCell>
                        <TableCell className="text-center">
                          <span className={cn('font-bold', getHealthColor(t.healthScore))}>{t.healthScore}%</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{t.mtbf}</TableCell>
                        <TableCell className="text-right font-mono">{t.mttr}</TableCell>
                        <TableCell className="text-right"><span className={cn('font-bold', availability >= 95 ? 'text-success' : availability >= 85 ? 'text-warning' : 'text-destructive')}>{availability.toFixed(1)}%</span></TableCell>
                        <TableCell className="text-right">{t.hoursToMaintenance < 100 ? <span className="text-warning font-bold">{t.hoursToMaintenance}h</span> : `${t.hoursToMaintenance}h`}</TableCell>
                        <TableCell>{t.predictiveAlert ? <Badge variant="secondary" className="text-xs">{t.predictiveAlert}</Badge> : <CheckCircle className="h-4 w-4 text-success" />}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telemetry">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Temperatura Média</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgTemp" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.15)" name="Temp °C" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Vibração Média (mm/s)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgVibration" stroke="hsl(var(--primary))" name="Vibração" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Consumo Energético (kW)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalPower" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3) / 0.15)" name="Total kW" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Saúde Média do Parque</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={11} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgHealth" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.15)" name="Saúde %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="energy">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <Zap className="h-8 w-8 mx-auto text-chart-3" />
                <p className="text-sm text-muted-foreground">Consumo Total Atual</p>
                <p className="text-4xl font-black">{totalEnergy.toFixed(1)} kW</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <Battery className="h-8 w-8 mx-auto text-success" />
                <p className="text-sm text-muted-foreground">Eficiência Energética Média</p>
                <p className="text-4xl font-black text-success">
                  {allTelemetry.length > 0 ? (allTelemetry.reduce((s, [_, t]) => s + t.energyEfficiency, 0) / allTelemetry.length).toFixed(0) : 0}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <TrendingUp className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">kW por Máquina Ativa</p>
                <p className="text-4xl font-black">{runningCount > 0 ? (totalEnergy / runningCount).toFixed(1) : '0'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Consumo por Máquina</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Consumo (kW)</TableHead>
                  <TableHead className="text-right">Eficiência</TableHead>
                  <TableHead className="text-right">RPM</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {machinesList.filter(m => m.telemetry).sort((a, b) => (b.telemetry?.power || 0) - (a.telemetry?.power || 0)).map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.status}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{m.telemetry!.power} kW</TableCell>
                      <TableCell className="text-right"><span className={cn(m.telemetry!.energyEfficiency >= 80 ? 'text-success' : 'text-warning')}>{m.telemetry!.energyEfficiency}%</span></TableCell>
                      <TableCell className="text-right font-mono">{m.telemetry!.rpm}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {machinesList.filter(m => m.telemetry?.predictiveAlert).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-4 rounded-lg border border-warning/50 bg-warning/5">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                    <div className="flex-1">
                      <p className="font-medium">{m.name} ({m.code})</p>
                      <p className="text-sm text-muted-foreground">{m.telemetry!.predictiveAlert}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Saúde: {m.telemetry!.healthScore}%</span>
                        <span>Temp: {m.telemetry!.temperature}°C</span>
                        <span>Vibr: {m.telemetry!.vibration} mm/s</span>
                      </div>
                    </div>
                    <Badge variant="secondary">Preditivo</Badge>
                  </div>
                ))}

                {machinesList.filter(m => m.telemetry?.predictiveAlert).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p>Nenhum alerta preditivo. Todas as máquinas operam normalmente.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
