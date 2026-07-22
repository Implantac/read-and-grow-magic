import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Clock, UserPlus } from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { ICON_BY_TITLE, ROUTE_BY_TITLE, type Notif } from './types';

interface Props {
  notifs: Notif[];
  isAdmin: boolean;
  userNameById: Map<string, string>;
  onAssign: (n: Notif) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  isResolving: boolean;
  isReopening: boolean;
}

export function DivergenceList({ notifs, isAdmin, userNameById, onAssign, onResolve, onReopen, isResolving, isReopening }: Props) {
  const navigate = useNavigate();
  return (
    <div className="space-y-2">
      {notifs.map((n) => {
        const Icon = ICON_BY_TITLE[n.title] ?? AlertTriangle;
        const route = ROUTE_BY_TITLE[n.title];
        const isOverdue = !n.read && n.due_at && isPast(new Date(n.due_at));
        const assignedName = n.assigned_to ? userNameById.get(n.assigned_to) ?? 'Responsável' : null;
        return (
          <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'bg-card hover:bg-accent/50'}`}>
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${n.read ? 'text-muted-foreground' : isOverdue ? 'text-destructive' : 'text-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{n.title}</p>
                {!n.read ? <Badge variant="destructive" className="text-xs">Aberto</Badge> : <Badge variant="secondary" className="text-xs">Resolvido</Badge>}
                {isOverdue && <Badge variant="destructive" className="text-xs gap-1"><Clock className="h-3 w-3" /> Vencido</Badge>}
                {n.escalated_at && <Badge variant="destructive" className="text-xs gap-1">🚨 Escalonado</Badge>}
                {assignedName && <Badge variant="outline" className="text-xs">{assignedName}</Badge>}
                {n.due_at && !n.read && !isOverdue && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />{format(new Date(n.due_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && !n.read && (
                <Button size="sm" variant="ghost" onClick={() => onAssign(n)} className="gap-1">
                  <UserPlus className="h-3 w-3" />Atribuir
                </Button>
              )}
              {route && (
                <Button size="sm" variant="ghost" onClick={() => navigate(route)}>
                  Abrir <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              {!n.read ? (
                <Button size="sm" variant="outline" disabled={isResolving} onClick={() => onResolve(n.id)} className="gap-1">
                  <Check className="h-3 w-3" />Resolver
                </Button>
              ) : (
                <Button size="sm" variant="ghost" disabled={isReopening} onClick={() => onReopen(n.id)}>
                  Reabrir
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
