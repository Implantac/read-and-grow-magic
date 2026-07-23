import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { BarChart3, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FunnelStage { name: string; total: number; passed: number; rate: number; dropoff: number; }

export function ConversionTab({ funnelConversion }: { funnelConversion: FunnelStage[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Taxa de Conversão por Etapa do Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelConversion.map(stage => (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <Badge variant="outline" className="text-[10px]">{stage.total} entradas</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${stage.rate >= 70 ? 'text-emerald-600' : stage.rate >= 40 ? 'text-amber-600' : 'text-destructive'}`}>
                      {stage.rate}% avançam
                    </span>
                    {stage.dropoff > 30 && (
                      <Badge variant="destructive" className="text-[10px]">
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />{stage.dropoff}% perda
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-3 bg-emerald-500 rounded-l" style={{ width: `${stage.rate}%` }} />
                  <div className="h-3 bg-destructive/30 rounded-r flex-1" />
                </div>
                {stage.dropoff > 50 && (
                  <p className="text-[11px] text-destructive">
                    ⚠️ Gargalo: você perde {stage.dropoff}% nesta etapa. Revise abordagem e scripts.
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Volume por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funnelConversion}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Entradas" />
              <Bar dataKey="passed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Avançaram" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
