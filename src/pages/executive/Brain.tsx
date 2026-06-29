import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Textarea } from '@/ui/base/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Input } from '@/ui/base/input';
import {
  Brain, Zap, CheckCircle2, XCircle, Send, RefreshCw, Sparkles, AlertTriangle,
  Database, History, Bot, GraduationCap, Search, User2, ArrowDown, Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/shared/components/PageContainer';
import {
  useBrainDecisions, useApproveDecision, useBrainMemories, useBrainRuns,
  useRunBrain, useBrainChat,
} from '@/hooks/ai/useAIBrain';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const impactColor: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  high: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  auto_executed: 'Auto-executada',
  executed: 'Executada',
};

const SUGGESTED_PROMPTS = [
  '📊 Qual o maior risco financeiro agora?',
  '💰 Quais clientes estão com pagamentos atrasados?',
  '⚡ O que devo priorizar hoje?',
  '📈 Como está a saúde da operação?',
];

const saudeMap = {
  critico: { label: 'Crítica', color: 'text-destructive', dot: 'bg-destructive', ring: 'ring-destructive/30' },
  alerta: { label: 'Alerta', color: 'text-amber-500', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
  ok: { label: 'Saudável', color: 'text-emerald-500', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
} as const;

export default function BrainPage() {
  const { data: pending = [] } = useBrainDecisions('pending');
  const { data: allDecisions = [] } = useBrainDecisions();
  const { data: memories = [] } = useBrainMemories();
  const { data: runs = [] } = useBrainRuns();
  const runBrain = useRunBrain();
  const approve = useApproveDecision();
  const { messages, loading, send, clear } = useBrainChat();

  const [input, setInput] = useState('');
  const [memorySearch, setMemorySearch] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const lastRun = runs[0];
  const veredicto = lastRun?.structured?.veredicto as string | undefined;
  const saude = lastRun?.structured?.saude_geral as keyof typeof saudeMap | undefined;
  const saudeInfo = saude ? saudeMap[saude] : null;
  const autoExec = allDecisions.filter((d) => d.status === 'auto_executed').length;
  const critical = allDecisions.filter((d) => d.impact_level === 'critical' && d.status === 'pending').length;

  const filteredMemories = useMemo(() => {
    if (!memorySearch.trim()) return memories;
    const q = memorySearch.toLowerCase();
    return memories.filter((m) => {
      const v = typeof m.value === 'string' ? m.value : JSON.stringify(m.value);
      return m.key.toLowerCase().includes(q) || v.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    });
  }, [memories, memorySearch]);

  const handleSend = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setInput('');
    send(t);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleScroll = () => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  };

  return (
    <PageContainer>
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30',
              saudeInfo && `ring-2 ${saudeInfo.ring}`,
            )}>
              <Brain className="h-7 w-7 text-primary" />
              {saudeInfo && (
                <span className={cn('absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-background animate-pulse', saudeInfo.dot)} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cérebro Nativo</h1>
                <Badge variant="outline" className="gap-1 text-[10px] uppercase">
                  <Activity className="h-3 w-3" /> v3
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Núcleo de IA do ERP — orquestra módulos, mantém memória de longo prazo e decide com guardrails.
              </p>
              {lastRun?.created_at && (
                <p className="text-xs text-muted-foreground/80">
                  Última análise {formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="gap-2">
              <Link to="/executive/brain/comando"><Sparkles className="h-4 w-4" /> Comando</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/executive/brain/aprendizado"><GraduationCap className="h-4 w-4" /> Aprendizado</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => runBrain.mutate('analyze')} disabled={runBrain.isPending} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', runBrain.isPending && 'animate-spin')} /> Analisar
            </Button>
            <Button size="sm" onClick={() => runBrain.mutate('autopilot')} disabled={runBrain.isPending} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
              <Zap className="h-4 w-4" /> Autopilot
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Saúde geral"
            value={saudeInfo ? saudeInfo.label : '—'}
            sub="último diagnóstico"
            icon={<Brain className="h-4 w-4" />}
            valueClassName={saudeInfo?.color}
          />
          <KpiTile
            label="Decisões pendentes"
            value={pending.length}
            sub={critical > 0 ? `${critical} críticas` : 'sem críticas'}
            icon={<AlertTriangle className="h-4 w-4" />}
            valueClassName={critical > 0 ? 'text-destructive' : undefined}
          />
          <KpiTile
            label="Auto-executadas"
            value={autoExec}
            sub="ações seguras"
            icon={<Zap className="h-4 w-4" />}
            valueClassName="text-emerald-500"
          />
          <KpiTile
            label="Memórias"
            value={memories.length}
            sub="conhecimento ativo"
            icon={<Database className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* VEREDICTO */}
      {veredicto && (
        <Card className="border-l-4 border-l-primary bg-card/60 backdrop-blur">
          <CardContent className="p-4 flex gap-3">
            <div className="shrink-0 h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Veredicto do Cérebro</p>
              <p className="text-sm leading-relaxed">{veredicto}</p>
              {lastRun && (
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(lastRun.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {lastRun.decisions_count} decisões geradas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="chat" className="gap-1.5"><Bot className="h-4 w-4" /> Chat</TabsTrigger>
          <TabsTrigger value="decisions" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Decisões
            {pending.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-1.5"><Database className="h-4 w-4" /> Memória</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-4 w-4" /> Histórico</TabsTrigger>
        </TabsList>

        {/* CHAT */}
        <TabsContent value="chat">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <CardTitle className="text-sm font-medium">Conversa com o cérebro</CardTitle>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs">Limpar</Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <ScrollArea ref={scrollRef} className="h-[500px]" onScrollCapture={handleScroll}>
                  <div className="p-5 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-10 space-y-5">
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                          <Brain className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Comece uma conversa</p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Pergunte sobre KPIs, financeiro, vendas, produção. O cérebro tem acesso a tudo e memória de longo prazo.
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 px-4">
                          {SUGGESTED_PROMPTS.map((p) => (
                            <button
                              key={p}
                              onClick={() => handleSend(p.replace(/^\S+\s/, ''))}
                              className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent hover:border-primary/40 transition-colors"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((m) => (
                      <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                        <div className={cn(
                          'shrink-0 h-8 w-8 rounded-full flex items-center justify-center ring-1',
                          m.role === 'user' ? 'bg-primary/15 ring-primary/30' : 'bg-gradient-to-br from-primary/20 to-orange-500/10 ring-primary/30',
                        )}>
                          {m.role === 'user' ? <User2 className="h-4 w-4 text-primary" /> : <Brain className="h-4 w-4 text-primary" />}
                        </div>
                        <div className={cn('flex flex-col gap-1 max-w-[78%]', m.role === 'user' ? 'items-end' : 'items-start')}>
                          <div className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            m.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm',
                          )}>
                            {m.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:mt-2 prose-headings:mb-1">
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <span className="whitespace-pre-wrap">{m.content}</span>
                            )}
                          </div>
                          {m.actions && m.actions.length > 0 && (
                            <div className="flex flex-col gap-1 w-full">
                              {m.actions.map((a, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    'text-[11px] rounded-lg border px-2.5 py-1.5 flex items-center gap-2',
                                    a.result?.ok && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                                    a.result?.pending_approval && 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                                    !a.result?.ok && !a.result?.pending_approval && 'border-destructive/30 bg-destructive/10 text-destructive',
                                  )}
                                >
                                  <Zap className="h-3 w-3 shrink-0" />
                                  <span className="font-mono font-semibold">{a.tool}</span>
                                  <span className="opacity-80">
                                    {a.result?.ok ? '· executada' : a.result?.pending_approval ? '· aguarda aprovação' : `· ${a.result?.error || 'falhou'}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3 items-center">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/10 ring-1 ring-primary/30 flex items-center justify-center">
                          <Brain className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:120ms]" />
                          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:240ms]" />
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {showScrollBtn && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="absolute bottom-3 right-4 h-8 w-8 rounded-full shadow-lg"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* COMPOSER */}
              <div className="border-t bg-muted/20 p-3">
                <div className="relative flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Pergunte qualquer coisa sobre o seu negócio..."
                    className="resize-none border-0 focus-visible:ring-0 shadow-none min-h-[44px] max-h-32 px-2"
                    rows={1}
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground text-center">
                  Enter para enviar · Shift+Enter para quebrar linha
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DECISIONS */}
        <TabsContent value="decisions" className="space-y-3">
          {allDecisions.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma decisão ainda.</p>
                <Button variant="link" size="sm" onClick={() => runBrain.mutate('analyze')}>
                  Analisar agora
                </Button>
              </CardContent>
            </Card>
          )}
          {allDecisions.map((d) => (
            <Card key={d.id} className={cn('transition-all hover:shadow-md', d.status === 'pending' && 'border-l-4 border-l-primary')}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <Badge variant="outline" className={cn('text-[10px] border', impactColor[d.impact_level])}>
                        {d.impact_level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="uppercase text-[10px]">{d.module}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{statusLabel[d.status] || d.status}</Badge>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {(d.confidence * 100).toFixed(0)}% confiança
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm">{d.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{d.rationale}</p>
                    {d.proposed_action?.tool && (
                      <div className="mt-2 text-xs bg-muted/50 rounded-lg p-2 font-mono text-muted-foreground border border-dashed">
                        <Zap className="h-3 w-3 inline mr-1.5 text-primary" />
                        {d.proposed_action.tool}
                      </div>
                    )}
                  </div>
                  {d.status === 'pending' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button size="sm" onClick={() => approve.mutate({ id: d.id, approve: true })} disabled={approve.isPending} className="gap-1 h-8">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: d.id, approve: false })} disabled={approve.isPending} className="gap-1 h-8">
                        <XCircle className="h-3.5 w-3.5" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* MEMORY */}
        <TabsContent value="memory" className="space-y-3">
          {memories.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={memorySearch}
                onChange={(e) => setMemorySearch(e.target.value)}
                placeholder="Buscar nas memórias..."
                className="pl-9"
              />
            </div>
          )}
          {filteredMemories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {memories.length === 0
                  ? 'Nenhuma memória ainda. O cérebro acumula fatos, padrões e regras a cada análise.'
                  : 'Nenhuma memória corresponde à busca.'}
              </CardContent>
            </Card>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {filteredMemories.map((m) => (
              <Card key={m.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase">{m.category}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{m.scope}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">imp. {m.importance}</span>
                  </div>
                  <p className="text-xs font-mono font-semibold truncate">{m.key}</p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-sans line-clamp-4">
                    {typeof m.value === 'string' ? m.value : JSON.stringify(m.value, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-2">
          {runs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma execução registrada ainda.
              </CardContent>
            </Card>
          )}
          {runs.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  r.status === 'completed' && 'bg-emerald-500',
                  r.status === 'failed' && 'bg-destructive',
                  r.status === 'running' && 'bg-amber-500 animate-pulse',
                )} />
                <Badge variant="outline" className="text-[10px] uppercase shrink-0">{r.mode}</Badge>
                <div className="flex-1 text-sm truncate text-muted-foreground">{r.synthesis || '—'}</div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {r.decisions_count} dec.
                </span>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.created_at ? format(new Date(r.created_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                </span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

interface KpiTileProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

function KpiTile({ label, value, sub, icon, valueClassName }: KpiTileProps) {
  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur p-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>{label}</span>
        <span className="text-primary/70">{icon}</span>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', valueClassName)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
