# Maturity Audit — Julho 2026

Snapshot de maturidade por domínio (UEEF v1.0). Score: 0–100.

| Domínio | Score | Evolução vs Jun/26 | Highlights | Gaps prioritários |
|---|---|---|---|---|
| Fiscal (NF-e/SPED/Reinf) | 82 | ▲ +9 | Reinf R-2010/R-4020 + transmissão sandbox (ADR-0001) | Certificado A1 real, R-2020, R-2099 |
| Financeiro | 84 | ▲ +7 | Conciliação automática por regras (ADR-0002), Open Finance | Cobrança recorrente PIX, DRE gerencial |
| WMS | 88 | ▲ +5 | Wave Planning v2 (ADR-0003), Digital Twin, Slotting ML | Voice picking, cross-dock em fluxo |
| Produção | 72 | = | OEE, MRP, Kanban | APS, sequenciamento multi-restrição |
| Compras | 68 | = | POs, cotações, supplier scoring | Aprovação hierárquica, contratos |
| Estoque | 80 | ▲ +2 | Kardex, ABC, reservas por pedido | Multi-empresa consolidado |
| Contábil | 70 | = | Partida dobrada, Balancete | Consolidação, DFCs auto |
| Comercial | 76 | = | Sales AI, Kanban, Playbooks | Forecast probabilístico |
| SRE | 74 | ▲ +12 | SLO/Error Budget (ADR-0004), Observability | Runbooks, on-call rota |
| IA/Brain | 82 | ▲ +6 | Painel de quota (hard-cap), decisões auditáveis | Fine-tune por tenant |
| SaaS Core | 86 | = | Multi-tenant RLS, RBAC, Feature Flags, Marketplace | Faturamento por uso ao vivo |

**Score global**: 78/100 (▲ +5). Meta Set/26: 85.

## Backlog priorizado (próximas 6 Sprints)

1. **Reinf produção** — certificado A1 real + eventos R-2020/R-2099.
2. **DRE Gerencial** — visão por centro de custo + drill-down.
3. **Aprovação hierárquica de Compras** — reuso Workflow Engine v3.
4. **APS de Produção** — sequenciamento por restrição multi-máquina.
5. **Forecast Comercial probabilístico** — Monte Carlo sobre pipeline.
6. **On-call & Runbooks SRE** — pager + playbooks vinculados a SLOs.
