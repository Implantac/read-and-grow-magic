import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Lightbulb, CheckCircle2, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useGenerateCEOBrief, useExecuteDecisions, useAutoPilotRun, type CEOBriefResult } from '@/hooks/useCEOBrief';

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const impactColor = (impacto: string) => {
  if (impacto === 'alto') return 'destructive';
  if (impacto === 'medio') return 'secondary';
  return 'outline';
};

const trendIcon = (t?: string | null) => {
  const v = t ?? 'neutral';
  if (v === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
  if (v === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

// Normaliza um KPI vindo do backend, tolerante a campos ausentes
function normalizeKPI(k: any) {
  return {
    kpi_name: k?.kpi_name ?? k?.name ?? 'kpi',
    category: k?.category ?? 'general',
    current_value: Number(k?.current_value ?? k?.value ?? 0),
    target_value: Number(k?.target_value ?? 0),
    status: k?.status ?? 'ok',
    trend: k?.trend ?? 'neutral',
    explanation: k?.explanation ?? '',
    snapshot_date: k?.snapshot_date ?? '',
  };
}

export function CEOBriefPanel() {
  const [data, setData] = useState<CEOBriefResult | null>(null);
  const { mutate, isPending } = useGenerateCEOBrief();
  const executeDecisions = useExecuteDecisions();
  const autoPilot = useAutoPilotRun();

  const handleGenerate = () => {
    mutate(undefined, {
      onSuccess: (res) => {
        setData(res);
        toast.success('Análise da IA CEO gerada');
      },
      onError: (e: any) => {
        const msg = e?.message?.includes('429')
          ? 'Limite de requisições. Aguarde alguns minutos.'
          : e?.message?.includes('402')
          ? 'Créditos insuficientes. Adicione créditos em Configurações > Workspace.'
          : 'Erro ao gerar análise CEO.';
        toast.error(msg);
      },
    });
  };

  const handleApproveDecisions = () => {
    if (!data?.decisions?.length) return;
    executeDecisions.mutate(
      { decisions: data.decisions, auto_execute: false },
      {
        onSuccess: (res) => toast.success(`${res.executed} decisão(ões) registradas para execução`),
        onError: () => toast.error('Falha ao registrar decisões'),
      },
    );
  };

  const handleAutoPilot = () => {
    autoPilot.mutate(undefined, {
      onSuccess: (res: any) => toast.success(res?.summary || 'AutoPilot executado'),
      onError: () => toast.error('Falha ao rodar AutoPilot'),
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>IA CEO — Análise Estratégica</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Diagnóstico, riscos, forecast e decisões com base em dados reais
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAutoPilot} disabled={autoPilot.isPending} size="sm" variant="outline">
            {autoPilot.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
            AutoPilot
          </Button>
          <Button onClick={handleGenerate} disabled={isPending} size="sm">
            {isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            {data ? 'Atualizar análise' : 'Gerar análise CEO'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isPending && !data && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!data && !isPending && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Clique em <strong>Gerar análise CEO</strong> para receber um diagnóstico estratégico completo da sua empresa.</p>
          </div>
        )}

        {data && (() => {
          // Hardening: normaliza e protege contra dados ausentes vindos do backend
          const forecast = data.forecast ?? { trend: 'neutral', previsao_proximo_mes: 0, ultimo_mes: 0, media_movel_6m: 0 } as any;
          const kpis = (data.kpis ?? []).map(normalizeKPI);
          const risks = data.risks ?? [];
          const plan = data.plan ?? [];
          const decisions = data.decisions ?? [];

          return (
          <>
            {/* Forecast + KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Previsão próx. mês {trendIcon(forecast?.trend)}
                </div>
                <div className="text-xl font-bold mt-1">{fmtBRL(forecast?.previsao_proximo_mes ?? 0)}</div>
                <div className="text-[10px] text-muted-foreground">
                  Último: {fmtBRL(forecast?.ultimo_mes ?? 0)}
                </div>
              </div>
              {kpis.slice(0, 3).map((k) => (
                <div key={k.kpi_name} className="p-3 rounded-lg border bg-card">
                  <div className="text-xs text-muted-foreground capitalize">{k.kpi_name.replace(/_/g, ' ')}</div>
                  <div className="text-xl font-bold mt-1">
                    {k.kpi_name.includes('margem') || k.kpi_name.includes('inadim')
                      ? `${Number(k.current_value).toFixed(1)}%`
                      : k.category === 'inventory'
                      ? Number(k.current_value).toFixed(0)
                      : fmtBRL(Number(k.current_value))}
                  </div>
                  <Badge variant={k.status === 'ok' ? 'outline' : k.status === 'alerta' ? 'secondary' : 'destructive'} className="mt-1 text-[10px]">
                    {k.status}
                  </Badge>
                </div>
              ))}
              {kpis.length === 0 && (
                <div className="col-span-3 p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground text-center">
                  Nenhum KPI disponível ainda — gere a análise novamente em alguns minutos.
                </div>
              )}
            </div>

            {/* Riscos */}
            {risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Riscos detectados ({risks.length})
                </h4>
                <div className="space-y-2">
                  {risks.map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 p-2 rounded border bg-muted/30">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{r?.titulo ?? 'Risco'}</div>
                        <div className="text-xs text-muted-foreground">{r?.detalhe ?? ''}</div>
                      </div>
                      <Badge variant={impactColor(r?.impacto ?? 'baixo') as any}>{r?.impacto ?? 'baixo'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plano */}
            {plan.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Plano de crescimento
                </h4>
                <ul className="space-y-1.5">
                  {plan.map((p, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <Badge variant="outline" className="text-[10px] h-5">{p?.tipo ?? 'acao'}</Badge>
                      <div>
                        <span className="font-medium">{p?.titulo ?? ''}</span>
                        <span className="text-muted-foreground"> — {p?.detalhe ?? ''}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decisões sugeridas */}
            {decisions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-warning" /> Decisões sugeridas (requerem aprovação)
                  </h4>
                  <Button onClick={handleApproveDecisions} disabled={executeDecisions.isPending} size="sm" variant="outline" className="h-7">
                    {executeDecisions.isPending ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    Aprovar e registrar
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {decisions.map((d, i) => (
                    <div key={i} className="text-sm p-2 rounded border bg-muted/30 flex items-center justify-between gap-2">
                      <span>{d?.action ?? d?.type ?? 'Decisão'}</span>
                      <Badge variant={d?.priority === 'alta' ? 'destructive' : 'secondary'}>{d?.priority ?? 'media'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Análise narrativa CEO */}
            {data.ceo_analysis && (
              <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
                <ReactMarkdown>{data.ceo_analysis}</ReactMarkdown>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground text-right">
              Gerado em {data.generated_at ? new Date(data.generated_at).toLocaleString('pt-BR') : '—'}
            </div>
          </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
