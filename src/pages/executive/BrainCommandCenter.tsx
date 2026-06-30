import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Textarea } from '@/ui/base/textarea';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Brain, Zap, CheckCircle2, XCircle, Send, RefreshCw, Sparkles, AlertTriangle, GraduationCap, Bot, Bell, Database, Target } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useBrainDecisions, useApproveDecision, useBrainRuns, useRunBrain, useBrainChat, useBrainLearning, useNotifyCritical } from '@/hooks/ai/useAIBrain';
import { AIConsensusPanel } from '@/components/executive/AIConsensusPanel';
import { ExecutiveConsensus } from '@/components/executive/ExecutiveConsensus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const impactColor: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

const AGENTS = [
  { id: 'general', label: '🧠 Geral' },
  { id: 'financial', label: '💰 CFO' },
  { id: 'commercial', label: '📈 Vendas' },
  { id: 'fiscal', label: '🧾 Fiscal' },
  { id: 'operational', label: '🚚 Operações' },
  { id: 'production', label: '🏭 PCP' },
  { id: 'quality', label: '🔬 Qualidade' },
];


export default function BrainCommandCenter() {
  const { data: pending = [], isLoading: loadingPending } = useBrainDecisions('pending');
  const { data: runs = [], isLoading: loadingRuns } = useBrainRuns();
  const { data: learning } = useBrainLearning();
  const runBrain = useRunBrain();
  const approve = useApproveDecision();
  const notify = useNotifyCritical();
  const { messages, loading, send, clear } = useBrainChat();
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState<string>(() => localStorage.getItem('brain.agent') || 'general');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const agentToolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { localStorage.setItem('brain.agent', agent); }, [agent]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  // Atalhos de teclado globais
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (e.key === '/' && !inField) {
        e.preventDefault();
        textareaRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        clear();
        toast.success('Conversa limpa');
      } else if (e.key === 'Escape' && document.activeElement === textareaRef.current) {
        setInput('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clear]);

  const lastRun = runs[0];
  const veredicto = lastRun?.structured?.veredicto;
  const saude = lastRun?.structured?.saude_geral;
  const riscos = lastRun?.structured?.riscos || [];
  const oportunidades = lastRun?.structured?.oportunidades || [];
  const kpisChave = lastRun?.structured?.kpis_chave || [];
  const critical = pending.filter((d) => d.impact_level === 'critical').length;

  const handleSend = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput('');
    send(t, agent);
  };

  const handleAgentKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = agentToolbarRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    if (!buttons || buttons.length === 0) return;
    let next = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    const target = buttons[next];
    target.focus();
    setAgent(AGENTS[next].id);
  };

  const handleNotify = async () => {
    try {
      const r: any = await notify.mutateAsync();
      if (r?.skipped) toast.warning('Configure o secret BRAIN_WEBHOOK_URL para enviar alertas externos.');
      else if (r?.ok) toast.success(`${r.sent} alerta(s) enviado(s) ao canal externo.`);
      else toast.error('Falha ao enviar.');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao notificar');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="🎯 Centro de Comando IA"
        description="Gestão de vereditos, decisões autônomas e agentes especializados do Cérebro ERP"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 gap-2">
            <Link to="/executive/brain/aprendizado"><GraduationCap className="h-4 w-4" /> Aprendizado</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleNotify} disabled={notify.isPending} className="h-8 gap-2">
            <Bell className="h-4 w-4" /> Alertar Externo
          </Button>
          <Button variant="outline" size="sm" onClick={() => runBrain.mutate('analyze')} disabled={runBrain.isPending} className="h-8 gap-2">
            <RefreshCw className={cn("h-4 w-4", runBrain.isPending && "animate-spin")} /> Analisar Agora
          </Button>
          <Button size="sm" onClick={() => runBrain.mutate('autopilot')} disabled={runBrain.isPending} className="h-8 gap-2 bg-primary shadow-lg shadow-primary/20">
            <Zap className="h-4 w-4" /> Ativar Autopilot
          </Button>
        </div>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Saúde geral" value={saude === 'critico' ? '🔴 Crítica' : saude === 'alerta' ? '⚠️ Alerta' : saude === 'ok' ? '✅ OK' : '—'} subtitle="último diagnóstico" icon={<Brain className="h-5 w-5" />} accentColor={saude === 'critico' ? 'danger' : saude === 'alerta' ? 'warning' : 'success'} index={0} />
        <KPICard title="Pendentes" value={pending.length} subtitle={critical > 0 ? `${critical} críticas` : 'aguardando'} icon={<AlertTriangle className="h-5 w-5" />} accentColor={critical > 0 ? 'danger' : 'default'} index={1} />
        <KPICard title="Aprovação IA" value={learning ? `${(learning.approvalRate * 100).toFixed(0)}%` : '—'} subtitle="taxa histórica" icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Auto-exec" value={learning?.autoExecuted ?? 0} subtitle="ações seguras" icon={<Zap className="h-5 w-5" />} index={3} />
      </div>

      {/* Veredicto */}
      {veredicto && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Veredicto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{veredicto}</p>
            {lastRun && <p className="text-xs text-muted-foreground">Atualizado {lastRun.created_at ? format(new Date(lastRun.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'} · {lastRun.decisions_count} decisões</p>}
            {kpisChave.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {kpisChave.slice(0, 6).map((k: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {k.status === 'critico' ? '🔴' : k.status === 'alerta' ? '⚠️' : '✅'} {k.nome}: <span className="ml-1 font-semibold">{k.valor}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid principal: Consenso IA + Executive + Chat */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Painel do Consenso de IA (Novo) */}
        <div className="xl:col-span-1">
          <AIConsensusPanel />
        </div>

        {/* Conselho Executivo */}
        <div className="xl:col-span-1">
          <ExecutiveConsensus />
        </div>

        {/* Pendentes */}
        <Card className="flex flex-col xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" /> Decisões Pendentes ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[480px] pr-3">
              {pending.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">✨ Tudo em ordem.</div>
              )}
              <div className="space-y-3">
                {pending.map((d) => (
                  <div key={d.id} className="border-l-2 border-primary/60 pl-3 py-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={`${impactColor[d.impact_level]} text-[10px]`}>{d.impact_level.toUpperCase()}</Badge>
                      <Badge variant="outline" className="text-[10px] uppercase">{d.module}</Badge>
                      <span className="text-[10px] text-muted-foreground">conf. {(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-sm font-semibold">{d.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{d.rationale}</div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="default" onClick={() => approve.mutate({ id: d.id, approve: true })} disabled={approve.isPending} className="h-7 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: d.id, approve: false })} disabled={approve.isPending} className="h-7 gap-1 text-xs">
                        <XCircle className="h-3 w-3" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-1 mt-4">
        {/* Chat com agente especializado movido para baixo ou lateral para cockpit panorâmico */}

        {/* Chat com agente especializado */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" id="agentes-titulo">
                <Bot className="h-4 w-4 text-primary" aria-hidden="true" /> Agentes especializados
              </CardTitle>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs" aria-label="Limpar conversa (Ctrl+L)">
                  Limpar
                </Button>
              )}
            </div>
            <div
              ref={agentToolbarRef}
              role="radiogroup"
              aria-label="Selecionar agente especializado"
              className="flex flex-wrap gap-1"
            >
              {AGENTS.map((a, i) => (
                <Button
                  key={a.id}
                  size="sm"
                  variant={agent === a.id ? 'default' : 'outline'}
                  onClick={() => setAgent(a.id)}
                  onKeyDown={(e) => handleAgentKeyDown(e, i)}
                  role="radio"
                  aria-checked={agent === a.id}
                  tabIndex={agent === a.id ? 0 : -1}
                  className="h-7 text-[11px] px-2"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col">
            <ScrollArea className="h-[380px] border rounded-lg p-3 flex-1">
              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Conversa com agente especializado"
              >
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    💬 Selecione um agente acima e pergunte. Cada persona tem foco e tom próprios.
                  </p>
                )}
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        aria-label={m.role === 'user' ? 'Sua mensagem' : 'Resposta do agente'}
                      >
                        {m.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                        ) : m.content}
                      </div>
                      {m.actions && m.actions.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1 max-w-[90%]" role="list" aria-label="Ações executadas">
                          {m.actions.map((a, i) => (
                            <div
                              key={i}
                              role="listitem"
                              className={`text-[11px] rounded border px-2 py-1 ${a.result?.ok ? 'border-green-500/40 bg-green-500/10' : a.result?.pending_approval ? 'border-amber-500/40 bg-amber-500/10' : 'border-destructive/40 bg-destructive/10'}`}
                            >
                              <span className="font-mono font-semibold" aria-hidden="true">⚙ {a.tool}</span>{' '}
                              <span className="sr-only">Ferramenta {a.tool}: </span>
                              {a.result?.ok ? '✅ executada' : a.result?.pending_approval ? '⏳ aguarda aprovação' : '❌ ' + (a.result?.error || 'falhou')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div role="status" aria-live="polite" className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                      <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:120ms]" aria-hidden="true" />
                      <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:240ms]" aria-hidden="true" />
                      <span>cérebro pensando…</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </ScrollArea>

            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              aria-label="Enviar mensagem ao agente"
            >
              <label htmlFor="brain-cmd-input" className="sr-only">
                Mensagem para o agente {AGENTS.find((a) => a.id === agent)?.label || ''}
              </label>
              <Textarea
                id="brain-cmd-input"
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Pergunte ao ${AGENTS.find((a) => a.id === agent)?.label || 'agente'}... (atalho: /)`}
                className="resize-none"
                rows={2}
                aria-describedby="brain-cmd-hint"
              />
              <span id="brain-cmd-hint" className="sr-only">
                Pressione Enter para enviar, Shift+Enter para nova linha, Esc para limpar, Ctrl+L para limpar a conversa.
              </span>
              <Button type="submit" disabled={loading || !input.trim()} aria-label="Enviar mensagem">
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>


      {/* Calibração + Top memórias */}
      {learning && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Calibração da IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {learning.calibration.map((c) => (
                <div key={c.bucket} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono">{c.bucket} <span className="text-muted-foreground">({c.n})</span></span>
                    <span>declarada {c.declared}% · real {c.actual}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden flex">
                    <div className="bg-primary/60" style={{ width: `${c.declared}%` }} />
                    <div className="bg-green-500/70 -ml-px" style={{ width: `${Math.max(0, c.actual - c.declared)}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1">Barra azul = confiança declarada. Verde = quanto acima do declarado o real ficou.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Top memórias do Cérebro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {learning.topMemories.length === 0 && <p className="text-sm text-muted-foreground">Sem memórias ainda.</p>}
              {learning.topMemories.slice(0, 8).map((m) => (
                <div key={m.id} className="border-l-2 border-primary/40 pl-3 py-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] uppercase">{m.category}</Badge>
                    <span className="font-mono font-semibold">{m.key}</span>
                    <span className="text-[10px] text-muted-foreground">imp. {m.importance}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {typeof m.value === 'string' ? m.value : JSON.stringify(m.value).slice(0, 200)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Riscos & oportunidades */}
      {(riscos.length > 0 || oportunidades.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">🔴 Riscos identificados</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {riscos.length === 0 && <p className="text-sm text-muted-foreground">Sem riscos materiais.</p>}
              {riscos.map((r: any, i: number) => (
                <div key={i} className="text-sm border-l-2 border-destructive/60 pl-3 py-1">
                  <div className="font-semibold">{r.titulo} <Badge variant="outline" className="text-[10px] ml-1">{r.impacto}</Badge></div>
                  <div className="text-xs text-muted-foreground">→ {r.acao}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">💡 Oportunidades</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {oportunidades.length === 0 && <p className="text-sm text-muted-foreground">Sem oportunidades destacadas.</p>}
              {oportunidades.map((o: any, i: number) => (
                <div key={i} className="text-sm border-l-2 border-green-500/60 pl-3 py-1">
                  <div className="font-semibold">{o.titulo} {o.valor_estimado && <Badge variant="outline" className="text-[10px] ml-1">{o.valor_estimado}</Badge>}</div>
                  <div className="text-xs text-muted-foreground">→ {o.acao}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
