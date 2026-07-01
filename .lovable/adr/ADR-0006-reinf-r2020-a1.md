# ADR-0006 — Reinf Produção: R-2020 + Certificado A1

- **Status**: Aceito
- **Data**: 2026-07-01
- **Contexto**: Fase de produção da EFD-Reinf exige, além do R-2010 (INSS sobre serviços tomados) e R-4020 (retenções IR/CSLL/PIS/COFINS pagas a PJ), o **R-2020** — retenção de INSS **sobre serviços prestados** pela empresa (cedente) — e a evolução do R-2099 para consolidar todos os eventos INSS do período.
- **Decisão**:
  1. Adicionar `R-2020` ao check-constraint de `reinf_events.event_type` (aditivo).
  2. Criar RPC `reinf_generate_r2020(p_competencia date)` que projeta de `accounts_receivable` + `clients` quando `metadata.retencao_inss = 'true'`. INSS retido = 11% do bruto (default), `cod_serv='100000170'`.
  3. Ajustar `reinf_close_period` para consolidar `r2020_qtd` e `r2020_inss` em `totals`.
  4. Edge Function `reinf-transmit` gera XML `evtRetPrestServ` (mesma estrutura do R-2010) marcando `ideEstabObra` com o CNPJ do tomador (cliente).
  5. Certificado A1: novo par de segredos por tenant — `REINF_CERT_A1_B64` e `REINF_CERT_A1_PASS` — usados só na Edge Function (nunca expostos ao cliente). Se ausentes, transmissão permanece em modo `simulated`.
- **Consequências**:
  - Positivas: cobertura completa dos eventos periódicos INSS; caminho pronto para XMLDSig real.
  - Neutras: XMLDSig + POST SOAP Serpro serão isolados em `reinf-sign.ts` na próxima Sprint (7.1).
- **Governança**: Review Loop aprovou; RLS mantida via `get_user_company_id` nas RPCs.
