import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSmartSalesQueue, useRepExecutionMetrics, useLostClients, useCreateContactLog, useDailyGoals } from '@/hooks/useSalesExecution';
import { useSalesReps } from '@/hooks/useSalesReps';
import { Flame, Phone, Clock, AlertTriangle, Trophy, Target, UserX, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

function TodayGoalCards() {
  const today = new Date().toISOString().split('T')[0];
  const { data: goals } = useDailyGoals(undefined, today);
  const { data: reps } = useSalesReps();

  const totals = useMemo(() => {
    if (!goals?.length) return { contacts: 0, tContacts: 0, proposals: 0, tProposals: 0, value: 0, tValue: 0 };
    return goals.reduce((acc, g) => ({
      contacts: acc.contacts + g.achieved_contacts,
      tContacts: acc.tContacts + g.target_contacts,
      proposals: acc.proposals + g.achieved_proposals,
      tProposals: acc.tProposals + g.target_proposals,
      value: acc.value + Number(g.achieved_value),
      tValue: acc.tValue + Number(g.target_value),
    }), { contacts: 0, tContacts: 0, proposals: 0, tProposals: 0, value: 0, tValue: 0 });
  }, [goals]);

  const cards = [
    { label: 'Contatos Hoje', achieved: totals.contacts, target: totals.tContacts || 30, icon: Phone, color: 'text-blue-500' },
    { label: 'Propostas Hoje', achieved: totals.proposals, target: totals.tProposals || 10, icon: Target, color: 'text-emerald-500' },
    { label: 'Valor Hoje', achieved: totals.value, target: totals.tValue || 50000, icon: Zap, color: 'text-amber-500', isCurrency: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => {
        const pct = c.target > 0 ? Math.min(100, Math.round((c.achieved / c.target) * 100)) : 0;
        return (
          <Card key={c.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold">
                {c.isCurrency ? `R$ ${c.achieved.toLocaleString('pt-BR')}` : c.achieved}
                <span className="text-sm font-normal text-muted-foreground"> / {c.isCurrency ? `R$ ${c.target.toLocaleString('pt-BR')}` : c.target}</span>
              </div>
              <Progress value={pct} className="mt-2 h-2" />
              <span className={`text-xs font-medium ${pct >= 100 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
                {pct}% concluído
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SmartQueueTab() {
  const { data: queue, isLoading } = useSmartSalesQueue();
  const createContact = useCreateContactLog();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [contactForm, setContactForm] = useState({ contact_type: 'phone', result: 'answered', notes: '', next_action: '', next_action_date: '' });

  const handleLogContact = () => {
    if (!selectedItem) return;
    createContact.mutate({
      sales_rep_id: selectedItem.sales_rep_id,
      client_id: selectedItem.client_id,
      funnel_id: selectedItem.id,
      ...contactForm,
      next_action_date: contactForm.next_action_date || null,
    } as any, { onSuccess: () => setSelectedItem(null) });
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Flame className="h-4 w-4 text-orange-500" />
        Fila ordenada automaticamente por urgência. O sistema decide a prioridade.
      </div>
      <div className="space-y-2">
        {(queue || []).slice(0, 20).map((item: any, idx: number) => (
          <Card key={item.id} className={`border-l-4 ${item.isOverdue ? 'border-l-destructive' : item.hasNoFollowUp ? 'border-l-amber-500' : 'border-l-primary'}`}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                  <span className="font-semibold truncate">{item.title || item.contact_name || 'Oportunidade'}</span>
                  <Badge variant={item.isOverdue ? 'destructive' : item.hasNoFollowUp ? 'secondary' : 'default'} className="text-xs">
                    {item.isOverdue ? 'ATRASADO' : item.hasNoFollowUp ? 'SEM FOLLOW-UP' : item.stage}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>R$ {(item.value || 0).toLocaleString('pt-BR')}</span>
                  <span>{item.probability || 0}% chance</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.daysSinceContact < 999 ? `${item.daysSinceContact}d sem contato` : 'Nunca contatado'}
                  </span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setSelectedItem(item)}>
                    <Phone className="h-3 w-3 mr-1" /> Registrar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Contato</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Select value={contactForm.contact_type} onValueChange={(v) => setContactForm(p => ({ ...p, contact_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="visit">Visita</SelectItem>
                        <SelectItem value="meeting">Reunião</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={contactForm.result} onValueChange={(v) => setContactForm(p => ({ ...p, result: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="answered">Atendeu</SelectItem>
                        <SelectItem value="no_answer">Não atendeu</SelectItem>
                        <SelectItem value="callback">Retornar</SelectItem>
                        <SelectItem value="proposal_sent">Proposta enviada</SelectItem>
                        <SelectItem value="order_placed">Pedido feito</SelectItem>
                        <SelectItem value="rejected">Recusou</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Observações..." value={contactForm.notes} onChange={(e) => setContactForm(p => ({ ...p, notes: e.target.value }))} />
                    <Input placeholder="Próximo passo obrigatório *" value={contactForm.next_action} onChange={(e) => setContactForm(p => ({ ...p, next_action: e.target.value }))} />
                    <Input type="date" value={contactForm.next_action_date} onChange={(e) => setContactForm(p => ({ ...p, next_action_date: e.target.value }))} />
                    {!contactForm.next_action && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Defina o próximo passo!
                      </p>
                    )}
                    <Button className="w-full" onClick={handleLogContact} disabled={!contactForm.next_action || createContact.isPending}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Salvar Contato
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
        {(!queue || queue.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma oportunidade ativa no funil.
          </div>
        )}
      </div>
    </div>
  );
}

function RankingTab() {
  const { data: metrics, isLoading } = useRepExecutionMetrics();
  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded" />;
  if (!metrics?.length) return <p className="text-muted-foreground text-center py-8">Sem dados de execução.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="h-4 w-4 text-amber-500" /> Ranking por produtividade e execução
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Contatos/dia</TableHead>
            <TableHead className="text-right">Propostas</TableHead>
            <TableHead className="text-right">Pedidos</TableHead>
            <TableHead className="text-right">Conversão</TableHead>
            <TableHead className="text-right">Tempo Resp.</TableHead>
            <TableHead className="text-right">S/ Follow-up</TableHead>
            <TableHead className="text-right">Pipeline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((rep: any, i: number) => (
            <TableRow key={rep.id}>
              <TableCell>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </TableCell>
              <TableCell className="font-medium">{rep.name}</TableCell>
              <TableCell className="text-right">{rep.contactsPerDay}</TableCell>
              <TableCell className="text-right">{rep.proposals}</TableCell>
              <TableCell className="text-right">{rep.ordersPlaced}</TableCell>
              <TableCell className="text-right">
                <Badge variant={rep.conversionRate >= 15 ? 'default' : rep.conversionRate >= 5 ? 'secondary' : 'destructive'}>
                  {rep.conversionRate}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={rep.avgResponseTime > 120 ? 'text-destructive' : ''}>{rep.avgResponseTime} min</span>
              </TableCell>
              <TableCell className="text-right">
                {rep.noFollowUp > 0 && <Badge variant="destructive">{rep.noFollowUp}</Badge>}
                {rep.noFollowUp === 0 && <CheckCircle className="h-4 w-4 text-emerald-500 inline" />}
              </TableCell>
              <TableCell className="text-right">R$ {rep.pipelineValue.toLocaleString('pt-BR')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LostClientsTab() {
  const { data: clients, isLoading } = useLostClients();
  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded" />;
  if (!clients?.length) return <p className="text-muted-foreground text-center py-8">Nenhum cliente sem compra há 90+ dias.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserX className="h-4 w-4 text-destructive" /> Clientes sem compra há 90+ dias — recupere agora
      </div>
      <div className="space-y-2">
        {clients.map((c: any) => (
          <Card key={c.id} className="border-l-4 border-l-destructive">
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.name}</span>
                  {c.abc_classification && <Badge variant="outline">{c.abc_classification}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                  <span>Última compra: {c.daysSinceLastPurchase}d atrás</span>
                  <span>Total: R$ {(c.total_purchases || 0).toLocaleString('pt-BR')}</span>
                  <span>Ticket médio: R$ {(c.avg_ticket || 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {c.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${c.phone}`}><Phone className="h-3 w-3" /></a>
                  </Button>
                )}
                <Button size="sm">
                  <ArrowRight className="h-3 w-3 mr-1" /> Ação
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SalesExecution() {
  return (
    <PageContainer>
      <PageHeader
        title="⚡ O Que Fazer Hoje"
        description="Sistema de execução de vendas — foco em ação, disciplina e resultado"
      />

      <TodayGoalCards />

      <Tabs defaultValue="queue" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue" className="flex items-center gap-1">
            <Flame className="h-4 w-4" /> Fila Inteligente
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" /> Ranking
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-1">
            <UserX className="h-4 w-4" /> Recuperação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue"><SmartQueueTab /></TabsContent>
        <TabsContent value="ranking"><RankingTab /></TabsContent>
        <TabsContent value="recovery"><LostClientsTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
