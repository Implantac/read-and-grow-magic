import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Textarea } from '@/ui/base/textarea';
import { Input } from '@/ui/base/input';
import { Progress } from '@/ui/base/progress';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Rota pública /nps/:token — sem autenticação.
 * Envia respostas via edge function nps-public-submit.
 */

type QType = 'text' | 'number' | 'stars' | 'radio' | 'checkbox' | 'dropdown' | 'likert' | 'emoji' | 'multi_choice' | 'date' | 'file';

interface Question {
  id: string;
  order_index: number;
  question_text: string;
  question_type: QType;
  required: boolean;
  options: any;
}

const EMOJIS = ['😡', '😞', '😐', '🙂', '😍'];

export default function PublicNPS() {
  const { token = '' } = useParams();
  const [state, setState] = useState<'loading' | 'ready' | 'submitting' | 'done' | 'error'>('loading');
  const [survey, setSurvey] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [touched, setTouched] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const projectUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const anon = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${projectUrl}/functions/v1/nps-public-get?token=${encodeURIComponent(token)}`, {
          headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error ?? 'Pesquisa indisponível');
        setSurvey(json);
        setState('ready');
      } catch (e: any) {
        setError(e.message ?? 'Erro');
        setState('error');
      }
    })();
  }, [token, projectUrl, anon]);

  const questions: Question[] = useMemo(() => (survey?.questions ?? []) as Question[], [survey]);
  const requiredMissing = useMemo(() => {
    if (score === null) return true;
    return questions.some((q) => {
      if (!q.required) return false;
      const v = answers[q.id];
      if (Array.isArray(v)) return v.length === 0;
      return v === undefined || v === null || v === '';
    });
  }, [questions, answers, score]);

  const totalSteps = 1 + questions.length; // nota + perguntas
  const doneSteps = (score !== null ? 1 : 0) + questions.filter((q) => {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== null;
  }).length;
  const progress = Math.round((doneSteps / totalSteps) * 100);

  const submit = async () => {
    setTouched(true);
    if (score === null || requiredMissing) return;
    setState('submitting');
    try {
      const payloadAnswers: Array<{ question_id: string; value_text?: string; value_number?: number; value_json?: unknown }> = [];
      Object.entries(answers).forEach(([question_id, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (typeof value === 'number') payloadAnswers.push({ question_id, value_number: value });
        else if (Array.isArray(value) || typeof value === 'object') payloadAnswers.push({ question_id, value_json: value });
        else payloadAnswers.push({ question_id, value_text: String(value) });
      });
      const resp = await fetch(`${projectUrl}/functions/v1/nps-public-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({
          token,
          score,
          comment,
          answers: payloadAnswers,
          response_time_seconds: Math.round((Date.now() - startedAt) / 1000),
          ua: navigator.userAgent,
        }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error ?? 'Erro ao enviar');
      setState('done');
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  };

  if (state === 'loading')
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (state === 'error')
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 p-4">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800">
          <CardContent className="pt-6 text-center space-y-3">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-lg">{error}</p>
            <p className="text-xs text-slate-400">Se você acredita que é um engano, entre em contato com o remetente.</p>
          </CardContent>
        </Card>
      </div>
    );

  if (state === 'done')
    return <DoneView survey={survey} hasComment={comment.trim().length > 5} token={token} projectUrl={projectUrl} anon={anon} />;


  const c = survey.campaign;
  const primary = c.primary_color ?? '#FF9800';
  const followUp =
    score !== null && score >= 9
      ? 'O que você mais gostou? (opcional)'
      : score !== null && score <= 6
      ? 'O que podemos melhorar? (opcional)'
      : 'Deixe um comentário (opcional)';

  const renderQuestion = (q: Question) => {
    const val = answers[q.id];
    const set = (v: any) => setAnswers((prev) => ({ ...prev, [q.id]: v }));
    // Normaliza opções: aceita { choices: string[] }, array de strings, ou array de { label, value }
    const rawOpts: any = q.options;
    const optsArr: any[] = Array.isArray(rawOpts)
      ? rawOpts
      : Array.isArray(rawOpts?.choices)
      ? rawOpts.choices
      : Array.isArray(rawOpts?.labels)
      ? rawOpts.labels
      : [];
    const choices: Array<{ label: string; value: string }> = optsArr.map((o: any) =>
      typeof o === 'string' || typeof o === 'number'
        ? { label: String(o), value: String(o) }
        : { label: String(o?.label ?? o?.value ?? ''), value: String(o?.value ?? o?.label ?? '') },
    );
    const missing = touched && q.required && (val === undefined || val === '' || (Array.isArray(val) && val.length === 0));


    switch (q.question_type) {
      case 'text':
        return (
          <Textarea
            value={val ?? ''}
            onChange={(e) => set(e.target.value)}
            rows={3}
            className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
            aria-invalid={missing}
          />
        );
      case 'number':
        return <Input type="number" value={val ?? ''} onChange={(e) => set(Number(e.target.value))} className="bg-slate-950 border-slate-700 text-slate-100" aria-invalid={missing} />;
      case 'date':
        return <Input type="date" value={val ?? ''} onChange={(e) => set(e.target.value)} className="bg-slate-950 border-slate-700 text-slate-100" aria-invalid={missing} />;
      case 'stars':
        return (
          <div className="flex gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                onClick={() => set(n)}
                className="text-3xl leading-none transition-transform hover:scale-110"
                style={{ color: (val ?? 0) >= n ? primary : '#334155' }}
              >
                ★
              </button>
            ))}
          </div>
        );
      case 'emoji':
        return (
          <div className="flex gap-2">
            {EMOJIS.map((emo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set(i + 1)}
                className="text-3xl transition-transform hover:scale-110 rounded-md px-2 py-1"
                style={{ background: val === i + 1 ? 'rgba(255,152,0,0.15)' : 'transparent', border: `1px solid ${val === i + 1 ? primary : 'rgba(255,255,255,0.1)'}` }}
              >
                {emo}
              </button>
            ))}
          </div>
        );
      case 'likert': {
        const labels: string[] = choices.length > 0
          ? choices.map((c) => c.label)
          : ['1', '2', '3', '4', '5'];
        return (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${labels.length > 5 ? Math.ceil(labels.length / 2) : labels.length}, minmax(0, 1fr))` }}>
            {labels.map((lbl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set(i + 1)}
                className="rounded-md py-2.5 px-2 text-xs font-medium transition-all min-h-[44px]"
                style={{
                  background: val === i + 1 ? primary : 'rgba(255,255,255,0.05)',
                  color: val === i + 1 ? '#0f172a' : '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        );
      }
      case 'radio':
      case 'multi_choice':
        return (
          <div className="space-y-2" role="radiogroup">
            {choices.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-slate-800/60 border text-slate-100" style={{ borderColor: val === opt.value ? primary : 'rgba(255,255,255,0.12)' }}>
                <input type="radio" name={q.id} checked={val === opt.value} onChange={() => set(opt.value)} className="accent-current" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox': {
        const arr: string[] = Array.isArray(val) ? val : [];
        return (
          <div className="space-y-2">
            {choices.map((opt) => {
              const checked = arr.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-slate-800/60 border text-slate-100" style={{ borderColor: checked ? primary : 'rgba(255,255,255,0.12)' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => set(e.target.checked ? [...arr, opt.value] : arr.filter((x) => x !== opt.value))}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      }
      case 'dropdown':
        return (
          <select
            value={val ?? ''}
            onChange={(e) => set(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-md h-11 px-3 text-sm text-slate-100"
            aria-invalid={missing}
          >
            <option value="">Selecione…</option>
            {choices.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      default:
        return <Input value={val ?? ''} onChange={(e) => set(e.target.value)} className="bg-slate-950 border-slate-700 text-slate-100" />;
    }
  };

  return (
    <div className="min-h-screen px-3 py-5 sm:p-6 md:p-8" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      <div className="w-full max-w-[640px] mx-auto space-y-4 sm:space-y-5">
        <div className="text-center space-y-2 sm:space-y-3 px-1">
          {(c.logo_url ?? survey.company?.logo_url) && (
            <img src={c.logo_url ?? survey.company.logo_url} alt={survey.company?.name ?? 'Logo'} className="h-10 sm:h-12 mx-auto" />
          )}
          <h1 className="text-xl sm:text-2xl font-bold leading-snug text-white">{c.title ?? 'Como avalia sua experiência?'}</h1>
          {c.subtitle && <p className="text-sm sm:text-base text-slate-200 leading-relaxed">{c.subtitle}</p>}
          {c.message && <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{c.message}</p>}
        </div>

        <Progress value={progress} className="h-1 bg-slate-800" />

        <Card className="bg-slate-900 border-slate-800 rounded-xl">
          <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="space-y-3">
              <label className="block text-[15px] sm:text-base font-semibold text-white leading-snug">
                De 0 a 10, qual a probabilidade de recomendar {survey.company?.name ?? 'nossa empresa'} a um amigo ou colega? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-1.5">
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className="rounded-lg h-11 sm:h-10 text-[15px] sm:text-sm font-semibold transition-all active:scale-95 hover:scale-105 min-w-0 flex items-center justify-center"
                    aria-pressed={score === n}
                    style={{
                      background:
                        score === n
                          ? primary
                          : n <= 6
                          ? 'rgba(239,68,68,0.08)'
                          : n <= 8
                          ? 'rgba(245,158,11,0.08)'
                          : 'rgba(16,185,129,0.08)',
                      color: score === n ? '#0f172a' : '#f1f5f9',
                      border: `1px solid ${score === n ? primary : 'rgba(255,255,255,0.12)'}`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[11px] sm:text-xs text-slate-300 px-1">
                <span>Nada provável</span>
                <span>Muito provável</span>
              </div>
              {touched && score === null && <p className="text-xs text-red-400">Por favor, escolha uma nota.</p>}
            </div>

            {score !== null && (
              <div className="space-y-2 pt-3 sm:pt-2 border-t border-slate-800">
                <label className="block text-[15px] sm:text-base font-semibold text-white leading-snug">{followUp}</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm" maxLength={2000} />
                <p className="text-xs text-slate-400 text-right">{comment.length}/2000</p>
              </div>
            )}

            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2.5 pt-3 sm:pt-2 border-t border-slate-800">
                <label className="block text-[15px] sm:text-base font-semibold text-white leading-snug">
                  {i + 1}. {q.question_text}
                  {q.required && <span className="text-red-400"> *</span>}
                </label>
                {renderQuestion(q)}
              </div>
            ))}

            <Button
              onClick={submit}
              disabled={state === 'submitting'}
              className="w-full h-12 text-base font-semibold"
              style={{ background: primary, color: '#0f172a' }}
            >
              {state === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar avaliação'}
            </Button>
            {touched && requiredMissing && score !== null && (
              <p className="text-xs text-red-400 text-center">Responda as perguntas obrigatórias antes de enviar.</p>
            )}
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Suas respostas são confidenciais e utilizadas somente para melhorar sua experiência.
        </p>
      </div>
    </div>
  );
}

function DoneView({ survey, hasComment, token, projectUrl, anon }: { survey: any; hasComment: boolean; token: string; projectUrl: string; anon: string }) {
  const primary = survey?.campaign?.primary_color ?? '#10b981';
  const [phase, setPhase] = useState<'analyzing' | 'complete' | 'skipped'>(hasComment ? 'analyzing' : 'skipped');
  const [progress, setProgress] = useState(hasComment ? 8 : 100);
  const [result, setResult] = useState<{ sentiment?: string; summary?: string; categories?: string[]; keywords?: string[] } | null>(null);

  useEffect(() => {
    if (!hasComment) return;
    let cancelled = false;
    const started = Date.now();
    const maxDuration = 60000; // desiste após 60s (mantém "concluído" visualmente)
    let attempt = 0;

    const tick = async () => {
      if (cancelled) return;
      attempt++;
      // progress heurístico enquanto aguarda: cresce até 90% em ~15s
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
        setPhase('complete'); // encerra silenciosamente
        return;
      }
      // backoff: 1s, 1.5s, 2s, 2.5s… máx 4s
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
