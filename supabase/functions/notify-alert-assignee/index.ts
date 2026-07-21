// Sprint Q — Notifica o responsável de um alerta de divergência
// Envia e-mail quando um alerta é atribuído ou quando o SLA está próximo do vencimento.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = Deno.env.get("INCIDENT_EMAIL_FROM") ?? "Use ERP Alerts <onboarding@resend.dev>";

function esc(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function sendEmail(to: string[], subject: string, html: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) return { ok: false, error: "missing_email_credentials" };
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: DEFAULT_FROM, to, subject, html }),
  });
  return { ok: res.ok, body: await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let payload: { notification_id?: string; mode?: "assigned" | "sla_warning" | "escalated" } = {};
  try { payload = await req.json(); } catch { /* cron call has no body */ }

  const mode = payload.mode ?? (payload.notification_id ? "assigned" : "sla_warning");

  // ------------ Modo "escalated": alerta foi reatribuído por vencimento de SLA ------------
  if (mode === "escalated" && payload.notification_id) {
    const { data: n } = await supabase
      .from("notifications").select("*").eq("id", payload.notification_id).maybeSingle();
    if (!n?.assigned_to) {
      return new Response(JSON.stringify({ skipped: "no_assignee" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: users } = await supabase.auth.admin.listUsers({ perPage: 500 });
    const email = users?.users.find((u) => u.id === n.assigned_to)?.email;
    if (!email) return new Response(JSON.stringify({ skipped: "no_email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const dueTxt = n.due_at ? new Date(n.due_at).toLocaleString("pt-BR") : "—";
    const fromName = (n as any).escalated_from ? String((n as any).escalated_from).slice(0, 8) : "—";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:8px">
        <h2 style="color:#ef4444;margin:0 0 12px">🚨 Alerta escalonado para você</h2>
        <p style="margin:0 0 8px">O SLA venceu sem tratamento e o alerta foi reatribuído a você.</p>
        <p style="margin:12px 0 8px"><strong>${esc(n.title)}</strong></p>
        ${n.message ? `<p style="opacity:.85">${esc(n.message)}</p>` : ""}
        <p style="margin-top:12px"><strong>Prazo original:</strong> ${esc(dueTxt)}</p>
        <p style="margin-top:6px"><strong>Responsável anterior:</strong> ${esc(fromName)}</p>
        <p style="margin-top:20px;font-size:13px;opacity:.75">Trate imediatamente em <strong>/financeiro/divergencias</strong>.</p>
      </div>`;
    const r = await sendEmail([email], `[ESCALONADO] ${n.title}`, html);
    return new Response(JSON.stringify({ ok: r.ok, mode }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ------------ Modo "assigned": envia e-mail a um único responsável ------------
  if (mode === "assigned" && payload.notification_id) {
    const { data: n } = await supabase
      .from("notifications").select("*").eq("id", payload.notification_id).maybeSingle();
    if (!n?.assigned_to) {
      return new Response(JSON.stringify({ skipped: "no_assignee" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: users } = await supabase.auth.admin.listUsers({ perPage: 200 });
    const email = users?.users.find((u) => u.id === n.assigned_to)?.email;
    if (!email) return new Response(JSON.stringify({ skipped: "no_email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const dueTxt = n.due_at ? new Date(n.due_at).toLocaleString("pt-BR") : "sem SLA definido";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:8px">
        <h2 style="color:#f59e0b;margin:0 0 12px">🔔 Alerta atribuído a você</h2>
        <p style="margin:0 0 8px"><strong>${esc(n.title)}</strong></p>
        ${n.message ? `<p style="opacity:.85">${esc(n.message)}</p>` : ""}
        <p style="margin-top:16px"><strong>Prazo (SLA):</strong> ${esc(dueTxt)}</p>
        <p style="margin-top:20px;font-size:13px;opacity:.75">Acesse <strong>/financeiro/divergencias</strong> para tratar este alerta.</p>
      </div>`;
    const r = await sendEmail([email], `[Divergência] ${n.title}`, html);
    return new Response(JSON.stringify({ ok: r.ok, mode }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ------------ Modo "sla_warning": cron — alerta responsáveis com SLA próximo (< 60min) ------------
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const { data: pending } = await supabase
    .from("notifications")
    .select("*")
    .eq("read", false)
    .not("assigned_to", "is", null)
    .not("due_at", "is", null)
    .is("sla_warned_at", null)
    .lte("due_at", soon)
    .gt("due_at", now.toISOString());

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ ok: true, warned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 500 });
  const emailById = new Map(users?.users.map((u) => [u.id, u.email!]).filter(([, e]) => !!e) ?? []);

  let sent = 0;
  for (const n of pending) {
    const email = emailById.get(n.assigned_to as string);
    if (!email) continue;
    const dueTxt = new Date(n.due_at as string).toLocaleString("pt-BR");
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:8px">
        <h2 style="color:#ef4444;margin:0 0 12px">⏰ SLA se aproximando</h2>
        <p style="margin:0 0 8px"><strong>${esc(n.title)}</strong></p>
        <p style="margin-top:12px"><strong>Vence em:</strong> ${esc(dueTxt)}</p>
        <p style="margin-top:20px;font-size:13px;opacity:.75">Trate o alerta em <strong>/financeiro/divergencias</strong>.</p>
      </div>`;
    const r = await sendEmail([email], `[SLA] ${n.title}`, html);
    if (r.ok) {
      await supabase.from("notifications").update({ sla_warned_at: new Date().toISOString() }).eq("id", n.id);
      sent++;
    }
  }

  return new Response(JSON.stringify({ ok: true, warned: sent, candidates: pending.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
