// Assinatura XMLDSig para NF-e 4.00 e eventos (cancelamento, CCe).
// Reaproveita node-forge (mesmo padrão de reinf-sign.ts).
// A SEFAZ exige assinatura sobre o elemento com atributo Id (`infNFe` ou `infEvento`),
// usando exc-c14n + RSA-SHA1 (NF-e ainda opera com SHA1 na maioria das UFs).
//
// Para eventos (recepcaoEvento) o algoritmo é o mesmo aplicado sobre <infEvento Id="…">.
//
// ATENÇÃO: NF-e usa SHA1 (não SHA256). Se a UF migrar para SHA256, trocar aqui.

// deno-lint-ignore-file no-explicit-any
import forge from "npm:node-forge@1.3.1";
import { loadPfx, type CertificateInfo } from "./reinf-sign.ts";

export interface NfeSignResult {
  signedXml: string;
  cert: CertificateInfo;
}

function canonicalizeExcC14n(xml: string): string {
  // Canonicalização exclusiva simplificada. Suficiente para a estrutura determinística
  // gerada pelo builder em nfe-xml.ts (sem namespaces mistos, sem comentários).
  return xml
    .replace(/<\?xml[^?]*\?>\s*/i, "")
    .replace(/\r\n?/g, "\n")
    .replace(/>\s+</g, "><")
    .trim();
}

function sha1Base64(input: string): string {
  const md = forge.md.sha1.create();
  md.update(input, "utf8");
  return forge.util.encode64(md.digest().bytes());
}

/**
 * Assina o primeiro elemento cujo nome + atributo Id casem com o regex.
 * Insere <Signature> logo APÓS o elemento (enveloped, dentro do pai).
 */
function signNodeById(
  xml: string,
  elementName: string,
  privateKey: forge.pki.rsa.PrivateKey,
  certPem: string,
): string {
  const re = new RegExp(`(<${elementName}[^>]*\\sId="([^"]+)"[^>]*>[\\s\\S]*?</${elementName}>)`);
  const m = xml.match(re);
  if (!m) throw new Error(`element_not_found:${elementName}`);
  const fullElement = m[1];
  const id = m[2];

  const canonical = canonicalizeExcC14n(fullElement);
  const digestValue = sha1Base64(canonical);

  const signedInfo =
    `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
    `<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
    `<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
    `<Reference URI="#${id}">` +
    `<Transforms>` +
    `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
    `<Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
    `</Transforms>` +
    `<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
    `<DigestValue>${digestValue}</DigestValue>` +
    `</Reference>` +
    `</SignedInfo>`;

  const md = forge.md.sha1.create();
  md.update(canonicalizeExcC14n(signedInfo), "utf8");
  const sigBytes = privateKey.sign(md);
  const signatureValue = forge.util.encode64(sigBytes);

  const signature =
    `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
    signedInfo +
    `<SignatureValue>${signatureValue}</SignatureValue>` +
    `<KeyInfo><X509Data><X509Certificate>${certPem}</X509Certificate></X509Data></KeyInfo>` +
    `</Signature>`;

  // Insere Signature logo após o elemento assinado, dentro do pai.
  return xml.replace(fullElement, `${fullElement}${signature}`);
}

export function signNfeXml(xml: string, certB64: string, password: string): NfeSignResult {
  const { privateKey, certificate, info } = loadPfx(certB64, password);
  const certPem = forge.pki.certificateToPem(certificate)
    .replace(/-----(BEGIN|END) CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
  const signedXml = signNodeById(xml, "infNFe", privateKey, certPem);
  return { signedXml, cert: info };
}

export function signEventoXml(xml: string, certB64: string, password: string): NfeSignResult {
  const { privateKey, certificate, info } = loadPfx(certB64, password);
  const certPem = forge.pki.certificateToPem(certificate)
    .replace(/-----(BEGIN|END) CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
  const signedXml = signNodeById(xml, "infEvento", privateKey, certPem);
  return { signedXml, cert: info };
}
