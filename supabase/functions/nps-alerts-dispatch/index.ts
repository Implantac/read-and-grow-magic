// Avalia regras de alerta contra uma resposta NPS e cria notificações + envia e-mail.
// Body: { company_id, answer_id }  (chamado internamente com service-role)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

interface Body { company_id: string; answer_id: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, service);

    const body = (await req.json()) as Body;
    if (!body?.company_id || !body?.answer_id) return json({ error: 'invalid' }, 400);

    const { data: ans } = await admin
      .from('nps_answers')
      .select('*, clients(name)')
      .eq('id', body.answer_id)
      .maybeSingle();
    if (!ans) return json({ error: 'not_found' }, 404);

    const { data: rules } = await admin
      .from('nps_alerts_config')
      .select('*')
      .eq('company_id', body.company_id)
      .eq('active', true);

    const triggered: any[] = [];
    for (const r of rules ?? []) {
      if (ans.score > r.score_max) continue;
      const clientName = (ans as any).clients?.name ?? 'Cliente';
      const title = `⚠ Alerta NPS: ${clientName} deu nota ${ans.score}`;
      const message = ans.comment ? `Comentário: "${String(ans.comment).slice(0, 200)}"` : 'Sem comentário adicional.';

      // Notificações no sistema para roles configurados
      const notifyRoles: string[] = Array.isArray(r.notify_roles) ? r.notify_roles : [];
      const notifyUsers: string[] = Array.isArray(r.notify_users) ? r.notify_users : [];

      const users = new Set<string>(notifyUsers);
      if (notifyRoles.length > 0) {
        const { data: roleUsers } = await admin
          .from('user_roles')
          .select('user_id, role')
          .in('role', notifyRoles as any);
        for (const ru of roleUsers ?? []) {
          // filtra por empresa via profiles
          const { data: pf } = await admin.from('profiles').select('id').eq('id', ru.user_id).eq('company_id', body.company_id).maybeSingle();
          if (pf) users.add(ru.user_id);
        }
      }

      const inserts = Array.from(users).map((uid) => ({
        company_id: body.company_id,
        user_id: uid,
        title,
        message,
        type: 'warning' as const,
      }));
      if (inserts.length > 0) {
        await admin.from('notifications').insert(inserts);
      }

      // Canal e-mail: envia para e-mails dos usuários alvo
      const channels: string[] = Array.isArray(r.channels) ? r.channels : [];
      if (channels.includes('email') && users.size > 0) {
        const RESEND = Deno.env.get('RESEND_API_KEY');
        const LOVABLE = Deno.env.get('LOVABLE_API_KEY');
        if (RESEND && LOVABLE) {
          // Busca e-mails via auth admin
          const emails: string[] = [];
          for (const uid of users) {
            try {
              const { data } = await admin.auth.admin.getUserById(uid);
              if (data.user?.email) emails.push(data.user.email);
            } catch {/* ignore */}
          }
          if (emails.length > 0) {
            await fetch(`${GATEWAY_URL}/emails`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${LOVABLE}`,
                'X-Connection-Api-Key': RESEND,
              },
              body: JSON.stringify({
                from: 'NPS <onboarding@resend.dev>',
                to: emails,
                subject: title,
                html: `<p><strong>${title}</strong></p><p>${message}</p>`,
              }),
            }).catch(() => {/* ignore */});
          }
        }
      }

      await admin.from('nps_logs').insert({
        company_id: body.company_id,
        event: 'alert.triggered',
        payload: { rule_id: r.id, answer_id: ans.id, notified: users.size },
      });
      triggered.push({ rule_id: r.id, notified: users.size });
    }

    return json({ triggered });
  } catch (e: any) {
    console.error('nps-alerts-dispatch', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
