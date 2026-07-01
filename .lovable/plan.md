## Sequenciamento — 6 Frentes Enterprise

Vou entregar as 6 frentes em **Sprints incrementais**, uma por turno, seguindo UEEF (Diagnóstico → Porquê → Implementação → Review Loop). Cada Sprint termina com código funcional, RLS por `company_id` e atualização de memória/roadmap.

### Ordem proposta (do mais crítico p/ governança ao mais estratégico)

| # | Sprint | Domínio | Entregáveis principais |
|---|---|---|---|
| **1** | **EFD-Reinf — Transmissão Sandbox** | Fiscal | Edge Function `reinf-transmit` (assinatura XMLDSig via `node-forge` port Deno, envelope SOAP, envio homologação Serpro), tabela `reinf_transmissions`, UI botão "Transmitir" com status/protocolo, ADR-0001 |
| **2** | **Conciliação Bancária Avançada** | Financial | Motor de matching por regras (`bank_match_rules` por tenant), score de similaridade (valor+data+descrição), sugestões ML-lite (Levenshtein), UI drag-drop de conciliação, RPC `bank_reconcile_auto` |
| **3** | **WMS Wave Planning v2** | Warehouse | Tabelas `wms_waves`/`wms_wave_orders`, algoritmo de agrupamento (cutoff+carrier+zone), balanceamento por operador (carga horária), UI `WavePlanning.tsx` com simulação |
| **4** | **AI Hard-cap — Painel do Tenant** | AI/Brain | View `v_tenant_usage_daily`, componente `UsageMeter`, alertas 80%/95%/100%, página `/billing/usage` evoluída com breakdown por função + projeção mês |
| **5** | **SRE — SLO/Error Budget Dashboard** | SRE | Tabela `sre_slos` (target, window), coletor por Edge Function stats, cálculo error budget consumido, página `/sre/slo` com burn rate charts |
| **6** | **Maturity Audit v2 + Roadmap Refresh** | Governance | Re-scan dos 11 domínios, atualização de `.lovable/maturity-audit-2026-06.md` → `maturity-audit-2026-07.md`, novo `plan.md` com backlog priorizado |

### Regras de execução
- **Uma Sprint por turno** — você diz "prossiga" para avançar.
- **ADR-First** apenas quando estrutural (Sprints 1, 2 e 5 terão ADR).
- **Enterprise Review Loop** ao fim de cada Sprint: Arquiteto / QA / Segurança / Negócio.
- **Sem quebrar contratos**: extensões only; tabelas novas com RLS por `company_id`; funções Edge com `requireAuth` + `check_quota`.
- Stack real respeitada (Vite/React/Supabase). Assinatura XMLDSig usa libs compatíveis Deno.

### Começo agora
Abro **Sprint 1 — EFD-Reinf Transmissão Sandbox** neste mesmo turno após sua aprovação do plano: ADR-0001 + migration `reinf_transmissions` + Edge Function `reinf-transmit` + botão UI. Homologação Serpro exige certificado A1 do tenant — vou provisionar via `companies.reinf_cert_a1` (bytea) e senha via Vault (`vault.secrets`), com upload posterior pelo tenant. Sem certificado, a UI mostra estado "Aguardando certificado".
