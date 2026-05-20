import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSystemPrompt } from '../_shared/ai-prompts.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Analyze time_entries: avg time per work_center/operation
    const { data: entries } = await supabase
      .from('time_entries')
      .select('work_center, operation_name, start_time, end_time, produced_quantity, rejected_quantity, status')
      .eq('status', 'completed')
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false })
      .limit(500)

    // 2. Analyze production_order_steps: avg realized vs estimated
    const { data: steps } = await supabase
      .from('production_order_steps')
      .select('step_id, sequence, estimated_time_minutes, realized_time_minutes, status, quantity_pending, quantity_rejected')
      .not('realized_time_minutes', 'is', null)
      .limit(500)

    // 3. Analyze production_orders queue per status
    const { data: orders } = await supabase
      .from('production_orders')
      .select('id, status, work_center, sector, quantity, produced_quantity, due_date')
      .not('status', 'in', '("completed","cancelled")')
      .limit(1000)

    // --- Bottleneck Analysis ---

    // A) Work center / operation avg time
    const wcStats: Record<string, { totalMin: number; count: number; rejected: number; produced: number }> = {}
    ;(entries || []).forEach((e: any) => {
      const key = e.work_center || e.operation_name || 'Sem centro'
      if (!wcStats[key]) wcStats[key] = { totalMin: 0, count: 0, rejected: 0, produced: 0 }
      const start = new Date(e.start_time).getTime()
      const end = new Date(e.end_time).getTime()
      const minutes = (end - start) / 60000
      if (minutes > 0 && minutes < 1440) { // ignore > 24h anomalies
        wcStats[key].totalMin += minutes
        wcStats[key].count++
        wcStats[key].rejected += e.rejected_quantity || 0
        wcStats[key].produced += e.produced_quantity || 0
      }
    })

    const wcBottlenecks = Object.entries(wcStats)
      .map(([name, s]) => ({
        name,
        avgMinutes: Math.round(s.totalMin / s.count),
        entries: s.count,
        rejectRate: s.produced > 0 ? Math.round((s.rejected / s.produced) * 100) : 0,
      }))
      .sort((a, b) => b.avgMinutes - a.avgMinutes)

    // B) Steps with biggest overrun (realized vs estimated)
    const stepStats: Record<string, { overrunMin: number; count: number; totalPending: number }> = {}
    ;(steps || []).forEach((s: any) => {
      const key = `Etapa #${s.sequence}`
      if (!stepStats[key]) stepStats[key] = { overrunMin: 0, count: 0, totalPending: 0 }
      const overrun = (s.realized_time_minutes || 0) - (s.estimated_time_minutes || 0)
      stepStats[key].overrunMin += overrun
      stepStats[key].count++
      stepStats[key].totalPending += s.quantity_pending || 0
    })

    const stepBottlenecks = Object.entries(stepStats)
      .map(([name, s]) => ({
        name,
        avgOverrunMin: Math.round(s.overrunMin / s.count),
        entries: s.count,
        totalPending: s.totalPending,
      }))
      .filter(s => s.avgOverrunMin > 0)
      .sort((a, b) => b.avgOverrunMin - a.avgOverrunMin)

    // C) Queue size per status/sector
    const queueStats: Record<string, number> = {}
    ;(orders || []).forEach((o: any) => {
      const key = o.sector || o.work_center || o.status
      queueStats[key] = (queueStats[key] || 0) + 1
    })

    const queueBottlenecks = Object.entries(queueStats)
      .map(([name, count]) => ({ name, queueSize: count }))
      .sort((a, b) => b.queueSize - a.queueSize)

    // D) Critical bottleneck summary
    const critical = wcBottlenecks[0]
    const criticalStep = stepBottlenecks[0]
    const biggestQueue = queueBottlenecks[0]

    const summary = [
      critical ? `Centro "${critical.name}" tem tempo médio de ${critical.avgMinutes}min (${critical.entries} registros)` : null,
      criticalStep ? `${criticalStep.name} excede estimativa em ${criticalStep.avgOverrunMin}min em média` : null,
      biggestQueue ? `Fila maior: "${biggestQueue.name}" com ${biggestQueue.queueSize} OPs` : null,
    ].filter(Boolean).join('. ')

    return new Response(JSON.stringify({
      summary: summary || 'Sem dados suficientes para identificar gargalos.',
      workCenterBottlenecks: wcBottlenecks.slice(0, 5),
      stepBottlenecks: stepBottlenecks.slice(0, 5),
      queueBottlenecks: queueBottlenecks.slice(0, 5),
      totalEntriesAnalyzed: (entries || []).length,
      totalStepsAnalyzed: (steps || []).length,
      totalOrdersActive: (orders || []).length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('pcp-bottlenecks error:', err);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
