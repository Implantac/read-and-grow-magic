import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  survey: any;
  hasComment: boolean;
  token: string;
  projectUrl: string;
  anon: string;
}

export function DoneView({ survey, hasComment, token, projectUrl, anon }: Props) {
  const primary = survey?.campaign?.primary_color ?? '#10b981';
  const [phase, setPhase] = useState<'analyzing' | 'complete' | 'skipped'>(hasComment ? 'analyzing' : 'skipped');
  const [progress, setProgress] = useState(hasComment ? 8 : 100);
  const [result, setResult] = useState<{ sentiment?: string; summary?: string; categories?: string[]; keywords?: string[] } | null>(null);

  useEffect(() => {
    if (!hasComment) return;
    let cancelled = false;
    const started = Date.now();
    const maxDuration = 60000;
    let attempt = 0;

    const tick = async () => {
      if (cancelled) return;
      attempt++;
      const elapsed = Date.now() - started;
      setProgress(Math.min(90, 8 + Math.round((elapsed / 15000) * 82)));
      try {
        const resp = await fetch(
          `${projectUrl}/functions/v1/nps-public-status?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
        );
        const j = await resp.json();
        if (cancelled) return;
        if (j.status === 'complete') {
          setResult({ sentiment: j.sentiment, summary: j.summary, categories: j.categories, keywords: j.keywords });
          setProgress(100);
          setPhase('complete');
          return;
        }
        if (j.status === 'skipped') {
          setProgress(100);
          setPhase('skipped');
          return;
        }
      } catch {
        /* mantém polling */
      }
      if (Date.now() - started >= maxDuration) {
        setProgress(100);
        setPhase('complete');
        return;
      }
      const delay = Math.min(4000, 1000 + attempt * 500);
      window.setTimeout(tick, delay);
    };

    tick();
    return () => { cancelled = true; };
  }, [hasComment, token, projectUrl, anon]);

  return (
    <div className="min-h-screen grid place-items-center p-4" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardContent className="pt-8 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 mx-auto" style={{ color: primary }} />
          <h1 className="text-2xl font-bold">{survey?.campaign?.thanks_title ?? 'Obrigado!'}</h1>
          <p className="text-slate-300">{survey?.campaign?.thanks_message ?? 'Sua opinião é muito importante.'}</p>

          {hasComment && phase !== 'skipped' && (
            <div
              className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-left space-y-2 transition-all"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-sm">
                {phase === 'analyzing' ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" style={{ color: primary }} />
                    <span className="font-medium">Analisando seu feedback com IA…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" style={{ color: primary }} />
                    <span className="font-medium">Análise concluída</span>
                  </>
                )}
              </div>
              <Progress value={progress} className="h-1 bg-slate-800" />
              {phase === 'analyzing' && (
                <p className="text-xs text-slate-400">
                  Estamos identificando sentimento e temas do seu comentário. Você já pode fechar esta página.
                </p>
              )}
              {phase === 'complete' && result?.summary && (
                <p className="text-xs text-slate-300">{result.summary}</p>
              )}
              {phase === 'complete' && result?.categories && result.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {result.categories.map((c) => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-300">{c}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Respostas confidenciais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
