// Emissão de NF-e 4.00 — pipeline completo:
// 1. Autentica (admin/manager/operator).
// 2. Carrega dados da NF-e (do payload ou de public.nfe pelo id).
// 3. Carrega certificado A1 ativo (Storage) + senha (secret por tenant).
// 4. Monta XML NF-e 4.00 (nfe-xml).
// 5. Assina infNFe (nfe-sign, RSA-SHA1).
// 6. Empacota em SOAP e chama SEFAZ via proxy mTLS (sefaz-transport). Se
//    proxy não configurado, roda em modo simulado (útil em homolog local).
// 7. Persiste xml_signed/xml_authorized/protocol/access_key em public.nfe.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth } from "../_shared/require-auth.ts";
import { buildNFeXml, type NFeInput } from "../_shared/nfe-xml.ts";
import { signNfeXml } from "../_shared/nfe-sign.ts";
import { callSefaz, parseSefazReturn, wrapSoap } from "../_shared/sefaz-transport.ts";
import { getSefazEndpoint } from "../_shared/sefaz-endpoints.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ["admin", "manager", "operator"] });
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
    const { nfe_id, payload } = await req.json() as { nfe_id?: string; payload?: NFeInput };
    if (!nfe_id && !payload) {
      return new Response(JSON.stringify({ error: "nfe_id_or_payload_required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega certificado ativo
    const { data: cert } = await admin.from("nfe_certificates")
      .select("*").eq("company_id", auth.companyId).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!cert) {
      return new Response(JSON.stringify({ error: "no_active_certificate" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const password = Deno.env.get(cert.password_secret_name);
    if (!password) {
      return new Response(JSON.stringify({
        error: "certificate_password_secret_missing",
        secret_name: cert.password_secret_name,
        hint: "Cadastre a senha do PFX como secret com esse nome no painel.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Baixa PFX
    const dl = await admin.storage.from("fiscal-certs").download(cert.storage_path);
    if (dl.error || !dl.data) {
      console.error("[nfe-emit] download pfx failed:", dl.error);
      return new Response(JSON.stringify({ error: "cert_download_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pfxBytes = new Uint8Array(await dl.data.arrayBuffer());
    const pfxB64 = btoa(String.fromCharCode(...pfxBytes));

    // Se veio nfe_id, monta payload a partir da tabela (simplificado — extenda conforme schema real).
    let nfeInput: NFeInput;
    if (payload) {
      nfeInput = payload;
    } else {
      // Placeholder: em produção montar a partir de public.nfe + nfe_items + companies/clients.
      return new Response(JSON.stringify({ error: "payload_builder_not_implemented", hint: "Envie 'payload' inline nesta etapa." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Constrói XML e assina
    const { xml: xmlUnsigned, chave } = buildNFeXml(nfeInput);
    const { signedXml } = signNfeXml(xmlUnsigned, pfxB64, password);

    // Empacota lote de 1 NF-e em enviNFe
    const enviNFe = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
      `<idLote>${Date.now()}</idLote><indSinc>1</indSinc>` +
      signedXml.replace(/<\?xml[^?]*\?>\s*/i, "") +
      `</enviNFe>`;
    const soap = wrapSoap(enviNFe, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4");

    const uf = nfeInput.emitente.endereco.uf;
    const endpoint = getSefazEndpoint(uf, nfeInput.ambiente, "NfeAutorizacao");
    const res = await callSefaz({
      endpoint,
      soapAction: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote",
      body: soap, certB64: pfxB64, certPassword: password,
    });
    const parsed = parseSefazReturn(res.body);

    const authorized = parsed.cStat === "100";
    const now = new Date().toISOString();

    // Persiste em public.nfe
    let nfeRow;
    if (nfe_id) {
      const { data } = await admin.from("nfe").update({
        status: authorized ? "authorized" : "rejected",
        access_key: chave,
        protocol: parsed.nProt ?? null,
        authorization_date: authorized ? now : null,
        xml_signed: signedXml,
        xml_authorized: authorized ? res.body : null,
        environment: nfeInput.ambiente,
        error_details: authorized ? null : { cStat: parsed.cStat, xMotivo: parsed.xMotivo },
      }).eq("id", nfe_id).select().single();
      nfeRow = data;
    }

    return new Response(JSON.stringify({
      ok: authorized,
      simulated: res.simulated ?? false,
      chave,
      cStat: parsed.cStat,
      xMotivo: parsed.xMotivo,
      nProt: parsed.nProt,
      nfe: nfeRow,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[nfe-emit]", e);
    return new Response(JSON.stringify({ error: "internal_error", message: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
