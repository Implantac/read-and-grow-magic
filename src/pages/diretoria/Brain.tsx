import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Zap, CheckCircle2, XCircle, Send, RefreshCw, Sparkles, AlertTriangle, Database, History, Bot, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useBrainDecisions, useApproveDecision, useBrainMemories, useBrainRuns, useRunBrain, useBrainChat } from '@/hooks/useAIBrain';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

const impactColor: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'default',
  approved: 'secondary',
  rejected: 'destructive',
  auto_executed: 'secondary',
  executed: 'secondary',
};

export default function BrainPage() {
  const { data: pending = [] } = useBrainDecisions('pending');
  const { data: allDecisions = [] } = useBrainDecisions();
  const { data: memories = [] } = useBrainMemories();
  const { data: runs = [] } = useBrainRuns();
  const runBrain = useRunBrain();
  const approve = useApproveDecision();
  const { messages, loading, send, clear } = useBrainChat();
  const [input, setInput] = useState('');

  const lastRun = runs[0];
  const veredicto = lastRun?.structured?.veredicto;
  const saude = lastRun?.structured?.saude_geral;
  const autoExec = allDecisions.filter((d) => d.status === 'auto_executed').length;
  const critical = allDecisions.filter((d) => d.impact_level === 'critical' && d.status === 'pending').length;

  const handleSend = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput('');
    send(t);
  };

  return (
    <PageContainer>
      <PageHeader
        title="🧠 Cérebro Nativo"
        description="Núcleo de IA do ERP — orquestra todos os módulos, memória de longo prazo, decisões com guardrails"
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/diretoria/brain/aprendizado"><GraduationCap className="h-4 w-4" /> Aprendizado</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => runBrain.mutate('analyze')} disabled={runBrain.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${runBrain.isPending ? 'animate-spin' : ''}`} /> Analisar agora
        </Button>
        <Button size="sm" onClick={() => runBrain.mutate('autopilot')} disabled={runBrain.isPending} className="gap-2">
          <Zap className="h-4 w-4" /> Modo Autopilot
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Saúde geral" value={saude === 'critico' ? '🔴 Crítica' : saude === 'alerta' ? '⚠️ Alerta' : saude === 'ok' ? '✅ OK' : '—'} subtitle="último diagnóstico" icon={<Brain className="h-5 w-5" />} accentColor={saude === 'critico' ? 'danger' : saude === 'alerta' ? 'warning' : 'success'} index={0} />
        <KPICard title="Decisões pendentes" value={pending.length} subtitle="aguardando aprovação" icon={<AlertTriangle className="h-5 w-5" />} accentColor={critical > 0 ? 'danger' : 'default'} index={1} />
        <KPICard title="Auto-executadas" value={autoExec} subtitle="ações seguras pelo cérebro" icon={<Zap className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Memórias" value={memories.length} subtitle="conhecimento acumulado" icon={<Database className="h-5 w-5" />} index={3} />
      </div>

      {veredicto && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Veredicto do Cérebro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{veredicto}</p>
            {lastRun && <p className="text-xs text-muted-foreground mt-2">Atualizado {format(new Date(lastRun.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {lastRun.decisions_count} decisões geradas</p>}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decisions">Decisões ({pending.length})</TabsTrigger>
          <TabsTrigger value="chat"><Bot className="h-4 w-4 mr-1" /> Chat com o Cérebro</TabsTrigger>
          <TabsTrigger value="memory"><Database className="h-4 w-4 mr-1" /> Memória</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-3">
          {allDecisions.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Brain className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma decisão ainda. Clique em "Analisar agora" para o cérebro processar o ERP.</p></CardContent></Card>
          )}
          {allDecisions.map((d) => (
            <Card key={d.id} className={d.status === 'pending' ? 'border-l-4 border-l-primary' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={impactColor[d.impact_level]}>{d.impact_level.toUpperCase()}</Badge>
                      <Badge variant="outline" className="uppercase text-[10px]">{d.module}</Badge>
                      <Badge variant="outline" className="text-[10px]">{d.decision_type}</Badge>
                      <Badge variant={statusColor[d.status] || 'default'} className="text-[10px]">{d.status}</Badge>
                      <span className="text-xs text-muted-foreground">conf. {(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <h4 className="font-semibold text-sm">{d.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{d.rationale}</p>
                    {d.proposed_action?.tool && (
                      <div className="mt-2 text-xs bg-muted/50 rounded p-2 font-mono">→ {d.proposed_action.tool}{d.proposed_action.params ? ` (${JSON.stringify(d.proposed_action.params).slice(0, 80)})` : ''}</div>
                    )}
                  </div>
                  {d.status === 'pending' && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="default" onClick={() => approve.mutate({ id: d.id, approve: true })} disabled={approve.isPending} className="gap-1"><CheckCircle2 className="h-3 w-3" /> Aprovar</Button>
                      <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: d.id, approve: false })} disabled={approve.isPending} className="gap-1"><XCircle className="h-3 w-3" /> Rejeitar</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Conversa direta com o cérebro do ERP</CardTitle>
              {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clear}>Limpar</Button>}
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[420px] border rounded-lg p-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    💬 Pergunte qualquer coisa sobre o negócio. O cérebro tem acesso a KPIs, financeiro, vendas, produção e memória de longo prazo.
                  </p>
                )}
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {m.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                        ) : m.content}
                      </div>
                      {m.actions && m.actions.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1 max-w-[85%]">
                          {m.actions.map((a, i) => (
                            <div key={i} className={`text-[11px] rounded border px-2 py-1 ${a.result?.ok ? 'border-green-500/40 bg-green-500/10' : a.result?.pending_approval ? 'border-amber-500/40 bg-amber-500/10' : 'border-destructive/40 bg-destructive/10'}`}>
                              <span className="font-mono font-semibold">⚙ {a.tool}</span>
                              {' '}
                              {a.result?.ok ? '✅ executada' : a.result?.pending_approval ? '⏳ aguarda aprovação' : '❌ ' + (a.result?.error || 'falhou')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && <div className="text-xs text-muted-foreground">🧠 pensando...</div>}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ex.: Qual o maior risco financeiro agora? O que fazer com o cliente X?"
                  className="resize-none"
                  rows={2}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-2">
          {memories.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma memória ainda. O cérebro acumula fatos, padrões e regras a cada análise.</CardContent></Card>}
          {memories.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <Badge variant="outline" className="text-[10px] uppercase shrink-0">{m.category}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold">{m.key}</span>
                    <span className="text-[10px] text-muted-foreground">imp. {m.importance}</span>
                    <Badge variant="secondary" className="text-[10px]">{m.scope}</Badge>
                  </div>
                  <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">{typeof m.value === 'string' ? m.value : JSON.stringify(m.value, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-2">
          {runs.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Badge variant={r.status === 'completed' ? 'secondary' : r.status === 'failed' ? 'destructive' : 'default'}>{r.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{r.mode}</Badge>
                <div className="flex-1 text-sm truncate">{r.synthesis || '—'}</div>
                <span className="text-xs text-muted-foreground shrink-0">{r.decisions_count} dec. · {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}</span>
                <span className="text-xs text-muted-foreground shrink-0">{format(new Date(r.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
