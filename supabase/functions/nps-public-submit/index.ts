import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body {
  token: string;
  score: number;
  comment?: string;
  answers?: { question_id: string; value_text?: string; value_number?: number; value_json?: unknown }[];
  response_time_seconds?: number;
  ua?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const body = (await req.json()) as Body;
    if (!body?.token || typeof body.score !== 'number' || body.score < 0 || body.score > 10) {
      return json({ error: 'Dados inválidos' }, 400);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
    const ua = body.ua ?? req.headers.get('user-agent') ?? '';

    const { data: tok } = await admin
      .from('nps_tokens')
      .select('id, company_id, campaign_id, client_id, invite_id, single_use, expires_at, used_at')
      .eq('token', body.token)
      .maybeSingle();
    if (!tok) return json({ error: 'Token inválido' }, 404);
    if (tok.expires_at && new Date(tok.expires_at) < new Date()) return json({ error: 'Token expirado' }, 410);
    if (tok.single_use && tok.used_at) return json({ error: 'Já respondido' }, 410);

    const device = /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
    const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Other';

    const { data: ans, error: ansErr } = await admin
      .from('nps_answers')
      .insert({
        company_id: tok.company_id,
        campaign_id: tok.campaign_id,
        client_id: tok.client_id,
        invite_id: tok.invite_id,
        token_id: tok.id,
        score: body.score,
        category: 'passive',
        comment: body.comment ?? null,
        ip,
        device, browser, os,
        response_time_seconds: body.response_time_seconds ?? null,
        origin: 'public_link',
        channel: 'link',
      })
      .select()
      .single();
    if (ansErr) throw ansErr;

    if (Array.isArray(body.answers) && body.answers.length > 0) {
      await admin.from('nps_answer_items').insert(
        body.answers.map((a) => ({
          company_id: tok.company_id,
          answer_id: ans.id,
          question_id: a.question_id,
          value_text: a.value_text ?? null,
          value_number: a.value_number ?? null,
          value_json: a.value_json ?? null,
        })),
      );
    }

    await admin.from('nps_tokens').update({ used_at: new Date().toISOString(), used_ip: ip, used_user_agent: ua }).eq('id', tok.id);
    if (tok.invite_id) {
      await admin.from('nps_invites').update({ status: 'responded', responded_at: new Date().toISOString() }).eq('id', tok.invite_id);
    }

    await admin.from('nps_logs').insert({
      company_id: tok.company_id,
      campaign_id: tok.campaign_id,
      event: 'survey.completed',
      payload: { answer_id: ans.id, score: body.score, category: ans.category },
    });

    // Dispatch AI sentiment (fire-and-forget: não aguarda para não bloquear a resposta ao cliente)
    if (body.comment && body.comment.length > 5) {
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/nps-ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ answer_id: ans.id }),
      }).catch(() => { /* ignore */ });
    }

    return json({ ok: true, category: ans.category });
  } catch (e) {
    console.error('nps-public-submit', e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
