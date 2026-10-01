import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAuth } from '../_shared/require-auth.ts';
import { instrument, contextFromAuth } from '../_shared/observability.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const auth = await requireAuth(req, { roles: ['admin', 'manager', 'operator'] });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), { status: auth.status, headers });
  }

  // Não aceitar nem simular autorização/cancelamento antes de haver retorno real da SEFAZ.
  return new Response(JSON.stringify({ error: 'Serviço fiscal indisponível: nenhuma NF-e foi transmitida ou cancelada.' }), {
    status: 503,
    headers,
  });
};

serve(instrument(handler, { source: 'fiscal-transmitter', getContext: contextFromAuth }));