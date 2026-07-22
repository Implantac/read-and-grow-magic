import { useEffect, useState } from 'react';

export interface MachTelemetry {
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

export interface HistoricalPoint {
  time: string;
  avgTemp: number;
  avgPower: number;
  totalPower: number;
  avgVibration: number;
  machinesRunning: number;
  avgHealth: number;
}

export function generateTelemetry(status: string, seed: number): MachTelemetry {
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

export function getHealthColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function useTelemetry(machines: Array<{ id: string; status: string }>) {
  const [telemetryData, setTelemetryData] = useState<Record<string, MachTelemetry>>({});
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const update = () => {
      const data: Record<string, MachTelemetry> = {};
      machines.forEach((m, i) => { data[m.id] = generateTelemetry(m.status, i); });
      setTelemetryData(data);
      setLastRefresh(new Date());

      setHistoricalData(prev => {
        const vals = Object.values(data);
        const n = Math.max(vals.length, 1);
        const point: HistoricalPoint = {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          avgTemp: vals.reduce((s, d) => s + d.temperature, 0) / n,
          avgPower: vals.reduce((s, d) => s + d.power, 0) / n,
          totalPower: vals.reduce((s, d) => s + d.power, 0),
          avgVibration: vals.reduce((s, d) => s + d.vibration, 0) / n,
          machinesRunning: machines.filter(m => m.status === 'running').length,
          avgHealth: vals.reduce((s, d) => s + d.healthScore, 0) / n,
        };
        return [...prev, point].slice(-60);
      });
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [machines]);

  return { telemetryData, historicalData, lastRefresh };
}
