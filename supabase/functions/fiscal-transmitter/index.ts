import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { requireAuth } from "../_shared/require-auth.ts"
import { resolveContext, requireModule } from "../_shared/tenant.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await requireAuth(req, { roles: ['admin', 'manager', 'operator'] })
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ctx = await resolveContext(req, auth)
    if (!ctx.ok) {
      return new Response(JSON.stringify({ error: ctx.message }), {
        status: ctx.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const moduleDenied = await requireModule(ctx, 'fiscal')
    if (moduleDenied) return moduleDenied


    // Use service role to perform the state change, but enforce tenant scoping in code.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { nfeId, action, reason } = body as any
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (typeof nfeId !== 'string' || !UUID_RE.test(nfeId)) {
      return new Response(JSON.stringify({ error: 'ID da NF-e inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!['transmit','cancel'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Ação inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (action === 'cancel' && (typeof reason !== 'string' || reason.trim().length < 15)) {
      return new Response(JSON.stringify({ error: 'Justificativa de cancelamento deve ter ao menos 15 caracteres' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Resolve caller's company_id and ensure NF-e belongs to it
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', auth.userId!)
      .maybeSingle()
    const callerCompany = profile?.company_id

    const { data: nfe, error: nfeError } = await supabaseAdmin
      .from('nfe')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) {
      throw new Error('NF-e não encontrada')
    }
    if (callerCompany && nfe.company_id && nfe.company_id !== callerCompany) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'transmit') {
      if (!nfe.client_document) {
        return new Response(
          JSON.stringify({ error: 'Erro SEFAZ: Destinatário sem CPF/CNPJ informado.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (Math.random() < 0.05) {
        return new Response(
          JSON.stringify({ error: 'Erro SEFAZ: Serviço Temporariamente Indisponível (Código 105).' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        )
      }

      await new Promise(resolve => setTimeout(resolve, 2000))

      const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('')
      const protocol = '1' + Date.now().toString().slice(-14)
      const authorizationDate = new Date().toISOString()

      const { error: updateError } = await supabaseAdmin
        .from('nfe')
        .update({
          status: 'authorized',
          access_key: accessKey,
          protocol,
          authorization_date: authorizationDate,
        })
        .eq('id', nfeId)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true, accessKey, protocol, authorizationDate }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'cancel') {
      // Cancellation requires admin or manager
      if (auth.role !== 'admin' && auth.role !== 'manager') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!reason || reason.length < 15) {
        throw new Error('Justificativa de cancelamento deve ter pelo menos 15 caracteres.')
      }

      await new Promise(resolve => setTimeout(resolve, 1500))

      const { error: cancelError } = await supabaseAdmin
        .from('nfe')
        .update({
          status: 'cancelled',
          cancellation_date: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', nfeId)

      if (cancelError) throw cancelError

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    throw new Error('Ação inválida')
  } catch (error) {
    const msg = (error as Error).message
    const safeMessages = new Set([
      'ID da NF-e é obrigatório',
      'NF-e não encontrada',
      'Justificativa de cancelamento deve ter pelo menos 15 caracteres.',
      'Ação inválida',
    ])
    const clientMessage = safeMessages.has(msg) ? msg : 'Ocorreu um erro interno. Tente novamente.'
    console.error('fiscal-transmitter error:', error)
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

