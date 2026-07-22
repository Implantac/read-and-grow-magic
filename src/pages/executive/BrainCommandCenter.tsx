import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Brain, Zap, CheckCircle2, RefreshCw, Sparkles, AlertTriangle, GraduationCap, Bell } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useBrainDecisions, useApproveDecision, useBrainRuns, useRunBrain, useBrainChat, useBrainLearning, useNotifyCritical } from '@/hooks/ai/useAIBrain';
import { AIConsensusPanel } from '@/components/executive/AIConsensusPanel';
import { ExecutiveConsensus } from '@/components/executive/ExecutiveConsensus';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PendingDecisionsCard } from './brainCommand/PendingDecisionsCard';
import { AgentChatCard } from './brainCommand/AgentChatCard';
import { LearningCards, RisksOpportunitiesCards } from './brainCommand/LearningCards';
import { useBrainShortcuts } from './brainCommand/useBrainShortcuts';

export default function BrainCommandCenter() {
  const { data: pending = [] } = useBrainDecisions('pending');
  const { data: runs = [] } = useBrainRuns();
  const { data: learning } = useBrainLearning();
  const runBrain = useRunBrain();
  const approve = useApproveDecision();
  const notify = useNotifyCritical();
  const { messages, loading, send, clear } = useBrainChat();
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState<string>(() => localStorage.getItem('brain.agent') || 'general');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { localStorage.setItem('brain.agent', agent); }, [agent]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useBrainShortcuts(textareaRef, clear, setInput);

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

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Saúde geral" value={saude === 'critico' ? '🔴 Crítica' : saude === 'alerta' ? '⚠️ Alerta' : saude === 'ok' ? '✅ OK' : '—'} subtitle="último diagnóstico" icon={<Brain className="h-5 w-5" />} accentColor={saude === 'critico' ? 'danger' : saude === 'alerta' ? 'warning' : 'success'} index={0} />
        <KPICard title="Pendentes" value={pending.length} subtitle={critical > 0 ? `${critical} críticas` : 'aguardando'} icon={<AlertTriangle className="h-5 w-5" />} accentColor={critical > 0 ? 'danger' : 'default'} index={1} />
        <KPICard title="Aprovação IA" value={learning ? `${(learning.approvalRate * 100).toFixed(0)}%` : '—'} subtitle="taxa histórica" icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Auto-exec" value={learning?.autoExecuted ?? 0} subtitle="ações seguras" icon={<Zap className="h-5 w-5" />} index={3} />
      </div>

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

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1"><AIConsensusPanel /></div>
        <div className="xl:col-span-1"><ExecutiveConsensus /></div>
        <PendingDecisionsCard
          pending={pending}
          onApprove={(id, appr) => approve.mutate({ id, approve: appr })}
          approvePending={approve.isPending}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-1 mt-4">
        <AgentChatCard
          messages={messages}
          loading={loading}
          input={input}
          setInput={setInput}
          agent={agent}
          setAgent={setAgent}
          onSend={handleSend}
          onClear={clear}
          textareaRef={textareaRef}
          chatEndRef={chatEndRef}
        />
      </div>

      <LearningCards learning={learning} />
      <RisksOpportunitiesCards riscos={riscos} oportunidades={oportunidades} />
    </PageContainer>
  );
}
