import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';

interface Notif {
  id: string;
  type: string;
  title: string;
  description: string;
  module: string | null;
  read: boolean;
  created_at: string;
}

const ROUTE_BY_TITLE: Record<string, string> = {
  'Divergência faturamento × estoque': '/comercial/reconciliacao-faturamento-estoque',
  'Divergência bancária por canal': '/financeiro/conciliacao-canal',
};

const ICON_BY_TITLE: Record<string, typeof Package> = {
  'Divergência faturamento × estoque': Package,
  'Divergência bancária por canal': Banknote,
};

type FilterStatus = 'open' | 'resolved' | 'all';

export default function DivergenceDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('open');

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

  const notifs = data ?? [];
  const openCount = notifs.filter((n) => !n.read).length;
  const stockDiv = notifs.filter((n) => n.title.includes('faturamento'));
  const bankDiv = notifs.filter((n) => n.title.includes('bancária'));

  const filtered = useMemo(() => {
    if (filter === 'open') return notifs.filter((n) => !n.read);
    if (filter === 'resolved') return notifs.filter((n) => n.read);
    return notifs;
  }, [notifs, filter]);

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

  const openIds = notifs.filter((n) => !n.read).map((n) => n.id);

  return (
    <PageContainer>
      <PageHeader
        title="Painel Executivo de Divergências"
        description="Consolida os alertas gerados pela conciliação automática diária."
        icon={AlertTriangle}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
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
              <div className="flex items-center gap-2">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
                  <TabsList>
                    <TabsTrigger value="open">Abertos ({openCount})</TabsTrigger>
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
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Icon
                          className={`h-5 w-5 mt-0.5 shrink-0 ${
                            n.read ? 'text-muted-foreground' : 'text-amber-500'
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
    </PageContainer>
  );
}
