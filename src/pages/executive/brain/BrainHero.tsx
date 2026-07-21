import { Link } from 'react-router-dom';
import { Brain, Zap, RefreshCw, Sparkles, AlertTriangle, Database, GraduationCap, Activity } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saudeMap, type SaudeKey } from './constants';
import { KpiTile } from './KpiTile';

interface BrainHeroProps {
  lastRun: any;
  pendingCount: number;
  criticalCount: number;
  autoExec: number;
  memoriesCount: number;
  onAnalyze: () => void;
  onAutopilot: () => void;
  runPending: boolean;
}

export function BrainHero({
  lastRun, pendingCount, criticalCount, autoExec, memoriesCount, onAnalyze, onAutopilot, runPending,
}: BrainHeroProps) {
  const saude = lastRun?.structured?.saude_geral as SaudeKey | undefined;
  const saudeInfo = saude ? saudeMap[saude] : null;

  return (
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
          <Button variant="outline" size="sm" onClick={onAnalyze} disabled={runPending} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', runPending && 'animate-spin')} /> Analisar
          </Button>
          <Button size="sm" onClick={onAutopilot} disabled={runPending} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            <Zap className="h-4 w-4" /> Autopilot
          </Button>
        </div>
      </div>

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
          value={pendingCount}
          sub={criticalCount > 0 ? `${criticalCount} críticas` : 'sem críticas'}
          icon={<AlertTriangle className="h-4 w-4" />}
          valueClassName={criticalCount > 0 ? 'text-destructive' : undefined}
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
          value={memoriesCount}
          sub="conhecimento ativo"
          icon={<Database className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
