import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { nfeId, action } = await req.json()

    if (!nfeId) {
      throw new Error('ID da NF-e é obrigatório')
    }

    // Fetch NFe data
    const { data: nfe, error: nfeError } = await supabaseClient
      .from('nfe')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) {
      throw new Error('NF-e não encontrada')
    }

    if (action === 'transmit') {
      console.log(`Transmitindo NF-e ${nfe.number}...`)
      
      // Simulate validation (e.g. check if client has document)
      if (!nfe.client_document) {
        return new Response(
          JSON.stringify({ error: 'Erro SEFAZ: Destinatário sem CPF/CNPJ informado.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Simulate a random "SEFAZ Unavailable" or "Rejected" error (5% chance)
      if (Math.random() < 0.05) {
        return new Response(
          JSON.stringify({ error: 'Erro SEFAZ: Serviço Temporariamente Indisponível (Código 105).' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        )
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('')
      const protocol = '1' + Date.now().toString().slice(-14)
      const authorizationDate = new Date().toISOString()

      const { error: updateError } = await supabaseClient
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
      const { reason } = await req.json()
      if (!reason || reason.length < 15) {
        throw new Error('Justificativa de cancelamento deve ter pelo menos 15 caracteres.')
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const { error: cancelError } = await supabaseClient
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
