// SEFAZ mTLS proxy — Node 20+ / Fastify
//
// Recebe: POST /soap  { endpoint, soap_action, headers, soap, cert_b64, cert_password }
// Autentica via header Authorization: Bearer $PROXY_TOKEN (obrigatório em produção).
// Apresenta o certificado A1 (.pfx em base64 + senha) no handshake TLS com a SEFAZ
// via https.Agent({ pfx, passphrase }) e devolve { status, body }.
//
// Deploy: Fly.io / Render / VPS. Não requer estado local — o certificado
// chega em cada requisição (memória apenas durante o request).
//
// Segurança:
//  - TLS 1.2+ obrigatório (SEFAZ exige TLSv1.2 com ciphers modernos).
//  - PROXY_TOKEN obrigatório em produção (NODE_ENV=production).
//  - Body limit 4 MB (o maior lote NFe é ~500 KB).
//  - Cert/senha nunca são logados.

import Fastify from "fastify";
import https from "node:https";
import { Buffer } from "node:buffer";

const PORT = Number(process.env.PORT || 8443);
const TOKEN = process.env.PROXY_TOKEN;
const isProd = process.env.NODE_ENV === "production";

if (isProd && !TOKEN) {
  console.error("[sefaz-mtls-proxy] PROXY_TOKEN é obrigatório em produção.");
  process.exit(1);
}

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL || "info" },
  bodyLimit: 4 * 1024 * 1024,
});

app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

app.post("/soap", async (req, reply) => {
  if (TOKEN) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${TOKEN}`) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  }

  const { endpoint, soap_action, headers, soap, cert_b64, cert_password } = req.body ?? {};
  if (!endpoint || !soap || !cert_b64 || cert_password == null) {
    return reply.code(400).send({ error: "missing_fields", required: ["endpoint","soap","cert_b64","cert_password"] });
  }

  let url;
  try { url = new URL(endpoint); } catch {
    return reply.code(400).send({ error: "invalid_endpoint" });
  }
  // Whitelist sefaz domains (.fazenda.*.gov.br e receita.fazenda.gov.br)
  if (!/\.fazenda\.[a-z.]+\.gov\.br$/i.test(url.hostname) && !/receita\.fazenda\.gov\.br$/i.test(url.hostname)) {
    return reply.code(400).send({ error: "endpoint_not_whitelisted", host: url.hostname });
  }

  const pfx = Buffer.from(cert_b64, "base64");
  const agent = new https.Agent({
    pfx,
    passphrase: cert_password,
    minVersion: "TLSv1.2",
    keepAlive: false,
    rejectUnauthorized: true,
  });

  const soapBuf = Buffer.from(soap, "utf-8");
  const reqHeaders = {
    "Content-Type": "application/soap+xml; charset=utf-8",
    "Content-Length": String(soapBuf.length),
    ...(headers && typeof headers === "object" ? headers : {}),
    ...(soap_action ? { "SOAPAction": soap_action } : {}),
  };

  const started = Date.now();
  try {
    const upstream = await new Promise((resolve, reject) => {
      const r = https.request(
        {
          method: "POST",
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          headers: reqHeaders,
          agent,
          timeout: 30_000,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString("utf-8") }));
        },
      );
      r.on("timeout", () => { r.destroy(new Error("upstream_timeout")); });
      r.on("error", reject);
      r.write(soapBuf);
      r.end();
    });

    app.log.info({ host: url.hostname, status: upstream.status, ms: Date.now() - started }, "sefaz_call");
    return reply.send(upstream);
  } catch (err) {
    app.log.error({ host: url.hostname, err: String(err?.message || err), ms: Date.now() - started }, "sefaz_error");
    return reply.code(502).send({ error: "upstream_error", message: String(err?.message || err) });
  } finally {
    agent.destroy();
  }
});

app.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`sefaz-mtls-proxy on :${PORT}`))
  .catch((e) => { console.error(e); process.exit(1); });
