// Consome cross_module_events e gera convites conforme regras em nps_automations.
// Deve ser chamado por cron (a cada 5 min) ou por trigger que insere em cross_module_events.
// Body opcional: { since?: string ISO }  — default: últimos 15 min.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Mapeamento: nome do trigger na automação -> event_type no cross_module_events
const TRIGGER_MAP: Record<string, string[]> = {
  order_created: ['order.created', 'orders.created'],
  order_billed: ['order.billed', 'invoice.issued', 'nfe.authorized'],
  invoice_issued: ['invoice.issued', 'nfe.authorized'],
  delivered: ['shipment.delivered', 'delivery.completed'],
  service_closed: ['service.closed', 'os.closed'],
  os_closed: ['os.closed'],
  contract_closed: ['contract.closed'],
  payment_received: ['payment.received', 'accounts_receivable.paid'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = (await req.json().catch(() => ({}))) as { since?: string };
    const since = body.since ?? new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // Coleta eventos recentes ainda não processados por NPS
    const { data: events } = await admin
      .from('cross_module_events')
      .select('id, company_id, event_type, entity_id, payload, created_at')
      .gte('created_at', since)
      .limit(500);

    if (!events || events.length === 0) return json({ processed: 0 });

    let created = 0;
    const results: any[] = [];

    for (const ev of events) {
      // Todas as regras ativas da empresa
      const { data: rules } = await admin
        .from('nps_automations')
        .select('*')
        .eq('company_id', ev.company_id)
        .eq('active', true);
      if (!rules) continue;

      for (const rule of rules) {
        const mapped = TRIGGER_MAP[rule.trigger] ?? [];
        if (!mapped.includes(ev.event_type)) continue;

        // Anti-duplicação: já existe invite para esse cliente/campanha nas últimas 24h?
        const clientId = (ev.payload as any)?.client_id ?? null;
        if (!clientId || !rule.campaign_id) continue;

        const { data: recent } = await admin
          .from('nps_invites')
          .select('id')
          .eq('company_id', ev.company_id)
          .eq('campaign_id', rule.campaign_id)
          .eq('client_id', clientId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();
        if (recent) continue;

        // Delay
        const delayMs = toMs(rule.delay_value, rule.delay_unit);
        const scheduledAt = new Date(Date.now() + delayMs).toISOString();

        // Cria invite via edge nps-generate-invites (mais simples: insere direto)
        const { data: c } = await admin.from('clients').select('email, phone, name').eq('id', clientId).maybeSingle();
        const destination = rule.channel === 'email' ? c?.email : c?.phone;

        const { data: inv, error } = await admin
          .from('nps_invites')
          .insert({
            company_id: ev.company_id,
            campaign_id: rule.campaign_id,
            client_id: clientId,
            channel: rule.channel,
            destination,
            status: 'pending',
            scheduled_at: scheduledAt,
            metadata: { source: 'automation', rule_id: rule.id, trigger_event: ev.event_type },
          })
          .select('id')
          .single();
        if (error) continue;

        // Token
        const token = crypto.randomUUID().replace(/-/g, '');
        await admin.from('nps_tokens').insert({
          company_id: ev.company_id,
          campaign_id: rule.campaign_id,
          invite_id: inv.id,
          client_id: clientId,
          token,
          single_use: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        await admin.from('nps_logs').insert({
          company_id: ev.company_id,
          campaign_id: rule.campaign_id,
          event: 'invite.auto_created',
          payload: { rule_id: rule.id, invite_id: inv.id, trigger: rule.trigger },
        });
        created++;
        results.push({ rule_id: rule.id, invite_id: inv.id });
      }
    }

    return json({ processed: events.length, created, results });
  } catch (e: any) {
    console.error('nps-automation-dispatch', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function toMs(value: number, unit: string): number {
  const v = Number(value) || 0;
  if (unit === 'minutes') return v * 60_000;
  if (unit === 'hours') return v * 3_600_000;
  if (unit === 'days') return v * 86_400_000;
  return v;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
