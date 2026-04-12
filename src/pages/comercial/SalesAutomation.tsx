import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFollowUpTasks, useCreateFollowUp, useCompleteFollowUp, useWhatsAppTemplates, useNurturingSequences, useAISalesMessage } from '@/hooks/useFollowUpTasks';
import { useAIScores } from '@/hooks/useAICommercial';
import { useCommercialAlerts } from '@/hooks/useCommercialAlerts';
import { useToast } from '@/hooks/use-toast';
import { Bot, Phone, MessageSquare, Send, Clock, AlertTriangle, Users, Zap, CheckCircle2, Loader2, Calendar, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const today = new Date().toISOString().split('T')[0];

export default function SalesAutomation() {
  const [activeTab, setActiveTab] = useState('followups');
  
  return (
    <PageContainer>
      <PageHeader
        title="🤖 Automação Comercial"
        description="Follow-ups automáticos, WhatsApp, IA de mensagens e nutrição de leads"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-6">
          <TabsTrigger value="followups" className="text-xs">📋 Follow-ups</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">💬 WhatsApp</TabsTrigger>
          <TabsTrigger value="ai-messages" className="text-xs">🤖 IA Mensagens</TabsTrigger>
          <TabsTrigger value="nurturing" className="text-xs">🌱 Nutrição</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">🔔 Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="followups"><FollowUpTab /></TabsContent>
        <TabsContent value="whatsapp"><WhatsAppTab /></TabsContent>
        <TabsContent value="ai-messages"><AIMessagesTab /></TabsContent>
        <TabsContent value="nurturing"><NurturingTab /></TabsContent>
        <TabsContent value="alerts"><AlertsTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// ─── Follow-Up Tab ──────────────────────────────────────────────────────
function FollowUpTab() {
  const { data: tasks = [], isLoading } = useFollowUpTasks(undefined, 'pending');
  const { data: completedTasks = [] } = useFollowUpTasks(undefined, 'completed');
  const completeFollowUp = useCompleteFollowUp();
  const createFollowUp = useCreateFollowUp();
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ client_name: '', title: '', scheduled_date: today, action_type: 'call', priority: 'medium', channel: 'phone' });

  const todayTasks = tasks.filter(t => t.scheduled_date === today);
  const overdueTasks = tasks.filter(t => t.scheduled_date < today);
  const upcomingTasks = tasks.filter(t => t.scheduled_date > today);

  const handleCreate = () => {
    createFollowUp.mutate(newTask as any, {
      onSuccess: () => { setShowCreate(false); setNewTask({ client_name: '', title: '', scheduled_date: today, action_type: 'call', priority: 'medium', channel: 'phone' }); }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
          <div className="text-xs text-muted-foreground">Atrasados</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{todayTasks.length}</div>
          <div className="text-xs text-muted-foreground">Hoje</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{upcomingTasks.length}</div>
          <div className="text-xs text-muted-foreground">Próximos</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <div className="text-xs text-muted-foreground">Concluídos</div>
        </CardContent></Card>
      </div>

      {/* Create button */}
      <div className="flex justify-end">
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Zap className="h-4 w-4 mr-2" />Novo Follow-up</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Follow-up</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do cliente" value={newTask.client_name} onChange={e => setNewTask(p => ({ ...p, client_name: e.target.value }))} />
              <Input placeholder="Título da ação" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
              <Input type="date" value={newTask.scheduled_date} onChange={e => setNewTask(p => ({ ...p, scheduled_date: e.target.value }))} />
              <Select value={newTask.action_type} onValueChange={v => setNewTask(p => ({ ...p, action_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Ligação</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="email">📧 E-mail</SelectItem>
                  <SelectItem value="visit">🏢 Visita</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleCreate} disabled={!newTask.client_name || !newTask.title}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Atrasados ({overdueTasks.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map(t => <FollowUpItem key={t.id} task={t} onComplete={completeFollowUp.mutate} />)}
          </CardContent>
        </Card>
      )}

      {/* Today */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Hoje ({todayTasks.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {todayTasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum follow-up para hoje</p> : todayTasks.map(t => <FollowUpItem key={t.id} task={t} onComplete={completeFollowUp.mutate} />)}
        </CardContent>
      </Card>

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Próximos ({upcomingTasks.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.slice(0, 10).map(t => <FollowUpItem key={t.id} task={t} onComplete={completeFollowUp.mutate} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FollowUpItem({ task, onComplete }: { task: any; onComplete: (p: { id: string; result: string }) => void }) {
  const channelIcons: Record<string, string> = { call: '📞', whatsapp: '💬', email: '📧', visit: '🏢', phone: '📞' };
  const priorityColors: Record<string, string> = { high: 'destructive', medium: 'default', low: 'secondary' };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg">{channelIcons[task.action_type] || channelIcons[task.channel] || '📋'}</span>
        <div>
          <div className="font-medium text-sm">{task.title}</div>
          <div className="text-xs text-muted-foreground">{task.client_name} • {task.scheduled_date}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={priorityColors[task.priority] as any}>{task.priority}</Badge>
        {task.suggested_message && <Badge variant="outline" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />IA</Badge>}
        <Button size="sm" variant="ghost" onClick={() => onComplete({ id: task.id, result: 'Concluído' })}>
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── WhatsApp Tab ──────────────────────────────────────────────────────
function WhatsAppTab() {
  const { data: templates = [], isLoading } = useWhatsAppTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  const categoryLabels: Record<string, string> = {
    follow_up: '📋 Follow-up', proposal: '💼 Proposta', reactivation: '♻️ Reativação',
    reminder: '⏰ Lembrete', onboarding: '👋 Boas-vindas', satisfaction: '⭐ Satisfação', general: '📝 Geral'
  };

  const buildMessage = () => {
    if (!selectedTemplate) return '';
    let msg = selectedTemplate.body;
    (selectedTemplate.variables || []).forEach((v: string) => {
      msg = msg.replace(`{{${v}}}`, variables[v] || `[${v}]`);
    });
    return msg;
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(buildMessage());
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Templates de Mensagem</CardTitle>
          <CardDescription>Selecione um template para enviar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
            templates.map((t: any) => (
              <div key={t.id} onClick={() => { setSelectedTemplate(t); setVariables({}); }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.name}</span>
                  <Badge variant="outline" className="text-xs">{categoryLabels[t.category] || t.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" />Compor Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Telefone (com DDD)" value={phone} onChange={e => setPhone(e.target.value)} />
          
          {selectedTemplate && (selectedTemplate.variables || []).map((v: string) => (
            <Input key={v} placeholder={v} value={variables[v] || ''} onChange={e => setVariables(p => ({ ...p, [v]: e.target.value }))} />
          ))}

          <div className="p-3 rounded-lg bg-muted/50 min-h-[100px]">
            <p className="text-sm whitespace-pre-wrap">{selectedTemplate ? buildMessage() : 'Selecione um template...'}</p>
          </div>

          <Button className="w-full" onClick={sendWhatsApp} disabled={!selectedTemplate || !phone}>
            <Send className="h-4 w-4 mr-2" />Enviar via WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── AI Messages Tab ──────────────────────────────────────────────────
function AIMessagesTab() {
  const aiMessage = useAISalesMessage();
  const [context, setContext] = useState({ clientName: '', segment: '', situation: 'follow_up', objective: '', lastPurchase: '', avgTicket: '' });
  const [result, setResult] = useState('');
  const [objection, setObjection] = useState('');
  const [objectionResult, setObjectionResult] = useState('');

  const generateMessage = () => {
    aiMessage.mutate({ action: 'suggest_message', context }, {
      onSuccess: (data) => setResult(data.result || ''),
    });
  };

  const handleObjection = () => {
    aiMessage.mutate({ action: 'suggest_objection_response', context: { objection, product: 'ERP USE SISTEMAS' } }, {
      onSuccess: (data) => setObjectionResult(data.result || ''),
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Message Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4" />Gerar Mensagem com IA</CardTitle>
          <CardDescription>A IA cria mensagens personalizadas por contexto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nome do cliente" value={context.clientName} onChange={e => setContext(p => ({ ...p, clientName: e.target.value }))} />
          <Input placeholder="Segmento" value={context.segment} onChange={e => setContext(p => ({ ...p, segment: e.target.value }))} />
          <Select value={context.situation} onValueChange={v => setContext(p => ({ ...p, situation: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="reactivation">Reativação</SelectItem>
              <SelectItem value="proposal">Proposta</SelectItem>
              <SelectItem value="closing">Fechamento</SelectItem>
              <SelectItem value="onboarding">Boas-vindas</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Objetivo específico" value={context.objective} onChange={e => setContext(p => ({ ...p, objective: e.target.value }))} />
          <Button className="w-full" onClick={generateMessage} disabled={!context.clientName || aiMessage.isPending}>
            {aiMessage.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar Mensagem
          </Button>
          {result && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm whitespace-pre-wrap">{result}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                const msg = encodeURIComponent(result);
                navigator.clipboard.writeText(result);
              }}>Copiar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objection Handler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" />Respostas para Objeções</CardTitle>
          <CardDescription>Cole a objeção do cliente e receba a resposta ideal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="Ex: 'Está muito caro', 'Vou pensar', 'Preciso consultar meu sócio'..." value={objection} onChange={e => setObjection(e.target.value)} rows={3} />
          <Button className="w-full" onClick={handleObjection} disabled={!objection || aiMessage.isPending}>
            {aiMessage.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
            Sugerir Resposta
          </Button>
          {objectionResult && (
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm whitespace-pre-wrap">{objectionResult}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => navigator.clipboard.writeText(objectionResult)}>Copiar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Nurturing Tab ──────────────────────────────────────────────────
function NurturingTab() {
  const { data: sequences = [], isLoading } = useNurturingSequences();

  const triggerLabels: Record<string, string> = {
    manual: 'Manual', new_lead: 'Novo Lead', inactive: 'Cliente Inativo',
    post_purchase: 'Pós-Compra', proposal_sent: 'Proposta Enviada'
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{sequences.length}</div>
          <div className="text-xs text-muted-foreground">Sequências</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{sequences.filter((s: any) => s.is_active).length}</div>
          <div className="text-xs text-muted-foreground">Ativas</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{sequences.reduce((a: number, s: any) => a + (s.total_enrolled || 0), 0)}</div>
          <div className="text-xs text-muted-foreground">Leads em Nutrição</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sequências de Nutrição</CardTitle>
          <CardDescription>Fluxos automáticos de acompanhamento de leads</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
            sequences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma sequência criada ainda</p>
                <p className="text-xs">Use a IA Comercial para gerar sequências automaticamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sequences.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{triggerLabels[s.trigger_event] || s.trigger_event}</Badge>
                        <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">{s.is_active ? 'Ativa' : 'Inativa'}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{s.total_enrolled || 0}</div>
                      <div className="text-xs text-muted-foreground">inscritos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Alerts Tab ──────────────────────────────────────────────────────
function AlertsTab() {
  const { data: alerts = [], isLoading } = useCommercialAlerts('active');
  const { data: scores = [] } = useAIScores();

  const hotLeads = scores.filter(s => s.score_numeric >= 80);
  const riskClients = scores.filter(s => s.churn_probability > 0.5);
  const dormantClients = scores.filter(s => (s.days_since_purchase || 0) > 90);

  const severityColors: Record<string, string> = { critical: 'destructive', high: 'destructive', medium: 'default', low: 'secondary' };

  return (
    <div className="space-y-6">
      {/* Detection KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30"><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{hotLeads.length}</div>
          <div className="text-xs text-muted-foreground">🔥 Leads Quentes</div>
        </CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{riskClients.length}</div>
          <div className="text-xs text-muted-foreground">⚠️ Risco de Perda</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{dormantClients.length}</div>
          <div className="text-xs text-muted-foreground">💤 Inativos (+90d)</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{alerts.length}</div>
          <div className="text-xs text-muted-foreground">🔔 Alertas Ativos</div>
        </CardContent></Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Alertas Inteligentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
            alerts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta ativo</p> :
            alerts.slice(0, 15).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.description}</div>
                </div>
                <Badge variant={severityColors[a.severity] as any}>{a.severity}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Dormant Clients for Recovery */}
      {dormantClients.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">♻️ Recuperação de Clientes Inativos</CardTitle><CardDescription>Clientes sem compra há mais de 90 dias</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {dormantClients.slice(0, 10).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">{c.clients?.name}</div>
                  <div className="text-xs text-muted-foreground">{c.days_since_purchase} dias sem compra • Score: {c.score_grade}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const phone = c.clients?.cellphone || c.clients?.phone || '';
                    const cleanPhone = phone.replace(/\D/g, '');
                    if (cleanPhone) window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                  }}>
                    <MessageSquare className="h-3 w-3 mr-1" />WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
