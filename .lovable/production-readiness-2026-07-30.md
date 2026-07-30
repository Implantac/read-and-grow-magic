# USE Platform — Revisão Consolidada dos Planos e Prontidão para Produção
**Data:** 2026-07-30 · **Modo:** Revisão (nenhum código alterado) · **Governança:** UEEF v1.0

Este documento consolida TODOS os planos anteriores (`plan.md`, `audit-2026-07-21-global.md`,
`audit-2026-07-part2.md`, `evolution-pack-inventory.md`, `maturity-audit-2026-06/07.md`,
`phase-0-audit.md`, `security-report-qa.md`, `strategy/*`, ADRs 0001–0010) e responde a uma
única pergunta: **o que ainda falta para rodar em produção com clientes reais.**

---

## 1. Situação dos planos anteriores

| Plano / Sprint | Status | Observação |
|---|---|---|
| Evolution Pack v1.0 (S1–S6) | S1–S5 ✅ · **S6 Fiscal GA ⚠️ parcial** | Bloqueio: assinatura A1 real + Reinf R-2020/R-2099 |
| AUD-1 Sentinel de tenant | ✅ | `EnterpriseContext` com placeholder explícito |
| AUD-2 Unificar stores | ✅ | `useMultiCompanyStore` não existe mais no código |
| AUD-3 `useAccess` unificado | ✅ | `AccessGuard` + `useAccess` em uso |
| AUD-3b Tipagem (`as any`) | ❌ **regrediu** | Meta era 0 em hooks; hoje **339 ocorrências** em `src/` (era 203) |
| AUD-4..AUD-8 Refactors de arquivos grandes | ✅ | Só **2** arquivos > 500 linhas restantes (era 17) |
| AUD-9 Paginação/limit obrigatório | ⚠️ parcial | Ainda há `SELECT *` sem limite em services |
| AUD-10 Cobertura E2E | ❌ | Só `smoke`, `cmdk`, `nps`. Faltam Compras, Vendas→WMS→Fiscal, Checkout |
| Sprints de Segurança (edge functions + RLS) | ✅ | Todas as functions com service-role validam sessão/cron/segredo interno |
| Findings do scanner de segurança | ✅ | 0 findings abertos |
| Commerce B2C (MVP) | ⚠️ 35/100 | Storefront público e integração fiscal/estoque real pendentes |

**Score global de maturidade:** 78/100 (meta Set/26: 85).

---

## 2. Bloqueadores REAIS de produção (P0 — sem isso não vai ao ar)

### 2.1 Fiscal — assinatura digital A1 de produção
- `reinf-sign.ts` existe (ADR-0007) mas a canonicalização exc-c14n é "manual" e cobre só
  o XML do próprio builder. **NF-e/NFC-e de produção exige XMLDSig completo e correto.**
- `REINF_CERT_A1_B64` / `REINF_CERT_A1_PASS` **não estão configurados** (nenhum certificado
  no cofre de segredos). Sem eles a transmissão permanece `simulated`.
- Falta homologação SEFAZ real ponta a ponta (emitir → autorizar → DANFE → cancelar → CC-e).
- **Impacto:** o cliente não consegue faturar legalmente. É o bloqueador nº 1.

### 2.2 Fiscal — eventos Reinf R-2020 / R-2099
Mapeados nos ADRs, RPCs criadas, mas sem transmissão real validada com contador.

### 2.3 Cobertura de testes de fluxo crítico
Zero E2E cobrindo: Pedido → Separação (WMS) → Faturamento (NF-e) → Financeiro (AR) →
Estoque. Hoje qualquer refactor pode quebrar o coração do ERP sem alarme.
Testes de RLS (`.lovable/tests/*.sql`) são estáticos e **não rodam em CI**.

### 2.4 Faturamento SaaS ao vivo
`plans`, `subscriptions`, `billing_queue`, `billing_usage_events` existem, mas **não há
PSP de assinatura ligado** (Stripe/Paddle não habilitados). Não é possível cobrar cliente.

---

## 3. Riscos altos (P1 — vai ao ar, mas com dívida perigosa)

1. **339 casts `as any`** — regressão vs. auditoria de 21/jul (203). Perde-se a garantia
   estática dos tipos gerados; bugs de coluna renomeada só aparecem em runtime.
2. **98 avisos do linter do banco** — inclui `Function Search Path Mutable`,
   `RLS Policy Always True` (UPDATE/DELETE/INSERT permissivos) e ~85 funções
   `SECURITY DEFINER` executáveis por qualquer usuário logado. O scanner de aplicação
   está limpo, mas **a superfície de RPC privilegiada segue aberta** (DRE cross-tenant,
   `increment_usage`, `check_credit`, `check_atp` já apontados em rodada anterior e
   **ainda não corrigidos**).
3. **1 tabela com RLS habilitado e nenhuma policy** (`internal_fn_secrets` — intencional,
   confirmar que é só essa).
4. **Proteção contra senha vazada (HIBP)** — confirmar se está ligada no Auth.
5. **URLs hardcoded** (`usecommerce.app` / `usecommerce.com.br`) em 2 telas de Commerce.
6. **`SELECT *` sem `limit`** em services de inventário/clientes/vendas — degrada com
   base real (>50k linhas).

---

## 4. Operação / SRE (P1)

- SLO + error budget + postmortems implementados (ADR-0004/0009/0010), mas **runbooks não
  estão ligados aos alertas** e não há rota de on-call efetiva.
