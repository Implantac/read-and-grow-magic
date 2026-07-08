import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Textarea } from '@/ui/base/textarea';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/ui/base/input';

/**
 * Rota pública /nps/:token — sem autenticação.
 * Renderiza a pesquisa e envia a resposta via edge function.
 */
export default function PublicNPS() {
  const { token = '' } = useParams();
  const [state, setState] = useState<'loading' | 'ready' | 'submitting' | 'done' | 'error'>('loading');
  const [survey, setSurvey] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const startedAt = Date.now();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('nps-public-get', { body: {}, method: 'GET' } as any);
        // Prefer manual fetch to allow query param
        const projectUrl = (import.meta as any).env.VITE_SUPABASE_URL;
        const anon = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resp = await fetch(`${projectUrl}/functions/v1/nps-public-get?token=${encodeURIComponent(token)}`, {
          headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error ?? 'Erro');
        setSurvey(json);
        setState('ready');
      } catch (e: any) {
        setError(e.message ?? 'Erro');
        setState('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async () => {
    if (score === null) return;
    setState('submitting');
    try {
      const projectUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const anon = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${projectUrl}/functions/v1/nps-public-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({
          token,
          score,
          comment,
          answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value_text: String(value) })),
          response_time_seconds: Math.round((Date.now() - startedAt) / 1000),
          ua: navigator.userAgent,
        }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error ?? 'Erro');
      setState('done');
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  };

  if (state === 'loading') return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (state === 'error') return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 p-4">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardContent className="pt-6 text-center space-y-3">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-lg">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (state === 'done') return (
    <div className="min-h-screen grid place-items-center p-4" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardContent className="pt-8 text-center space-y-3">
          <CheckCircle2 className="h-14 w-14 mx-auto" style={{ color: survey?.campaign?.primary_color ?? '#10b981' }} />
          <h1 className="text-2xl font-bold">{survey?.campaign?.thanks_title ?? 'Obrigado!'}</h1>
          <p className="text-slate-300">{survey?.campaign?.thanks_message ?? 'Sua opinião é muito importante.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const c = survey.campaign;
  const primary = c.primary_color ?? '#FF9800';
  const followUp = score !== null && score >= 9 ? 'O que você mais gostou?' : score !== null && score <= 6 ? 'O que podemos melhorar?' : 'Deixe seu comentário (opcional)';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          {(c.logo_url ?? survey.company?.logo_url) && <img src={c.logo_url ?? survey.company.logo_url} alt="" className="h-12 mx-auto" />}
          <h1 className="text-2xl font-bold">{c.title ?? 'Como avalia sua experiência?'}</h1>
          {c.subtitle && <p className="text-slate-300">{c.subtitle}</p>}
          {c.message && <p className="text-slate-400 text-sm">{c.message}</p>}
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 space-y-4">
            <label className="block text-sm">De 0 a 10, qual a probabilidade de recomendar {survey.company?.name ?? 'nossa empresa'} a um amigo ou colega?</label>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className="rounded-md py-2 font-semibold transition-all hover:scale-105"
                  style={{
                    background: score === n ? primary : 'rgba(255,255,255,0.05)',
                    color: score === n ? '#0f172a' : '#f1f5f9',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 px-1">
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>

            {score !== null && (
              <div className="space-y-2">
                <label className="block text-sm">{followUp}</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="bg-slate-950 border-slate-800" />
              </div>
            )}

            {(survey.questions ?? []).map((q: any) => (
              <div key={q.id} className="space-y-1">
                <label className="block text-sm">{q.question_text}{q.required && ' *'}</label>
                {q.question_type === 'text' ? (
                  <Textarea value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} rows={2} className="bg-slate-950 border-slate-800" />
                ) : q.question_type === 'number' ? (
                  <Input type="number" value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="bg-slate-950 border-slate-800" />
                ) : q.question_type === 'stars' ? (
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setAnswers({ ...answers, [q.id]: n })} className="text-2xl" style={{ color: (answers[q.id] ?? 0) >= n ? primary : '#334155' }}>★</button>)}</div>
                ) : (
                  <Input value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="bg-slate-950 border-slate-800" />
                )}
              </div>
            ))}

            <Button
              onClick={submit}
              disabled={score === null || state === 'submitting'}
              className="w-full font-semibold"
              style={{ background: primary, color: '#0f172a' }}
            >
              {state === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar avaliação'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">Suas respostas são confidenciais e utilizadas somente para melhorar sua experiência.</p>
      </div>
    </div>
  );
}
