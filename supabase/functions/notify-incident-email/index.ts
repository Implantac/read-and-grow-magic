import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { instrument, contextFromAuth } from "../_shared/observability.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = Deno.env.get("INCIDENT_EMAIL_FROM") ?? "SRE Alerts <onboarding@resend.dev>";

function isWithinQuietHours(settings: any): boolean {
  if (!settings) return false;
  const tz = settings.quiet_timezone || "America/Sao_Paulo";
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  if (settings.silence_weekends && (weekday === "Sat" || weekday === "Sun")) return true;
  const s = settings.quiet_hours_start as string | null;
  const e = settings.quiet_hours_end as string | null;
  if (!s || !e) return false;
  const cur = `${hh}:${mm}`;
  if (s <= e) return cur >= s.slice(0, 5) && cur < e.slice(0, 5);
  return cur >= s.slice(0, 5) || cur < e.slice(0, 5);
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "missing_email_credentials" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: { incident_id?: string };
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!payload.incident_id || typeof payload.incident_id !== "string") {
    return new Response(JSON.stringify({ error: "incident_id_required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: incident, error } = await supabase
    .from("system_incidents").select("*").eq("id", payload.incident_id).single();
  if (error || !incident) {
    return new Response(JSON.stringify({ error: "incident_not_found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (incident.severity !== "critical") {
    return new Response(JSON.stringify({ skipped: "not_critical" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve admin emails for this tenant
  const { data: roles } = await supabase
    .from("user_roles").select("user_id, profiles!inner(company_id)")
    .eq("role", "admin").eq("profiles.company_id", incident.company_id);

  const userIds = (roles ?? []).map((r: any) => r.user_id);
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ skipped: "no_admins" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: usersResp } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const emails = (usersResp?.users ?? [])
    .filter((u) => userIds.includes(u.id) && !!u.email)
    .map((u) => u.email!) as string[];

  if (emails.length === 0) {
    return new Response(JSON.stringify({ skipped: "no_emails" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subject = `[CRÍTICO] ${incident.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:8px">
      <h2 style="color:#ef4444;margin:0 0 12px">🚨 Incidente crítico aberto</h2>
      <p style="margin:0 0 8px"><strong>${escape(incident.title)}</strong></p>
      ${incident.description ? `<p style="opacity:.85">${escape(incident.description)}</p>` : ""}
      <table style="margin-top:16px;font-size:14px">
        <tr><td style="padding:4px 12px 4px 0;opacity:.7">Severidade</td><td>${incident.severity}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;opacity:.7">Fonte</td><td>${escape(incident.source ?? "manual")}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;opacity:.7">Aberto em</td><td>${new Date(incident.opened_at).toLocaleString("pt-BR")}</td></tr>
      </table>
      <p style="margin-top:20px;font-size:13px;opacity:.75">Acesse o painel <strong>/sre</strong> para gerenciar este incidente.</p>
    </div>`;

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM, to: emails, subject, html }),
  });
  const body = await res.text();
  return new Response(JSON.stringify({ ok: res.ok, recipients: emails.length, resend: safeParse(body) }), {
    status: res.ok ? 200 : 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function safeParse(s: string) { try { return JSON.parse(s); } catch { return s; } }

Deno.serve(instrument("notify-incident-email", handler, contextFromAuth));
