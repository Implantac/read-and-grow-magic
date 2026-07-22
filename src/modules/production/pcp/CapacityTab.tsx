import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';

export function CapacityTab({ workCenterData, delayedOPs, today }: { workCenterData: any[]; delayedOPs: any[]; today: Date }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Carga por Centro de Trabalho</CardTitle></CardHeader>
        <CardContent>
          {workCenterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workCenterData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip />
                <Bar dataKey="ordens" fill="hsl(var(--primary))" name="Ordens" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendente" fill="hsl(var(--warning))" name="Qtde Pendente" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados de carga produtiva</p>}
        </CardContent>
      </Card>
      {delayedOPs.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> OPs Atrasadas ({delayedOPs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {delayedOPs.map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3"><span className="font-mono font-medium">{o.order_number}</span><span className="text-muted-foreground">{o.product_name}</span></div>
                  <Badge variant="destructive" className="text-xs">{differenceInDays(today, parseISO(o.due_date!))} dias de atraso</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
