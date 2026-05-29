import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Zap, CheckCircle2, XCircle, Send, RefreshCw, Sparkles, AlertTriangle, GraduationCap, Bot } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useBrainDecisions, useApproveDecision, useBrainRuns, useRunBrain, useBrainChat, useBrainLearning } from '@/hooks/useAIBrain';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const impactColor: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

export default function BrainCommandCenter() {
  const { data: pending = [] } = useBrainDecisions('pending');
  const { data: runs = [] } = useBrainRuns();
  const { data: learning } = useBrainLearning();
  const runBrain = useRunBrain();
  const approve = useApproveDecision();
  const { messages, loading, send, clear } = useBrainChat();
  const [input, setInput] = useState('');

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
    send(t);
  };

  return (
    <PageContainer>
      <PageHeader
        title="🎯 Comando do Cérebro"
        description="Visão única — veredicto, decisões, chat e aprendizado em uma tela"
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/diretoria/brain/aprendizado"><GraduationCap className="h-4 w-4" /> Aprendizado</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/diretoria/brain"><Brain className="h-4 w-4" /> Visão clássica</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => runBrain.mutate('analyze')} disabled={runBrain.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${runBrain.isPending ? 'animate-spin' : ''}`} /> Analisar
        </Button>
        <Button size="sm" onClick={() => runBrain.mutate('autopilot')} disabled={runBrain.isPending} className="gap-2">
          <Zap className="h-4 w-4" /> Autopilot
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Saúde geral" value={saude === 'critico' ? '🔴 Crítica' : saude === 'alerta' ? '⚠️ Alerta' : saude === 'ok' ? '✅ OK' : '—'} subtitle="último diagnóstico" icon={<Brain className="h-5 w-5" />} accentColor={saude === 'critico' ? 'danger' : saude === 'alerta' ? 'warning' : 'success'} index={0} />
        <KPICard title="Pendentes" value={pending.length} subtitle={critical > 0 ? `${critical} críticas` : 'aguardando'} icon={<AlertTriangle className="h-5 w-5" />} accentColor={critical > 0 ? 'danger' : 'default'} index={1} />
        <KPICard title="Aprovação IA" value={learning ? `${(learning.approvalRate * 100).toFixed(0)}%` : '—'} subtitle="taxa histórica" icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Auto-exec" value={learning?.autoExecuted ?? 0} subtitle="ações seguras" icon={<Zap className="h-5 w-5" />} index={3} />
      </div>

      {/* Veredicto + risks/opps */}
      {veredicto && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Veredicto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{veredicto}</p>
            {lastRun && <p className="text-xs text-muted-foreground">Atualizado {format(new Date(lastRun.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {lastRun.decisions_count} decisões</p>}
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

      {/* Grid principal: pending + chat */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Decisões pendentes */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" /> Decisões aguardando você ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[480px] pr-3">
              {pending.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  ✨ Tudo em ordem. Cérebro não tem nada pendente.
                </div>
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
                    {d.proposed_action?.tool && (
                      <div className="text-[10px] font-mono bg-muted/50 rounded px-2 py-1 inline-block">→ {d.proposed_action.tool}</div>
                    )}
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

        {/* Chat */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Pergunte ao Cérebro</CardTitle>
            {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs">Limpar</Button>}
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col">
            <ScrollArea className="h-[420px] border rounded-lg p-3 flex-1">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  💬 "Quem deve ser cobrado hoje?", "Cria follow-up pro cliente X", "Bloqueia o cliente Y por inadimplência"
                </p>
              )}
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {m.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                      ) : m.content}
                    </div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-1 flex flex-col gap-1 max-w-[90%]">
                        {m.actions.map((a, i) => (
                          <div key={i} className={`text-[11px] rounded border px-2 py-1 ${a.result?.ok ? 'border-green-500/40 bg-green-500/10' : a.result?.pending_approval ? 'border-amber-500/40 bg-amber-500/10' : 'border-destructive/40 bg-destructive/10'}`}>
                            <span className="font-mono font-semibold">⚙ {a.tool}</span>{' '}
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
                placeholder="Pergunte ou peça uma ação..."
                className="resize-none"
                rows={2}
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
