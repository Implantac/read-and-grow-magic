// Consulta status do serviço SEFAZ por UF e persiste em sefaz_status_uf.
// Pode rodar via HTTP (GET ?uf=SP&ambiente=2) ou por cron (pg_cron ->
// http_post) para monitor contínuo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth } from "../_shared/require-auth.ts";
import { buildConsStatServ } from "../_shared/nfe-xml.ts";
import { callSefaz, parseSefazReturn, wrapSoap } from "../_shared/sefaz-transport.ts";
import { getSefazEndpoint, listUFs } from "../_shared/sefaz-endpoints.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  const ufParam = url.searchParams.get("uf");
  const ambiente = (Number(url.searchParams.get("ambiente") ?? 2) as 1 | 2);
  const ufs = ufParam ? [ufParam.toUpperCase()] : listUFs();

  // Consulta status sem certificado do tenant? SEFAZ exige mTLS mesmo para status,
  // portanto precisamos de um certificado "público" ou reaproveitar o de qualquer empresa.
  // Estratégia: usar o certificado ativo da empresa do chamador; se não existir,
  // devolvemos apenas o cache atual (não bloqueamos o endpoint).
  let pfxB64: string | undefined;
  let password: string | undefined;
  if (auth.companyId) {
    const { data: cert } = await admin.from("nfe_certificates").select("*")
      .eq("company_id", auth.companyId).eq("active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (cert) {
      password = Deno.env.get(cert.password_secret_name);
      const dl = await admin.storage.from("fiscal-certs").download(cert.storage_path);
      if (!dl.error && dl.data) {
        const bytes = new Uint8Array(await dl.data.arrayBuffer());
        pfxB64 = btoa(String.fromCharCode(...bytes));
      }
    }
  }

  const results = [];
  for (const uf of ufs) {
    try {
      const endpoint = getSefazEndpoint(uf, ambiente, "NfeStatusServico");
      const t0 = Date.now();
      let cStat: string | undefined, xMotivo: string | undefined, simulated = false;
      if (pfxB64 && password) {
        const soap = wrapSoap(
          buildConsStatServ(ambiente, uf),
          "http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4",
        );
        const res = await callSefaz({
          endpoint,
          soapAction: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF",
          body: soap, certB64: pfxB64, certPassword: password,
        });
        const p = parseSefazReturn(res.body);
        cStat = p.cStat; xMotivo = p.xMotivo; simulated = !!res.simulated;
      } else {
        cStat = "SKIPPED"; xMotivo = "Sem certificado para consulta"; simulated = true;
      }
      const dt = Date.now() - t0;
      const status = cStat === "107" ? "online" : cStat === "108" ? "contingency" : cStat === "109" ? "offline" : "unknown";
      await admin.from("sefaz_status_uf").upsert({
        uf, environment: ambiente, service: "nfe",
        status, status_code: cStat ?? null, motivo: xMotivo ?? null,
        avg_response_ms: dt, observed_at: new Date().toISOString(),
      }, { onConflict: "uf,environment,service" });
      results.push({ uf, status, cStat, xMotivo, avg_response_ms: dt, simulated });
    } catch (e) {
      results.push({ uf, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ ok: true, ambiente, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
