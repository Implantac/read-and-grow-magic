import { useMemo } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/ui/base/chart';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface DemandChartProps {
  predictedDemand: number;
  unit: string;
  periodDays?: number;
}

export function DemandProjectionChart({ predictedDemand, unit, periodDays = 30 }: DemandChartProps) {
  // Gera dados simulados de projeção baseados no valor predito para criar o gráfico
  const chartData = useMemo(() => {
    const data = [];
    const baseValue = predictedDemand / 1.25; // Reverte o fator de crescimento para o início
    const step = Math.max(1, Math.floor(periodDays / 6));
    
    for (let i = 0; i <= periodDays; i += step) {
      // Cria uma curva de crescimento levemente estocástica
      const progress = i / periodDays;
      const noise = (Math.random() - 0.5) * (baseValue * 0.05);
      const value = Math.round(baseValue + (predictedDemand - baseValue) * progress + noise);
      
      data.push({
        day: `Dia ${i}`,
        demand: Math.max(0, value),
      });
    }
    return data;
  }, [predictedDemand, periodDays]);

  const chartConfig = {
    demand: {
      label: 'Demanda Projetada',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <div className="h-[120px] w-full mt-2">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
            <XAxis 
              dataKey="day" 
              hide 
            />
            <YAxis 
              hide 
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm text-[10px]">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground uppercase font-bold">{payload[0].payload.day}</span>
                        <span className="font-bold text-accent">
                          {payload[0].value} {unit}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="hsl(var(--accent))"
              fillOpacity={1}
              fill="url(#colorDemand)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
