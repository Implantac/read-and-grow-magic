# ADR-0001 — EFD-Reinf: Transmissão em Ambiente de Homologação

**Data:** 2026-07-01
**Status:** Aceito
**Autor:** Lead Enterprise Architect (UEEF)
**Domínio:** Fiscal

## Contexto

O MVP EFD-Reinf já gera eventos R-2010, R-4020 e fechamentos R-2099/R-4099 por competência com RLS multi-tenant. Falta o **fluxo de transmissão** ao webservice da Receita Federal (Serpro), que exige:

1. Envelope XML no schema oficial (versão 2.1.1);
2. Assinatura digital XMLDSig com certificado A1 (PKCS#12) do contribuinte;
3. POST SOAP contra o endpoint de homologação (`https://preprodefdreinf.receita.fazenda.gov.br/wsreinf/RecepcaoLoteReinf.svc`);
4. Persistência do recibo/protocolo retornado para consulta e auditoria.

## Decisão

Implementar o **Sprint 1 — Transmissão Sandbox** em duas camadas:

### Camada 1 — Infraestrutura de transmissão (esta Sprint)
- Nova tabela `reinf_transmissions` (multi-tenant, RLS por `company_id`) armazenando: `period_id`, `event_type`, `payload_xml`, `response_xml`, `protocol`, `status` (`pending|signed|sent|accepted|rejected|simulated`), `env` (`sandbox|prod`), `error`.
- Nova Edge Function `reinf-transmit` que:
  - Valida auth + quota (`check_quota`);
  - Carrega o `reinf_period` do `company_id` do usuário;
  - Constrói o XML canônico do lote (`envioLoteEventos` R-2010/R-4020);
  - **Modo `simulated` (default até cert A1 disponível):** grava payload, gera `protocol=SIM-{uuid}`, marca `status=simulated`. Não expõe a rede externa.
  - **Modo `sandbox` (quando `companies.reinf_cert_a1_ref` estiver setado):** hoje retorna `501 Not Implemented — awaiting cert upload`. A assinatura XMLDSig e o POST SOAP entram na Sprint 1.1.
- Botão UI **"Transmitir"** por competência em `/fiscal/reinf` que aciona a função e mostra protocolo/status.

### Camada 2 — Assinatura real + POST SOAP (Sprint 1.1, futura)
- Upload do certificado A1 (`.pfx`) por tenant → armazenamento seguro (Supabase Vault ou Storage cifrado com AES-GCM chave por tenant).
- Assinatura XMLDSig via `xmldsigjs` compat Deno (ou WASM `xmlsec`) — fora do escopo desta Sprint devido a complexidade e requisito de certificado real do cliente.
- Cliente SOAP nativo (`fetch` + envelope) contra Serpro homologação.

## Consequências

**Positivas**
- Contrato de transmissão fica **congelado agora** (tabela + função + UI), permitindo evolução incremental sem refactor.
- Auditoria completa desde o dia 1 (todo payload XML gerado é persistido, mesmo em modo simulado).
- Multi-tenant RLS garantido: cada tenant só vê suas transmissões.
- Sem quebrar contratos existentes (Sprint puramente aditiva).

**Negativas / Risco**
- Modo `simulated` não substitui homologação real — precisa ficar visível na UI para não induzir o usuário a erro.
- Sprint 1.1 (assinatura real) exige planejamento cripto sério; ADR-0002 será redigida quando abrirmos essa frente.

## Alternativas Descartadas

1. **Contratar biblioteca 3rd-party de assinatura como service (ex.: e-Notas):** cria dependência de vendor e custo variável por transmissão. Descartado — princípio de agnosticismo do ERP.
2. **Adiar tudo até termos cert:** viola o mandamento de Evolução Incremental; o usuário precisa validar o fluxo antes de investir em certificado.

## Review Loop

- **Arquiteto:** contratos estáveis, camada de assinatura isolada em Sprint futura ✔
- **QA:** modo simulado permite testes end-to-end sem cert; validar que status `simulated` nunca é apresentado como "aceito pelo governo" ✔
- **Segurança:** RLS por `company_id`, `EXECUTE` da RPC apenas para `authenticated`, XML persistido sem PII sensível além do já autorizado ✔
- **Negócio:** libera tenant para começar a operar EFD-Reinf; roadmap claro para homologação real ✔
