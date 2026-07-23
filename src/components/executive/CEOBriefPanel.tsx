import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, RefreshCw, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { toast } from 'sonner';
import { useGenerateCEOBrief, useExecuteDecisions, useAutoPilotRun, type CEOBriefResult } from '@/hooks/ai/useCEOBrief';
import { formatDateTime } from '@/lib/formatters';
import { normalizeKPI } from './ceoBrief/helpers';
import { StructuredBlock } from './ceoBrief/StructuredBlock';
import { ForecastKPIs } from './ceoBrief/ForecastKPIs';
import { RisksList, PlanList, DecisionsList } from './ceoBrief/RisksPlanDecisions';

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
          const forecast = data.forecast ?? { trend: 'neutral', previsao_proximo_mes: 0, ultimo_mes: 0, media_movel_6m: 0 } as any;
          const kpis = (data.kpis ?? []).map(normalizeKPI);
          const risks = data.risks ?? [];
          const plan = data.plan ?? [];
          const decisions = data.decisions ?? [];
          const structured = data.ceo_structured ?? null;

          return (
            <>
              {structured && <StructuredBlock structured={structured} dataStatus={data.data_status} />}
              <ForecastKPIs forecast={forecast} kpis={kpis} />
              <RisksList risks={risks} />
              <PlanList plan={plan} />
              <DecisionsList decisions={decisions} onApprove={handleApproveDecisions} isPending={executeDecisions.isPending} />

              {data.ceo_analysis && (
                <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
                  <ReactMarkdown>{data.ceo_analysis}</ReactMarkdown>
                </div>
              )}

              <div className="text-[10px] text-muted-foreground text-right">
                Gerado em {data.generated_at ? formatDateTime(data.generated_at) : '—'}
              </div>
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
