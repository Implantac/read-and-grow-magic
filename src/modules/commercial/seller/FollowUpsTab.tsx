import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle, Mail, MessageSquare, PhoneCall } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';

interface FollowUpsTabProps {
  followUps: any[];
  clients: any[];
  onComplete: (id: string) => void;
}

export function FollowUpsTab({ followUps, clients, onComplete }: FollowUpsTabProps) {
  const pending = followUps.filter(f => f.status === 'pending');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Follow-ups Pendentes
          <Badge variant="secondary">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum follow-up pendente</p>
        ) : (
          <div className="space-y-2">
            {pending.map(fu => {
              const client = clients.find(c => c.id === fu.client_id);
              const isOverdue = new Date(fu.scheduled_date) < new Date();
              const TypeIcon = fu.type === 'call' ? PhoneCall : fu.type === 'email' ? Mail : MessageSquare;
              return (
                <div key={fu.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                  <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fu.subject}</p>
                    <p className="text-xs text-muted-foreground">{client?.name || 'Cliente'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(fu.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {isOverdue && <span className="text-destructive ml-1 font-medium">• Atrasado</span>}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onComplete(fu.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
