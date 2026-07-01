// EFD-Reinf — Transmissão (Sprint 1, modo simulated/sandbox scaffold)
// Gera envelope XML do lote de eventos, persiste em reinf_transmissions e
// retorna protocolo. Assinatura XMLDSig real + POST SOAP entram em Sprint 1.1.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/require-auth.ts";

type EventType = "R-2010" | "R-2020" | "R-4020" | "R-2099" | "R-4099";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function fmt(n: unknown): string {
  return Number(n ?? 0).toFixed(2);
}

function buildEventXml(e: any): string {
  const id = `ID${e.event_type.replace("-", "")}${(e.id as string).replace(/-/g, "").slice(0, 20)}`;
  const comp = (e.data_emissao || "").slice(0, 7);
  switch (e.event_type as EventType) {
    case "R-2010":
      return `<evtRetPrestServ Id="${id}">
  <ideEvento><indRetif>1</indRetif><perApur>${esc(comp)}</perApur><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>USE-ERP-1.0</verProc></ideEvento>
  <ideContri><tpInsc>1</tpInsc><nrInsc>${esc(e.cnpj_beneficiario || "")}</nrInsc></ideContri>
  <ideEstabObra><tpInscEstab>1</tpInscEstab><nrInscEstab>${esc(e.cnpj_prestador || "")}</nrInscEstab>
    <nfs><serie>1</serie><numDocto>${esc(e.nota_fiscal || "")}</numDocto><dtEmissaoNF>${esc(e.data_emissao || "")}</dtEmissaoNF>
      <vlrBruto>${fmt(e.vr_bruto)}</vlrBruto>
      <infoTpServ><tpServico>${esc(e.cod_serv || "100000")}</tpServico>
        <vlrBaseRet>${fmt(e.vr_bruto)}</vlrBaseRet><vlrRetencao>${fmt(e.vr_ret_inss)}</vlrRetencao></infoTpServ>
    </nfs></ideEstabObra>
</evtRetPrestServ>`;
    case "R-2020":
      // R-2020: retenção INSS sobre serviços PRESTADOS. Contribuinte = a própria empresa (prestador);
      // ideTomadorServ = CNPJ do cliente que reteve.
      return `<evtServTom Id="${id}">
  <ideEvento><indRetif>1</indRetif><perApur>${esc(comp)}</perApur><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>USE-ERP-1.0</verProc></ideEvento>
  <ideContri><tpInsc>1</tpInsc><nrInsc>${esc(e.cnpj_prestador || "")}</nrInsc></ideContri>
  <ideTomadorServ><tpInscTomador>1</tpInscTomador><nrInscTomador>${esc(e.cnpj_beneficiario || "")}</nrInscTomador>
    <nfs><serie>1</serie><numDocto>${esc(e.nota_fiscal || "")}</numDocto><dtEmissaoNF>${esc(e.data_emissao || "")}</dtEmissaoNF>
      <vlrBruto>${fmt(e.vr_bruto)}</vlrBruto>
      <infoTpServ><tpServico>${esc(e.cod_serv || "100000")}</tpServico>
        <vlrBaseRet>${fmt(e.vr_bruto)}</vlrBaseRet><vlrRetencao>${fmt(e.vr_ret_inss)}</vlrRetencao></infoTpServ>
    </nfs></ideTomadorServ>
</evtServTom>`;
    case "R-4020":
      return `<evtRetPF Id="${id}">
  <ideEvento><indRetif>1</indRetif><perApur>${esc(comp)}</perApur><tpAmb>2</tpAmb><procEmi>1</procEmi><verProc>USE-ERP-1.0</verProc></ideEvento>
  <ideContri><tpInsc>1</tpInsc><nrInsc>${esc(e.cnpj_beneficiario || "")}</nrInsc></ideContri>
  <ideBenef><cpfBenef>${esc(e.cnpj_prestador || "")}</cpfBenef>
    <idePgto><natRend>${esc(e.cod_receita || "56")}</natRend>
      <infoPgto><dtFG>${esc(e.data_emissao || "")}</dtFG><vlrRendBruto>${fmt(e.vr_bruto)}</vlrRendBruto>
        <vlrIR>${fmt(e.vr_ret_ir)}</vlrIR><vlrCSLL>${fmt(e.vr_ret_csll)}</vlrCSLL>
        <vlrPIS>${fmt(e.vr_ret_pis)}</vlrPIS><vlrCOFINS>${fmt(e.vr_ret_cofins)}</vlrCOFINS>
      </infoPgto></idePgto></ideBenef>
</evtRetPF>`;
    case "R-2099":
    case "R-4099":
      return `<evtFech${e.event_type === "R-4099" ? "Retencoes" : "Reinf"} Id="${id}">
  <ideEvento><perApur>${esc(comp)}</perApur><tpAmb>2</tpAmb></ideEvento>
</evtFech${e.event_type === "R-4099" ? "Retencoes" : "Reinf"}>`;
  }
}

