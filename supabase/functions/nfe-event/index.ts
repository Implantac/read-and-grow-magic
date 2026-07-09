// Eventos pós-autorização: cancelamento (110111) e Carta de Correção (110110).
// POST { nfe_id, type: 'cancel'|'cce', reason?, correction?, sequence? }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth } from "../_shared/require-auth.ts";
import { buildEventoCancelamento, buildEventoCCe } from "../_shared/nfe-xml.ts";
import { signEventoXml } from "../_shared/nfe-sign.ts";
import { callSefaz, parseSefazReturn, wrapSoap } from "../_shared/sefaz-transport.ts";
import { getSefazEndpoint } from "../_shared/sefaz-endpoints.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ["admin", "manager"] });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!auth.companyId) {
    return new Response(JSON.stringify({ error: "no_company_scope" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  try {
    const { nfe_id, type, reason, correction, sequence = 1 } = await req.json() as {
      nfe_id: string; type: "cancel" | "cce"; reason?: string; correction?: string; sequence?: number;
    };
    if (!nfe_id || !["cancel", "cce"].includes(type)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (type === "cancel" && (!reason || reason.length < 15)) {
      return new Response(JSON.stringify({ error: "reason_min_15_chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (type === "cce" && (!correction || correction.length < 15)) {
      return new Response(JSON.stringify({ error: "correction_min_15_chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega NF-e
    const { data: nfe } = await admin.from("nfe").select("*").eq("id", nfe_id).maybeSingle();
    if (!nfe || nfe.company_id !== auth.companyId) {
      return new Response(JSON.stringify({ error: "nfe_not_found_or_forbidden" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!nfe.access_key || !nfe.protocol) {
      return new Response(JSON.stringify({ error: "nfe_not_authorized" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Certificado
    const { data: cert } = await admin.from("nfe_certificates").select("*")
      .eq("company_id", auth.companyId).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!cert) {
      return new Response(JSON.stringify({ error: "no_active_certificate" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const password = Deno.env.get(cert.password_secret_name);
    if (!password) {
      return new Response(JSON.stringify({ error: "certificate_password_secret_missing", secret_name: cert.password_secret_name }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const dl = await admin.storage.from("fiscal-certs").download(cert.storage_path);
    if (dl.error || !dl.data) {
      return new Response(JSON.stringify({ error: "cert_download_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pfxBytes = new Uint8Array(await dl.data.arrayBuffer());
    const pfxB64 = btoa(String.fromCharCode(...pfxBytes));

    const uf = String(nfe.uf ?? "SP");
    const ambiente = (nfe.environment ?? 2) as 1 | 2;
    const cnpj_emit = String(nfe.emitente_cnpj ?? "").replace(/\D/g, "");

    const { xml: eventoXml } = type === "cancel"
      ? buildEventoCancelamento({
          ambiente, chave_nfe: nfe.access_key, cnpj_emit, uf,
          sequencia: sequence, protocolo_autorizacao: nfe.protocol,
          justificativa: reason!,
        })
      : buildEventoCCe({
          ambiente, chave_nfe: nfe.access_key, cnpj_emit, uf,
          sequencia: sequence, correcao: correction!,
        });

    const { signedXml } = signEventoXml(eventoXml, pfxB64, password);
    const envEvento = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">` +
      `<idLote>${Date.now()}</idLote>` +
      signedXml.replace(/<\?xml[^?]*\?>\s*/i, "") +
      `</envEvento>`;

    const soap = wrapSoap(envEvento, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4");
    const endpoint = getSefazEndpoint(uf, ambiente, "RecepcaoEvento");
    const res = await callSefaz({
      endpoint,
      soapAction: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento",
      body: soap, certB64: pfxB64, certPassword: password,
    });
    const parsed = parseSefazReturn(res.body);
    const accepted = parsed.cStat === "135" || parsed.cStat === "136" || parsed.cStat === "155";

    const { data: event } = await admin.from("nfe_events").insert({
      company_id: auth.companyId, nfe_id, event_type: type,
      sequence, reason: reason ?? null, correction: correction ?? null,
      protocol: parsed.nProt ?? null,
      status: accepted ? "accepted" : "rejected",
      xml_event: signedXml, xml_response: res.body,
      status_code: parsed.cStat, status_reason: parsed.xMotivo,
      sent_at: new Date().toISOString(), processed_at: new Date().toISOString(),
      created_by: auth.userId,
    }).select().single();

    if (accepted && type === "cancel") {
      await admin.from("nfe").update({
        status: "cancelled",
        cancellation_date: new Date().toISOString(),
        cancellation_reason: reason,
      }).eq("id", nfe_id);
    }

    return new Response(JSON.stringify({
      ok: accepted, simulated: res.simulated ?? false,
      cStat: parsed.cStat, xMotivo: parsed.xMotivo, nProt: parsed.nProt,
      event,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[nfe-event]", e);
    return new Response(JSON.stringify({ error: "internal_error", message: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
