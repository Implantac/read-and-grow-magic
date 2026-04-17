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

    // Optional API key validation for RFID readers
    const apiKey = req.headers.get('x-api-key');
    // In production, validate apiKey against stored keys

    const body = await req.json();

    // Support single event or batch
    const events = Array.isArray(body) ? body : [body];

    const rows = events.map((e: any) => ({
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
    const valid = rows.filter((r: any) => r.tag_epc);
    if (valid.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid events (tag_epc required)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.from('rfid_events').insert(valid);
    if (error) throw error;

    // Update last_read_at on tags and last_heartbeat on readers
    const uniqueEpcs = [...new Set(valid.map((r: any) => r.tag_epc))];
    const uniqueReaders = [...new Set(valid.map((r: any) => r.reader_code))];
    const now = new Date().toISOString();

    await Promise.all([
      ...uniqueEpcs.map(epc =>
        supabase.from('rfid_tags').update({ last_read_at: now }).eq('epc', epc)
      ),
      ...uniqueReaders.map(code =>
        supabase.from('rfid_readers').update({ last_heartbeat: now }).eq('code', code)
      ),
    ]);

    return new Response(JSON.stringify({ success: true, inserted: valid.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RFID webhook error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
