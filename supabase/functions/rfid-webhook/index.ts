import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require API key for RFID readers
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('RFID_WEBHOOK_API_KEY');
    if (!expectedKey || !apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const body = await req.json();

    // Support single event or batch
    const events = Array.isArray(body) ? body : [body];

    const normalized = events.map((e: any) => ({
      reader_code: e.reader_code || e.readerCode || 'UNKNOWN',
      tag_epc: e.tag_epc || e.tagEpc || e.epc,
      event_type: e.event_type || e.eventType || 'read',
      rssi: e.rssi ?? null,
      antenna: e.antenna ?? 1,
      location: e.location ?? null,
      zone: e.zone ?? null,
      metadata: e.metadata ?? null,
    }));

    // Validate required fields
    const valid = normalized.filter((r: any) => r.tag_epc);
    if (valid.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid events (tag_epc required)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve tenant (company_id) from reader_code — eventos sem leitor mapeado são rejeitados
    const uniqueReaders = [...new Set(valid.map((r: any) => r.reader_code))];
    const { data: readers } = await supabase
      .from('rfid_readers')
      .select('code, company_id')
      .in('code', uniqueReaders);
    const readerTenant = new Map<string, string>();
    (readers || []).forEach((r: any) => { if (r.company_id) readerTenant.set(r.code, r.company_id); });

    const rows = valid
      .map((r: any) => {
        const company_id = readerTenant.get(r.reader_code);
        return company_id ? { ...r, company_id } : null;
      })
      .filter(Boolean);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No events with a registered reader/tenant' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase.from('rfid_events').insert(rows);
    if (error) throw error;

    // Update last_read_at on tags and last_heartbeat on readers — escopados por tenant
    const now = new Date().toISOString();
    const tagPairs = [...new Set(rows.map((r: any) => `${r.company_id}::${r.tag_epc}`))]
      .map(k => { const [company_id, epc] = k.split('::'); return { company_id, epc }; });

    await Promise.all([
      ...tagPairs.map(({ company_id, epc }) =>
        supabase.from('rfid_tags').update({ last_read_at: now }).eq('company_id', company_id).eq('epc', epc)
      ),
      ...[...readerTenant.entries()].map(([code, company_id]) =>
        supabase.from('rfid_readers').update({ last_heartbeat: now }).eq('company_id', company_id).eq('code', code)
      ),
    ]);

    return new Response(JSON.stringify({ success: true, inserted: rows.length, rejected: valid.length - rows.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RFID webhook error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
