import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { HistoricalPoint } from './telemetry';

export function TelemetryTab({ historicalData }: { historicalData: HistoricalPoint[] }) {
  return (
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
  );
}
