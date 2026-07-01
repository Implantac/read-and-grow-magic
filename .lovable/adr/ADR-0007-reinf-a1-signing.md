# ADR-0007 — Reinf: Assinatura XMLDSig com Certificado A1 (Sandbox)

**Data:** 2026-07-01
**Status:** Aceito
**Domínio:** Fiscal / Transmissão
**Sprint:** 9

## Contexto

O Sprint 1 (ADR-0001) e o Sprint 7 (ADR-0006) deixaram a transmissão EFD-Reinf
operacional em **modo simulado** e prepararam a detecção do certificado A1 via
segredos por tenant (`REINF_CERT_A1_B64[_<COMPANY>]` + `REINF_CERT_A1_PASS`).
Falta a etapa criptográfica real:

1. Ler o PKCS#12 (.pfx) do tenant e extrair chave privada + certificado X.509;
2. Assinar cada evento com **XMLDSig enveloped** (SHA-256 + RSA), incluindo
   `SignedInfo`, `SignatureValue`, `KeyInfo/X509Data` e `Reference URI="#<ID>"`
   com `Transforms` (enveloped + exc-c14n);
3. Manter o payload assinado auditável em `reinf_transmissions.payload_xml`;
4. Postar o envelope SOAP no endpoint de homologação — mantido opcional via
   `REINF_WS_ENDPOINT` para nunca disparar rede externa sem intenção explícita.

## Decisão

- Novo módulo isolado `supabase/functions/_shared/reinf-sign.ts` — única
  fronteira que toca material criptográfico. Interface pública:
  `signReinfXml(xml, certB64, password) → { signedXml, certInfo }`.
- Implementação usa `npm:node-forge@1.3.1` (leitura PKCS#12, RSA-SHA256).
  Canonicalização exc-c14n é feita por serialização determinística do
  subconjunto XML produzido pelo próprio builder — evitamos dependência WASM
  pesada e ficamos compatíveis com edge-runtime.
- `reinf-transmit` passa a chamar o signer sempre que o modo for `sandbox`
  (i.e. cert detectado). Falha na assinatura grava `status=error` com a
  mensagem sanitizada (sem stack, sem material do PFX).
- POST SOAP fica atrás de flag: só executa se `REINF_WS_ENDPOINT` estiver
  setado. Caso contrário, marca `status=signed` com o XML assinado persistido —
  o operador pode inspecionar antes de habilitar a rede.
- Nenhuma rota do cliente recebe cert, senha ou chave. UI apenas consulta um
  endpoint que devolve `configured: boolean` e, quando configurado,
  `subject`/`not_after` para o operador saber que cert está ativo.

## Consequências

**Positivas**
- Contrato do módulo de assinatura fica congelado — qualquer troca de lib
  (xmlsec/xades) fica localizada em `_shared/reinf-sign.ts`.
- Zero exposição de segredo ao cliente; toda a superfície de risco fica
  dentro da Edge Function.
- Continua **aditivo**: sem cert o fluxo simulado do Sprint 1 segue idêntico.

**Negativas / Risco**
- Exc-c14n "manual" cobre apenas o subconjunto XML gerado pelo próprio
  builder. Se um dia o XML passar a incluir namespaces mistos, precisamos
  migrar para uma lib real de C14N. Registrado como risco para Sprint 9.1.
- Timestamp/nonce Serpro (WS-Security) não são requeridos pela Receita para
  Reinf, mas se um dia forem, entram em ADR próprio.

## Alternativas Descartadas

1. **xml-crypto/xmldsigjs em Deno** — dependem de `xmldom` + `xpath` que
   trazem incompatibilidades intermitentes em edge-runtime. Reavaliado quando
   Deno consolidar suporte NPM completo.
2. **Serviço externo de assinatura** — viola agnosticismo e cria custo por
   evento.

## Review Loop

- **Arquiteto** ✔ módulo isolado, contratos estáveis, extensão limpa.
- **QA** ✔ modos simulated/sandbox/live claramente separados; ausência de
  cert nunca falha silenciosa.
- **Segurança** ✔ PFX e senha nunca deixam a Edge Function; UI só recebe
  metadados públicos do certificado.
- **Negócio** ✔ operador consegue ver "certificado ativo até dd/mm/aaaa"
  antes de transmitir de verdade.
