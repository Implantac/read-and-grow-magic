import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Tabs, TabsList, TabsTrigger } from '@/ui/base/tabs';
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Package,
  Banknote,
  CheckCheck,
  Check,
  UserPlus,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Input } from '@/ui/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { useAppStore } from '@/stores/useAppStore';

interface Notif {
  id: string;
  type: string;
  title: string;
  description: string;
  module: string | null;
  read: boolean;
  created_at: string;
  assigned_to: string | null;
  due_at: string | null;
  resolved_at: string | null;
  escalated_at?: string | null;
  escalated_from?: string | null;
}

interface CompanyUser {
  id: string;
  name: string | null;
}

const ROUTE_BY_TITLE: Record<string, string> = {
  'Divergência faturamento × estoque': '/comercial/reconciliacao-faturamento-estoque',
  'Divergência bancária por canal': '/financeiro/conciliacao-canal',
};

const ICON_BY_TITLE: Record<string, typeof Package> = {
  'Divergência faturamento × estoque': Package,
  'Divergência bancária por canal': Banknote,
};

type FilterStatus = 'open' | 'resolved' | 'all' | 'mine' | 'overdue';

export default function DivergenceDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, userRole } = useAppStore();
  const isAdmin = userRole === 'admin' || userRole === 'admin_matriz';
  const [filter, setFilter] = useState<FilterStatus>('open');

  const [assignTarget, setAssignTarget] = useState<Notif | null>(null);
  const [assignUser, setAssignUser] = useState<string>('');
  const [assignDueAt, setAssignDueAt] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['divergence_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('title', [
          'Divergência faturamento × estoque',
          'Divergência bancária por canal',
        ])
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Notif[];
    },
    refetchInterval: 60_000,
  });

  const { data: companyUsers } = useQuery({
    queryKey: ['divergence_company_users'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name')
        .limit(200);
      if (error) throw error;
      return (data ?? []) as CompanyUser[];
    },
  });

  const notifs = data ?? [];
  const userNameById = useMemo(() => {
    const m = new Map<string, string>();
    (companyUsers ?? []).forEach((u) => m.set(u.id, u.name ?? '—'));
    return m;
  }, [companyUsers]);

  const openCount = notifs.filter((n) => !n.read).length;
  const overdueCount = notifs.filter(
    (n) => !n.read && n.due_at && isPast(new Date(n.due_at)),
  ).length;
  const mineCount = notifs.filter(
    (n) => !n.read && n.assigned_to && n.assigned_to === user?.id,
  ).length;
  const stockDiv = notifs.filter((n) => n.title.includes('faturamento'));
  const bankDiv = notifs.filter((n) => n.title.includes('bancária'));

  const filtered = useMemo(() => {
    switch (filter) {
      case 'open':
        return notifs.filter((n) => !n.read);
      case 'resolved':
        return notifs.filter((n) => n.read);
      case 'mine':
        return notifs.filter((n) => n.assigned_to === user?.id);
      case 'overdue':
        return notifs.filter(
          (n) => !n.read && n.due_at && isPast(new Date(n.due_at)),
        );
      default:
        return notifs;
    }
  }, [notifs, filter, user?.id]);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: ['divergence_notifications'] });
      toastSuccess(
        ids.length > 1 ? `${ids.length} alertas resolvidos` : 'Alerta resolvido',
      );
    },
    onError: handleMutationError,
  });

  const reopen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divergence_notifications'] });
      toastSuccess('Alerta reaberto');
    },
    onError: handleMutationError,
  });

  const assign = useMutation({
    mutationFn: async (input: {
      id: string;
      assigned_to: string | null;
      due_at: string | null;
    }) => {
      const { error } = await supabase.rpc('assign_notification', {
        _notification_id: input.id,
        _assigned_to: input.assigned_to,
        _due_at: input.due_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divergence_notifications'] });
      toastSuccess('Responsável atribuído');
      setAssignTarget(null);
    },
    onError: handleMutationError,
  });

  const openAssign = (n: Notif) => {
    setAssignTarget(n);
    setAssignUser(n.assigned_to ?? '');
    setAssignDueAt(n.due_at ? n.due_at.slice(0, 16) : '');
  };

  useEffect(() => {
    if (!assignTarget) {
      setAssignUser('');
      setAssignDueAt('');
    }
  }, [assignTarget]);

  const openIds = notifs.filter((n) => !n.read).map((n) => n.id);

  return (
    <PageContainer>
      <PageHeader
        title="Painel Executivo de Divergências"
        description="Consolida os alertas gerados pela conciliação automática diária."
        icon={AlertTriangle}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Alertas abertos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-500">{openCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Não resolvidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Vencidos (SLA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive">{overdueCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Prazo estourado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Faturamento × Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stockDiv.length}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1"
                  onClick={() => navigate('/comercial/reconciliacao-faturamento-estoque')}
                >
                  Abrir reconciliação <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Conciliação Bancária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{bankDiv.length}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1"
                  onClick={() => navigate('/financeiro/conciliacao-canal')}
                >
                  Abrir conciliação <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-amber-500" /> Histórico de alertas
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
                  <TabsList>
                    <TabsTrigger value="open">Abertos ({openCount})</TabsTrigger>
                    <TabsTrigger value="overdue">Vencidos ({overdueCount})</TabsTrigger>
                    <TabsTrigger value="mine">Meus ({mineCount})</TabsTrigger>
                    <TabsTrigger value="resolved">
                      Resolvidos ({notifs.length - openCount})
                    </TabsTrigger>
                    <TabsTrigger value="all">Todos ({notifs.length})</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={openIds.length === 0 || markRead.isPending}
                  onClick={() => markRead.mutate(openIds)}
                  className="gap-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  Resolver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title={filter === 'open' ? 'Sem divergências abertas' : 'Nenhum alerta'}
                  description={
                    filter === 'open'
                      ? 'Todas as divergências foram tratadas.'
                      : 'Nenhum alerta corresponde ao filtro selecionado.'
                  }
                />
              ) : (
                <div className="space-y-2">
                  {filtered.map((n) => {
                    const Icon = ICON_BY_TITLE[n.title] ?? AlertTriangle;
                    const route = ROUTE_BY_TITLE[n.title];
                    const isOverdue =
                      !n.read && n.due_at && isPast(new Date(n.due_at));
                    const assignedName = n.assigned_to
                      ? userNameById.get(n.assigned_to) ?? 'Responsável'
                      : null;
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          isOverdue
                            ? 'border-destructive/50 bg-destructive/5'
                            : 'bg-card hover:bg-accent/50'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 mt-0.5 shrink-0 ${
                            n.read
                              ? 'text-muted-foreground'
                              : isOverdue
                                ? 'text-destructive'
                                : 'text-amber-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{n.title}</p>
                            {!n.read ? (
                              <Badge variant="destructive" className="text-xs">
                                Aberto
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Resolvido
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <Clock className="h-3 w-3" /> Vencido
                              </Badge>
                            )}
                            {n.escalated_at && (
                              <Badge variant="destructive" className="text-xs gap-1">
                                🚨 Escalonado
                              </Badge>
                            )}
                            {assignedName && (
                              <Badge variant="outline" className="text-xs">
                                {assignedName}
                              </Badge>
                            )}
                            {n.due_at && !n.read && !isOverdue && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(n.due_at), "dd/MM HH:mm", { locale: ptBR })}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {n.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isAdmin && !n.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAssign(n)}
                              className="gap-1"
                            >
                              <UserPlus className="h-3 w-3" />
                              Atribuir
                            </Button>
                          )}
                          {route && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(route)}
                            >
                              Abrir <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          {!n.read ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={markRead.isPending}
                              onClick={() => markRead.mutate([n.id])}
                              className="gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Resolver
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={reopen.isPending}
                              onClick={() => reopen.mutate(n.id)}
                            >
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir responsável e SLA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={assignUser} onValueChange={setAssignUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {(companyUsers ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo (SLA)</Label>
              <Input
                type="datetime-local"
                value={assignDueAt}
                onChange={(e) => setAssignDueAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              disabled={assign.isPending}
              onClick={() =>
                assignTarget &&
                assign.mutate({
                  id: assignTarget.id,
                  assigned_to: null,
                  due_at: null,
                })
              }
            >
              Remover atribuição
            </Button>
            <Button
              disabled={assign.isPending || !assignUser}
              onClick={() =>
                assignTarget &&
                assign.mutate({
                  id: assignTarget.id,
                  assigned_to: assignUser || null,
                  due_at: assignDueAt ? new Date(assignDueAt).toISOString() : null,
                })
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
