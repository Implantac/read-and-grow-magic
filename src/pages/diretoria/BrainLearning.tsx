import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, XCircle, CheckCircle2, Zap, Target, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useBrainLearning } from '@/hooks/ai/useAIBrain';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BrainLearningPage() {
  const { data, isLoading } = useBrainLearning();

  if (isLoading || !data) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-muted-foreground">Carregando aprendizado...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="🎓 Aprendizado do Cérebro"
        description="Calibração de confiança, taxa de aprovação e onde a IA está acertando ou errando"
      >
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/diretoria/brain"><ArrowLeft className="h-4 w-4" /> Voltar ao Cérebro</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Taxa de aprovação" value={`${(data.approvalRate * 100).toFixed(0)}%`} subtitle={`${data.approved + data.autoExecuted + data.executed} de ${data.approved + data.rejected + data.autoExecuted + data.executed}`} icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={0} />
        <KPICard title="Taxa de rejeição" value={`${(data.rejectionRate * 100).toFixed(0)}%`} subtitle={`${data.rejected} rejeitadas`} icon={<XCircle className="h-5 w-5" />} accentColor={data.rejectionRate > 0.3 ? 'danger' : 'default'} index={1} />
        <KPICard title="Auto-executadas" value={data.autoExecuted} subtitle="ações seguras sem humano" icon={<Zap className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Confiança média" value={`${(data.avgConfidence * 100).toFixed(0)}%`} subtitle="declarada pela IA" icon={<Target className="h-5 w-5" />} index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Calibração de confiança</CardTitle>
            <p className="text-xs text-muted-foreground">Confiança declarada × taxa real de aprovação. Linhas próximas = IA bem calibrada.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.calibration}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="declared" stroke="hsl(var(--primary))" name="Declarada" strokeWidth={2} />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--accent))" name="Real" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Aprovação por módulo</CardTitle>
            <p className="text-xs text-muted-foreground">Onde o Cérebro entrega mais valor</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byModule}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="hsl(142 70% 45%)" name="Aprovadas" stackId="a" />
                <Bar dataKey="auto" fill="hsl(var(--primary))" name="Auto-exec" stackId="a" />
                <Bar dataKey="rejected" fill="hsl(var(--destructive))" name="Rejeitadas" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">❌ Decisões rejeitadas recentes</CardTitle>
            <p className="text-xs text-muted-foreground">Padrões aqui = ajustar prompt ou guardrails</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentRejected.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma rejeição — Cérebro está afinado ✨</p>}
            {data.recentRejected.map((d) => (
              <div key={d.id} className="border-l-2 border-destructive/60 pl-3 py-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] uppercase">{d.module}</Badge>
                  <span className="text-[10px] text-muted-foreground">conf. {(d.confidence * 100).toFixed(0)}%</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                </div>
                <div className="text-sm font-medium mt-1">{d.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{d.rationale}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🧠 Memórias mais importantes</CardTitle>
            <p className="text-xs text-muted-foreground">Conhecimento que mais influencia decisões</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topMemories.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma memória ainda</p>}
            {data.topMemories.map((m) => (
              <div key={m.id} className="flex items-start gap-2 border-b border-border/40 pb-2 last:border-0">
                <Badge variant="outline" className="text-[10px] uppercase shrink-0">{m.category}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-semibold">{m.key} <span className="text-muted-foreground font-normal">· imp {m.importance}</span></div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
