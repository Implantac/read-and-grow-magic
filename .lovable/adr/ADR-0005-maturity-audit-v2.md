# ADR-0005 — Maturity Audit v2

- **Status**: Aceito
- **Data**: 2026-07-01
- **Contexto**: UEEF exige reavaliação periódica da maturidade dos 11 domínios (Fiscal, Financeiro, WMS, Produção, Compras, Estoque, Contábil, Comercial, SRE, IA/Brain, SaaS Core) para orientar backlog.
- **Decisão**: Consolidar auditoria em página `/governanca/maturity` que compute score 0–100 por domínio a partir de sinais reais do banco: cobertura de RLS, SLOs ativos, incidentes 30d, uso de quota, ADRs por domínio. Sem novas tabelas: reaproveita `sre_slos`, `system_incidents`, `system_events`, `feature_flags`, `reinf_transmissions`, `bank_match_rules`.
- **Consequências**:
  - Positivas: visibilidade contínua da maturidade, backlog priorizado por gap.
  - Neutras: exige refresh manual do arquivo `.lovable/maturity-audit-YYYY-MM.md` a cada ciclo.
- **Governança**: Review Loop (Arq/QA/Sec/Negócio) aprovou; próximos ciclos automatizam via cron.
