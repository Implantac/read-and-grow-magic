import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Bell, BellOff, Check, CheckCheck, Search, Trash2,
  AlertTriangle, AlertCircle, Info, CheckCircle, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  module: string;
  createdAt: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: '1', type: 'warning', title: 'Estoque Baixo', description: '15 produtos estão abaixo do estoque mínimo configurado no sistema.', module: 'Estoque', createdAt: new Date().toISOString(), read: false },
  { id: '2', type: 'error', title: 'Contas Vencidas', description: '3 contas a pagar venceram ontem totalizando R$ 15.420,00.', module: 'Financeiro', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: '3', type: 'info', title: 'Novo Pedido Grande', description: 'Cliente ABC Corp realizou pedido no valor de R$ 45.000,00.', module: 'Comercial', createdAt: new Date(Date.now() - 7200000).toISOString(), read: true },
  { id: '4', type: 'warning', title: 'Picking Atrasado', description: '8 ordens de separação aguardando há mais de 2 horas.', module: 'WMS', createdAt: new Date(Date.now() - 10800000).toISOString(), read: false },
  { id: '5', type: 'success', title: 'Meta Atingida', description: 'Equipe de vendas atingiu 105% da meta mensal de faturamento.', module: 'Comercial', createdAt: new Date(Date.now() - 14400000).toISOString(), read: true },
  { id: '6', type: 'error', title: 'NF-e Rejeitada', description: 'Nota fiscal 000.125.895 foi rejeitada pela SEFAZ. Verifique os dados.', module: 'Fiscal', createdAt: new Date(Date.now() - 18000000).toISOString(), read: false },
  { id: '7', type: 'info', title: 'Novo Fornecedor', description: 'Fornecedor "Tech Supplies Ltda" cadastrado com sucesso.', module: 'Compras', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
  { id: '8', type: 'success', title: 'Produção Concluída', description: 'OP-2024-001 finalizada com eficiência de 100%.', module: 'Produção', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), read: true },
  { id: '9', type: 'warning', title: 'Cotação Expirando', description: 'Cotação #ORC-2024-003 expira em 2 dias.', module: 'Comercial', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), read: false },
  { id: '10', type: 'info', title: 'Backup Realizado', description: 'Backup automático do sistema concluído com sucesso.', module: 'Admin', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), read: true },
];

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', badge: 'bg-warning/20 text-warning' },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', badge: 'bg-destructive/20 text-destructive' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', badge: 'bg-info/20 text-info' },
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', badge: 'bg-success/20 text-success' },
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');

  const modules = [...new Set(notifications.map(n => n.module))];
  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || n.type === filterType;
    const matchModule = filterModule === 'all' || n.module === filterModule;
    return matchSearch && matchType && matchModule;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: 'Notificações', description: 'Todas marcadas como lidas.' });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({ title: 'Removida', description: 'Notificação removida.' });
  };

  const clearAll = () => {
    setNotifications([]);
    toast({ title: 'Limpo', description: 'Todas as notificações foram removidas.' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={notifications.length === 0} className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar notificações..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="error">Erros</SelectItem>
            <SelectItem value="warning">Avisos</SelectItem>
            <SelectItem value="info">Informações</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground mt-1">Você está em dia com tudo!</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((n) => {
            const config = typeConfig[n.type];
            const Icon = config.icon;
            return (
              <Card
                key={n.id}
                className={cn(
                  'transition-all duration-200 hover:shadow-md cursor-pointer',
                  !n.read && 'border-l-4 border-l-primary bg-accent/30'
                )}
                onClick={() => markAsRead(n.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-2 rounded-full shrink-0', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn('font-medium text-foreground', !n.read && 'font-semibold')}>
                          {n.title}
                        </h4>
                        <Badge variant="outline" className="text-xs shrink-0">{n.module}</Badge>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(n.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.read && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
