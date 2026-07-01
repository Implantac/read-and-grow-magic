// EFD-Reinf — Assinatura XMLDSig enveloped (RSA-SHA256) com certificado A1 (PKCS#12).
//
// Responsabilidade única: receber XML + PFX (base64) + senha e devolver XML assinado.
// Toda a superfície criptográfica fica isolada aqui — nenhuma outra função lê PFX.
//
// Implementação usa node-forge via npm: specifier (compatível com edge-runtime).
// Canonicalização é feita sobre o subconjunto XML determinístico produzido pelo
// próprio builder de eventos Reinf. Se a estrutura XML crescer com namespaces
// mistos, migrar para uma lib real de exc-c14n (ver ADR-0007, Sprint 9.1).

// deno-lint-ignore-file no-explicit-any
import forge from "npm:node-forge@1.3.1";

export interface CertificateInfo {
  subject: string;
  issuer: string;
  serial: string;
  not_before: string; // ISO
  not_after: string;  // ISO
}

export interface SignResult {
  signedXml: string;
  cert: CertificateInfo;
}

export interface CertLoadResult {
  privateKey: forge.pki.rsa.PrivateKey;
  certificate: forge.pki.Certificate;
  info: CertificateInfo;
}

function b64ToBinary(b64: string): string {
  // node-forge trabalha com "binary strings"
  const clean = b64.replace(/\s+/g, "");
  return atob(clean);
}

/** Extrai chave privada + cert do PKCS#12. Nunca retorna material sensível para fora. */
export function loadPfx(certB64: string, password: string): CertLoadResult {
  const binary = b64ToBinary(certB64);
  const p12Asn1 = forge.asn1.fromDer(binary);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

  let privateKey: forge.pki.rsa.PrivateKey | null = null;
  let certificate: forge.pki.Certificate | null = null;

  for (const safeContent of p12.safeContents) {
    for (const bag of safeContent.safeBags) {
      if (!privateKey && bag.type === forge.pki.oids.pkcs8ShroudedKeyBag && bag.key) {
        privateKey = bag.key as forge.pki.rsa.PrivateKey;
      } else if (!privateKey && bag.type === forge.pki.oids.keyBag && bag.key) {
        privateKey = bag.key as forge.pki.rsa.PrivateKey;
      } else if (!certificate && bag.type === forge.pki.oids.certBag && bag.cert) {
        certificate = bag.cert;
      }
    }
  }

  if (!privateKey || !certificate) {
    throw new Error("pfx_missing_key_or_cert");
  }

  const info: CertificateInfo = {
    subject: certificate.subject.attributes.map((a: any) => `${a.shortName}=${a.value}`).join(","),
    issuer: certificate.issuer.attributes.map((a: any) => `${a.shortName}=${a.value}`).join(","),
    serial: certificate.serialNumber,
    not_before: certificate.validity.notBefore.toISOString(),
    not_after: certificate.validity.notAfter.toISOString(),
  };

  return { privateKey, certificate, info };
}

function sha256Base64(input: string): string {
  const md = forge.md.sha256.create();
  md.update(input, "utf8");
  return forge.util.encode64(md.digest().bytes());
}

/** Serialização determinística para o subconjunto XML gerado pelo builder Reinf. */
function canonicalize(xml: string): string {
  // Remove declaração XML e whitespace estrutural externo. Preserva conteúdo interno.
  return xml
    .replace(/<\?xml[^?]*\?>\s*/i, "")
    .replace(/\r\n?/g, "\n")
    .replace(/>\s+</g, "><")
    .trim();
}

/**
 * Assina cada evento (elemento raiz `evt*` com atributo Id="…") do lote,
 * inserindo `<Signature>` XMLDSig enveloped ao final do próprio evento.
 * Não modifica o envelope externo `<Reinf>…<eventos>`.
 */
export function signReinfXml(xml: string, certB64: string, password: string): SignResult {
  const { privateKey, certificate, info } = loadPfx(certB64, password);
  const certPem = forge.pki.certificateToPem(certificate)
    .replace(/-----(BEGIN|END) CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");

  // Regex simples que casa cada evento Reinf pelo nome/atributo Id.
  // Escopo: <evtXxx Id="ID..."> … </evtXxx>
  const eventRe = /<(evt[A-Za-z]+)\s+Id="([^"]+)">([\s\S]*?)<\/\1>/g;

  const signed = xml.replace(eventRe, (_full, tag: string, id: string, inner: string) => {
    const eventCanonical = canonicalize(`<${tag} Id="${id}">${inner}</${tag}>`);
    const digestValue = sha256Base64(eventCanonical);

    const signedInfo =
      `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      `<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
      `<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
      `<Reference URI="#${id}">` +
      `<Transforms>` +
      `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
      `<Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
      `</Transforms>` +
      `<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
      `<DigestValue>${digestValue}</DigestValue>` +
      `</Reference>` +
      `</SignedInfo>`;

    const md = forge.md.sha256.create();
    md.update(canonicalize(signedInfo), "utf8");
    const sigBytes = privateKey.sign(md);
    const signatureValue = forge.util.encode64(sigBytes);

    const signature =
      `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      signedInfo +
      `<SignatureValue>${signatureValue}</SignatureValue>` +
      `<KeyInfo><X509Data><X509Certificate>${certPem}</X509Certificate></X509Data></KeyInfo>` +
      `</Signature>`;

    return `<${tag} Id="${id}">${inner}${signature}</${tag}>`;
  });

  return { signedXml: signed, cert: info };
}

/** Só metadados — nunca retorna key/cert PEM para o cliente. */
export function inspectCertificate(certB64: string, password: string): CertificateInfo {
  return loadPfx(certB64, password).info;
}
