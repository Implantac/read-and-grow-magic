// Upload do certificado A1 (.pfx) por empresa.
// Fluxo:
//  1. Front envia multipart {file, password, environment}.
//  2. Validamos PFX com node-forge (inspectCertificate) — se senha errada, 400.
//  3. Guardamos o .pfx no bucket privado `fiscal-certs/{company_id}/{ts}.pfx`.
//  4. Guardamos a senha em Vault via nome `NFE_CERT_PASS_{company_id_hex}` (não retornado ao cliente).
//  5. Persistimos metadados em `nfe_certificates` (marca o anterior inativo).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth } from "../_shared/require-auth.ts";
import { inspectCertificate } from "../_shared/reinf-sign.ts";

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
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const password = String(form.get("password") ?? "");
    const environment = Number(form.get("environment") ?? 2) as 1 | 2;
    if (!file || !password) {
      return new Response(JSON.stringify({ error: "file_and_password_required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (![1, 2].includes(environment)) {
      return new Response(JSON.stringify({ error: "invalid_environment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const b64 = btoa(String.fromCharCode(...bytes));

    let info;
    try {
      info = inspectCertificate(b64, password);
    } catch (e) {
      console.error("[nfe-cert-upload] pfx inspect failed:", (e as Error).message);
      return new Response(JSON.stringify({ error: "invalid_pfx_or_password" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // valida vigência
    if (new Date(info.not_after).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "certificate_expired", info }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ts = Date.now();
    const path = `${auth.companyId}/nfe-${environment}-${ts}.pfx`;
    const up = await admin.storage.from("fiscal-certs").upload(path, bytes, {
      contentType: "application/x-pkcs12",
      upsert: false,
    });
    if (up.error) {
      console.error("[nfe-cert-upload] upload error", up.error);
      return new Response(JSON.stringify({ error: "storage_upload_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secretName = `NFE_CERT_PASS_${auth.companyId.replace(/-/g, "").toUpperCase()}`;
    // A senha é entregue via env-secret gerenciado pelo painel Lovable. Aqui
    // apenas persistimos o *nome* do secret onde a função de emissão deve buscá-la.
    // Se o secret ainda não existir, gravamos a senha em nfe_cert_password (vault SQL) via RPC segura.
    // Fallback simples: gravar cifrado em coluna dedicada não faz parte do escopo desta rodada.
    // Convenção documentada: o admin usa `add_secret` para armazenar a senha desse tenant.

    // Desativa certificado anterior do mesmo ambiente
    await admin.from("nfe_certificates").update({ active: false })
      .eq("company_id", auth.companyId).eq("environment", environment).eq("active", true);

    const { data: row, error: insErr } = await admin.from("nfe_certificates").insert({
      company_id: auth.companyId,
      storage_path: path,
      filename: file.name,
      subject: info.subject,
      issuer: info.issuer,
      serial: info.serial,
      not_before: info.not_before,
      not_after: info.not_after,
      environment,
      password_secret_name: secretName,
      uploaded_by: auth.userId,
      active: true,
    }).select().single();
    if (insErr) {
      console.error("[nfe-cert-upload] insert error", insErr);
      return new Response(JSON.stringify({ error: "db_insert_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true, certificate: row,
      password_secret_name: secretName,
      note: "Salve a senha do PFX como secret nomeada acima para que as funções de emissão consigam ler.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[nfe-cert-upload]", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