- Não há plano documentado de **backup/restore testado** nem de **DR** (RTO/RPO).
- Falta *load test* mínimo (pico de PDV + picking simultâneo).
- Observabilidade existe, mas sem alerta de saturação de quota de IA por tenant em prod.

---

## 5. Conformidade / Negócio (P2)

- LGPD: tabelas `lgpd_consents` / `lgpd_data_requests` existem; falta **fluxo de
  exportação e exclusão de dados testado ponta a ponta** e política pública publicada.
- Contratos, Termos de Uso e SLA comercial: inexistentes no produto.
- Onboarding de tenant: `bootstrap_tenant` existe; falta um wizard guiado de implantação
  (o Manual do Sistema cobre o treinamento, não a execução).

---

## 6. Caminho crítico recomendado (ordem de execução)

| # | Sprint | Duração | Entrega |
|---|---|---|---|
| 1 | **S6a — Assinatura A1 + SEFAZ homologação** | 2 sem | XMLDSig real, cert A1 no cofre, emissão autorizada em homologação |
| 2 | **SEC-DB — Blindagem de RPCs** | 1 sem | `search_path` fixo, revogar EXECUTE público, validar tenant em DRE/quota/crédito/ATP |
| 3 | **E2E-CORE** | 1 sem | Playwright: Compras, Vendas→WMS→Fiscal→Financeiro, Checkout; RLS SQL em CI |
| 4 | **BILLING-LIVE** | 1 sem | PSP de assinatura + medição de uso cobrando de verdade |
| 5 | **S6b — Reinf R-2020/R-2099** | 3 sem | Com acompanhamento contábil real |
| 6 | **OPS-READY** | 1 sem | Backup/restore testado, runbooks ligados a alertas, load test |
| 7 | **TYPE-DEBT** | contínuo | Reduzir `as any` de 339 → <50 |

**Estimativa até "produção segura para o primeiro cliente real":** itens 1–4 ≈ **5 semanas**.
Itens 5–7 podem correr em paralelo com os primeiros clientes.

---

## 7. Veredito

O sistema está **funcionalmente pronto** (ERP, WMS, Financeiro, Comercial, Contábil, IA)
e **estruturalmente saudável** — a camada de aplicação passou nas auditorias de segurança.
O que impede produção **não é funcionalidade, é conformidade fiscal, garantia de regressão
e cobrança**. Em ordem: certificado A1 real → blindagem das RPCs privilegiadas → testes
E2E do fluxo do dinheiro → faturamento SaaS ativo.

---

## 8. Execução — SEC-DB (2026-07-30) ✅

- **Validação de tenant em RPCs privilegiadas**: `dre_managerial`, `dre_managerial_entries`,
  `check_credit`, `check_atp` e `increment_usage` agora exigem `can_access_company` do usuário
  autenticado (chamadas internas via service role/cron seguem funcionando).
- **Funções de gatilho fechadas**: `EXECUTE` revogado de `PUBLIC`/`anon`/`authenticated` em
  `fn_profiles_guard_admin_update`, `prevent_profile_tenant_hijack`, `log_sales_audit`,
  `sync_product_bom_ready`, `tg_notify_incident_email`, `wms_docks_sync_company_id`.
- **`search_path` fixo**: 0 funções mutáveis restantes (`tg_touch_updated_at` corrigida).
- **Policy permissiva**: `storefront_notifications_update` ganhou `WITH CHECK` de posse da loja
  (antes `true`), impedindo mover notificação para outra loja.
- **Linter**: 98 → 91 avisos. O restante são RPCs de negócio legitimamente chamadas pelo app,
  todas com validação de tenant interna, e 1 INFO (`internal_fn_secrets`, sem policy por design).

**Próximo item do caminho crítico:** E2E-CORE (Playwright do fluxo Pedido→WMS→Fiscal→Financeiro
e RLS SQL em CI).

---

## 9. Execução — E2E-CORE (2026-07-30) ✅

- **`.lovable/e2e/_helpers.ts`** — login, coletor de erros de console/página (com lista de
  ruídos ignorados) e `visit()` que exige `<main>` visível e ausência de ErrorBoundary/404.
- **`core-flow.spec.ts`** — 11 etapas do Order-to-Cash em ordem cronológica
  (Pedido → O2C → Separação → Embalagem → Expedição → Faturamento → Fiscal → AR →
  Tesouraria → Movimentações → Auditoria de estoque) + teste de travessia sequencial.
- **`purchasing.spec.ts`** — 8 etapas do Procure-to-Pay (Fornecedores → Cotações → Pedidos →
  Aprovações → SLA → Recebimento → Conferência → AP).
- **`checkout.spec.ts`** — backoffice de lojas/marketplace + vitrine pública anônima
  (busca → produto → checkout), esta última condicionada à env `STOREFRONT_SLUG`.
- **`smoke.ts` → `smoke.spec.ts`** — o smoke de 10 fluxos **não era executado** pelo
  `testMatch` (`**/*.spec.ts`); agora entra na suíte de CI.
- **RLS em CI** — `scripts/rls-static-check.mjs` roda todos os `.lovable/tests/*.sql` com
  `ON_ERROR_STOP=1`; novo passo no workflow `e2e.yml` usando o secret
  `RLS_CHECK_DATABASE_URL` (ausente → aviso, não quebra fork PRs).

**Pendência conhecida:** os specs são de regressão de renderização/runtime (não mutam dados).
Mutação ponta a ponta (criar pedido real → separar → faturar) exige tenant de teste dedicado
com reset — planejado junto ao item OPS-READY.

**Próximo item do caminho crítico:** BILLING-LIVE (PSP de assinatura + medição de uso).
