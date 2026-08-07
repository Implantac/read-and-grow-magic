# MASTER PLAN — HARDENING & OPERATIONAL EVOLUTION (JUL/AUG 2026)

## STATUS ATUAL: READY FOR PRODUCTION (HARDENING COMPLETO) + FASE 2A INICIADA
O projeto passou por um hardening profundo (Fases 0 a 29) e agora está evoluindo para o modelo de Rede Operacional (Fábrica, CD, Lojas).

---

## FASES CONCLUÍDAS (HARDENING)
- [x] **FASE 0-5**: Mapeamento, Isolamento, RLS, IDOR, Edge Security.
- [x] **FASE 6-10**: Idempotência, RBAC, Integridade do Ledger, Precisão Financeira.
- [x] **FASE 11-15**: E2E-CORE, Static Analysis, Auditoria de Eventos, Rate Limiting.
- [x] **FASE 16-20**: Errores amigáveis, Monitoring, Refatoração PCP/Financial, Consolidação de Services.
- [x] **FASE 21-25**: Design System, UX Operacional, Performance (PERF-GUARD), Database Indexes, LGPD.
- [x] **FASE 26-29**: Documentação, DoD Permanente, No-Mock Policy, Relatório Final.

---

## FASE EM EXECUÇÃO: FASE 2A — MODELO DE REDE OPERACIONAL
Esta fase reestrutura o ERP para suportar grandes redes de varejo/indústria.

### 1. Arquitetura de Rede (DB) - [EM PROGRESSO]
- [x] Expansão de `branch_tipo`: `FACTORY`, `DISTRIBUTION_CENTER`, `STORE`.
- [x] Hierarquia PDV: `pos_terminals`, `pos_sessions`.
- [x] Transferências (Documento Real): `stock_transfer_orders`, `stock_transfer_items`.
- [x] Ressuprimento: `replenishment_policies`.
- [ ] Triggers de Estoque em Trânsito.

### 2. Contexto Operacional (UI) - [EM PROGRESSO]
- [x] Refatoração do `EnterpriseContext` para suportar `currentBranch` (Unidade) global.
- [ ] Seletor de Unidade no Topbar ("TODAS AS UNIDADES" vs Unidade Específica).
- [ ] Persistência do Contexto na Sessão.

### 3. Estoque e Transferências - [PENDENTE]
- [ ] Dashboard de Estoque Global (Visão Consolidada).
- [ ] Fluxo de Transferência (Solicitada -> Aprovada -> Em Trânsito -> Recebida).
- [ ] Gestão de Divergências na Conferência.

### 4. Inteligência de Ressuprimento (Torre de Controle) - [PENDENTE]
- [ ] Motor de cálculo de necessidade (Lead Time, Safety Stock, Venda Média).
- [ ] Sugestões de transferência interna (CD -> Loja, Loja -> Loja) antes de compra externa.

---

## PRÓXIMAS ETAPAS (APÓS FASE 2A)
1. **Fiscal Pro**: Certificado A1 Vault (Implementação Real).
2. **PDV Offline**: Sincronização em segundo plano com tratamento de conflitos.
3. **Open Finance**: Conciliação real via API de Bancos.