function buildLoteXml(events: any[]): string {
  const items = events.map(buildEventXml).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Reinf xmlns="http://www.reinf.esocial.gov.br/schemas/envioLoteEventos/v1_05_01">
  <envioLoteEventos>
    <ideContribuinte><tpInsc>1</tpInsc><nrInsc>_TENANT_</nrInsc></ideContribuinte>
    <eventos>${items}</eventos>
  </envioLoteEventos>
</Reinf>`;
}

function genProtocol(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  const pre = handleCorsPreflight(req);
  if (pre) return pre;

  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!auth.companyId) {
      return new Response(JSON.stringify({ error: "no_company_scope" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const periodId = String(body.period_id || "");
    const eventTypes: EventType[] = Array.isArray(body.event_types) && body.event_types.length
      ? body.event_types
      : ["R-2010", "R-2020", "R-4020", "R-2099", "R-4099"];
    if (!periodId) {
      return new Response(JSON.stringify({ error: "period_id required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch period + verify tenant
    const { data: period, error: pErr } = await admin
      .from("reinf_periods").select("*").eq("id", periodId).maybeSingle();
    if (pErr || !period) {
      return new Response(JSON.stringify({ error: "period_not_found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (period.company_id !== auth.companyId) {
      return new Response(JSON.stringify({ error: "forbidden_tenant" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Check company cert config → determines env
    const { data: company } = await admin
      .from("companies").select("id, reinf_cert_a1_ref").eq("id", auth.companyId).maybeSingle();
    const hasCert = Boolean((company as any)?.reinf_cert_a1_ref);
    const env: "simulated" | "sandbox" = hasCert ? "sandbox" : "simulated";

    const { data: events } = await admin
      .from("reinf_events").select("*")
      .eq("period_id", periodId).in("event_type", eventTypes);
    const evs = events || [];
    if (evs.length === 0) {
      return new Response(JSON.stringify({ error: "no_events_to_transmit" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const xml = buildLoteXml(evs);

    // Sandbox real transmission not yet implemented (needs XMLDSig + PFX)
    if (env === "sandbox") {
      const { data: row } = await admin.from("reinf_transmissions").insert({
        company_id: auth.companyId, period_id: periodId,
        event_type: "LOTE", env, status: "error",
        payload_xml: xml, events_count: evs.length,
        error: "Assinatura XMLDSig + POST SOAP em Sprint 1.1 (requer certificado A1 configurado).",
        created_by: auth.userId,
      }).select().single();
      return new Response(JSON.stringify({
        ok: false, env, transmission: row,
        message: "Certificado detectado, mas assinatura real ainda não implementada (Sprint 1.1).",
      }), { status: 501, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Simulated mode — persist payload with mock protocol
    const protocol = genProtocol("SIM");
    const { data: row, error: iErr } = await admin.from("reinf_transmissions").insert({
      company_id: auth.companyId, period_id: periodId,
      event_type: "LOTE", env, status: "simulated",
      protocol, payload_xml: xml, events_count: evs.length,
      transmitted_at: new Date().toISOString(), created_by: auth.userId,
      response_xml: `<simulated><protocol>${protocol}</protocol><events>${evs.length}</events></simulated>`,
    }).select().single();
    if (iErr) throw iErr;

    return new Response(JSON.stringify({
      ok: true, env, protocol, events_count: evs.length, transmission: row,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[reinf-transmit]", (err as Error).message);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
