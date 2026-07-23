import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { ScrollArea } from '@/ui/base/scroll-area';
import { formatDate } from '@/lib/formatters';

interface Props {
  usageLogs: any[];
}

export function AdherenceTab({ usageLogs }: Props) {
  const totalLogs = usageLogs.length;
  const uniqueUsers = new Set(usageLogs.map((l: any) => l.sales_rep_id || l.user_id)).size;
  const avg = totalLogs > 0 ? (totalLogs / Math.max(uniqueUsers, 1)).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{totalLogs}</p>
            <p className="text-sm text-muted-foreground">Usos do Playbook</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-emerald-500">{uniqueUsers}</p>
            <p className="text-sm text-muted-foreground">Vendedores Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-500">{avg}</p>
            <p className="text-sm text-muted-foreground">Média por Vendedor</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Usos</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {usageLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum uso registrado ainda. Os vendedores começarão a aparecer aqui ao utilizar scripts e respostas.
              </p>
            ) : (
              <div className="space-y-2">
                {usageLogs.slice(0, 50).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                    <span>{log.action_type === 'copy_script' ? '📋 Script copiado' : '👍 Objeção utilizada'}</span>
                    <span className="text-muted-foreground text-xs">{formatDate(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
