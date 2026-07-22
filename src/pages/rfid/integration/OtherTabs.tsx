import { Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';

interface Props { events: any[]; }

export function ActionLogTab({ events }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Ações WMS Geradas por RFID
          <Badge variant="outline" className="animate-pulse text-xs">TEMPO REAL</Badge>
        </CardTitle>
        <CardDescription>Eventos RFID que acionaram automações no WMS</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">
            Nenhuma ação WMS gerada por RFID ainda. Configure regras ativas e envie eventos via webhook.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tag EPC</TableHead>
                <TableHead>Leitor</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Ação WMS Executada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(ev => (
                <TableRow key={ev.id}>
                  <TableCell className="text-xs">{format(new Date(ev.createdAt), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}</TableCell>
                  <TableCell className="font-mono text-xs">{ev.tagEpc}</TableCell>
                  <TableCell className="text-xs">{ev.readerCode}</TableCell>
                  <TableCell>{ev.zone ?? ev.location ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{ev.actionTaken}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function HowToTab() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Fluxo de Integração</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {[
            { step: '1', icon: '📡', title: 'Leitor RFID detecta tag', desc: 'O leitor físico captura o EPC da tag e envia via HTTP POST para o webhook.' },
            { step: '2', icon: '🔗', title: 'Webhook recebe o evento', desc: 'O backend registra o evento na tabela rfid_events com leitor, zona e tipo.' },
            { step: '3', icon: '⚡', title: 'Trigger avalia regras', desc: 'O banco avalia automaticamente as regras ativas e encontra a de maior prioridade.' },
            { step: '4', icon: '🏭', title: 'Ação WMS é executada', desc: 'O recebimento é atualizado, o picking marcado, ou uma transferência criada automaticamente.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{s.step}</div>
              <div>
                <p className="font-medium text-foreground">{s.icon} {s.title}</p>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Exemplo de Payload (Webhook)</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md text-xs overflow-auto text-foreground">
{`POST /functions/v1/rfid-webhook

{
  "reader_code": "READER-DOCK-01",
  "tag_epc": "E200001234567890",
  "event_type": "entry",
  "zone": "Recebimento",
  "rssi": -45,
  "antenna": 1
}`}
          </pre>
          <div className="mt-4 p-3 rounded-md bg-green-500/10 text-sm text-green-700 dark:text-green-300">
            <strong>Resultado automático:</strong> Se existir uma regra com zona "Recebimento" e evento "entry" acionando "receive", a ordem de recebimento WMS mais recente será atualizada automaticamente.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
