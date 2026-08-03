# USE Platform — Revisão Consolidada de Todos os Planos
**Data:** 2026-08-02 · **Modo:** Revisão (nenhum código alterado) · **Governança:** UEEF v1.0

Substitui, para efeito de leitura corrente, o consolidado de 2026-07-30. Verificação feita
contra o código e o banco reais (métricas medidas, não estimadas).

---

## 1. Status de cada plano existente

| Plano / Documento | Status | Verificação (02/ago) |
|---|---|---|
| `plan.md` — AUD-3 Tipagem por domínio | ✅ **concluído** | `as any` em `src/`: **1** (era 339). `: any`: **98** (era 716) |
| AUD-4..AUD-8 — quebra de arquivos grandes | ✅ concluído | Só `ui/base/sidebar.tsx` (shadcn, 638) acima de 500 linhas |
| AUD-9 — paginação/limit obrigatório | ⚠️ parcial | `SELECT *` sem `limit` ainda em services de inventário/clientes/vendas |
| AUD-10 — cobertura E2E | ✅ base entregue | 6 specs: smoke, cmdk, nps, core-flow (O2C 11 etapas), purchasing (P2P 8 etapas), checkout |
| SEC-DB — blindagem de RPCs | ✅ concluído | search_path fixo, EXECUTE revogado nos gatilhos, tenant validado em DRE/crédito/ATP/quota |
| BILLING-LIVE | ⚠️ código pronto, **não ligado** | `billing-checkout` + `billing-webhook` existem; **`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` ausentes no cofre** |
| Evolution Pack S1–S5 | ✅ | Vitrine pública, busca, multi-EAN, perfil comercial, commerce bridge |
| S6 — Fiscal GA | ❌ **bloqueado** | Assinatura A1 de produção e Reinf R-2020/R-2099 pendentes |
| ADRs 0001–0010 | ✅ implementados | Reinf sandbox, conciliação, wave planning, SLO, postmortems + ações |
| Multi-loja atacado/varejo | ✅ | Matriz de estoque, filtro de canal, RLS por filial |
| Ledger imutável + PDV offline + auditoria | ✅ | `stock_movements`, `useOfflinePDV`, tela de auditoria |
| Manual do Sistema | ✅ | Módulos + trilha para leigos + roteiro em 10 fases + glossário |
| Findings do scanner de aplicação | ✅ | 0 abertos |

**Score global de maturidade:** 78 → estimado **81/100** (ganhos em tipagem, E2E e SEC-DB).

---

## 2. O que ainda bloqueia produção (P0)

1. **Assinatura digital A1 real (NF-e/NFC-e).** XMLDSig com canonicalização exc-c14n
   completa + certificado no cofre + homologação SEFAZ ponta a ponta
   (emitir → autorizar → DANFE → cancelar → CC-e). Sem isso o cliente não fatura.
   Segredos presentes hoje: `SEFAZ_MTLS_PROXY_TOKEN`, `SEFAZ_WEBHOOK_SECRET` —
   **falta o certificado A1** (`REINF_CERT_A1_B64` / `REINF_CERT_A1_PASS`).
2. **Cobrança SaaS ao vivo.** Todo o fluxo está codado, mas sem chave do PSP nada cobra.
   É uma tarefa de configuração (1 dia), não de desenvolvimento.
3. **E2E mutacional.** Os specs atuais cobrem regressão de renderização/runtime; nenhum
   cria pedido real → separa → fatura. Exige tenant de teste com reset.

## 3. Riscos altos (P1)

- **91 avisos do linter do banco** (era 98). O grosso são RPCs de negócio `SECURITY DEFINER`
  chamadas pelo app — todas com validação de tenant interna, mas a superfície continua ampla.
  Recomendo classificar as ~85 funções em: (a) exigem definer → manter + documentar,
  (b) podem virar `SECURITY INVOKER`, (c) só internas → revogar EXECUTE.
- **`SELECT *` sem limite** em services de alto volume — degradação com base real (>50k linhas).
- **Reinf R-2020/R-2099** sem transmissão validada com contador.
- **URLs hardcoded** (`usecommerce.app`, `usecommerce.com.br`) — mover para `src/config/env.ts`.
- **Proteção HIBP de senha vazada** — confirmar habilitação no Auth.

## 4. Operação / SRE (P1)

- SLO, error budget, postmortems e ações com owner/prazo entregues.
- Faltam: runbooks ligados aos alertas, rota de on-call, **backup/restore testado (RTO/RPO)**,
  load test de pico (PDV + picking simultâneos), alerta de saturação de quota de IA por tenant.

## 5. Conformidade / Negócio (P2)

- LGPD: tabelas existem; falta o fluxo de exportação/exclusão testado ponta a ponta e a
  política publicada.
- Termos de Uso, contrato e SLA comercial: inexistentes no produto.
- Onboarding: `bootstrap_tenant` existe; falta wizard guiado de implantação.

---

## 6. Caminho crítico revisado

| # | Sprint | Duração | Entrega |
|---|---|---|---|
| 1 | **BILLING-ON** | 1–2 dias | Cadastrar chaves do PSP, apontar webhook, testar 1 assinatura real ponta a ponta |
| 2 | **S6a — Assinatura A1 + SEFAZ homologação** | 2 sem | XMLDSig real, cert A1 no cofre, autorização em homologação |
| 3 | **E2E-MUT** | 1 sem | Tenant de teste com reset + fluxo do dinheiro mutando dados em CI |
| 4 | **DB-SURFACE** | 1 sem | Classificar e reduzir as 91 RPCs definer; fechar o que for interno |
| 5 | **PERF-GUARD** | 3 dias | `limit` + paginação obrigatórios nos services de alto volume |
| 6 | **S6b — Reinf R-2020/R-2099** | 3 sem | Com acompanhamento contábil real |
| 7 | **OPS-READY** | 1 sem | Backup/restore testado, runbooks nos alertas, load test |
| 8 | **LGPD-GA** | 3 dias | Exportação/exclusão testadas + política publicada |

**Até o primeiro cliente real faturando:** itens 1–3 ≈ **3 semanas** (contra 5 na revisão anterior).

---

## 7. Veredito

Os planos de dívida técnica (tipagem, arquivos grandes, RPCs privilegiadas, E2E base)
foram **efetivamente executados** — a regressão apontada em 30/jul foi revertida e superada.
O que resta para produção é **externo ao código**: certificado fiscal, chave do PSP e um
tenant de teste. A recomendação é não abrir novas frentes de funcionalidade até fechar
os itens 1 a 3.

---

## 8. Execução pós-revisão

### PERF-GUARD (concluído)
`src/lib/queryLimits.ts` com `LIST_LIMIT` (500), `REPORT_LIMIT` (5000) e `LEDGER_LIMIT` (2000)
aplicados às 14 consultas de alto volume; domínios das lojas movidos para `src/config/env.ts`.

### DB-SURFACE — onda 1 (concluído)
Classificação das 85 funções `SECURITY DEFINER` executáveis por usuário logado, cruzando
`pg_proc` com as chamadas reais em `src/` e `supabase/functions/`:

- **(a) mantidas** — RPCs de negócio chamadas pelo app, todas com validação de tenant interna.
- **(b) mantidas por dependência de RLS** — `get_user_branch_id`, `is_matriz_viewer`
  (referenciadas em políticas; revogar quebraria leitura).
- **(c) fechadas** — EXECUTE revogado de `PUBLIC`/`anon`/`authenticated`, mantido só em
  `service_role`: `calculate_difal`, `calculate_icms_st`, `can_access_company`,
  `cx_ensure_default_weights`, `get_usage_summary`, `get_user_branch_ids`, `has_branch_access`,
  `has_module_access`, `purchase_approval_sla_status`, `recompute_stock_balance`,
  `sre_actions_due_scan`, `sre_current_oncall`, `sre_postmortems_by_slo`, `sre_runbooks_for_slo`.

**Resultado:** avisos do linter do banco **91 → 77**. As 71 restantes são RPCs de negócio
legitimamente chamadas pelo front com escopo de empresa validado dentro da função.

### LGPD-GA (concluído)
Tela **Privacidade e Dados (LGPD)** em `/admin/privacidade` (`src/modules/admin/Privacidade.tsx`),
ligada ao menu Administração:

- **Exportação** (art. 18 II/V): chama `lgpd-export` e baixa o JSON do titular.
- **Exclusão/anonimização** (art. 18 VI): confirmação por digitação "EXCLUIR" → `lgpd-delete`,
  encerra sessão; documentos fiscais retidos 5 anos (art. 16 II).
- **Consentimentos**: termos, política, marketing e telemetria — cada mudança grava nova linha
  em `lgpd_consents` com versão e user-agent (trilha imutável).
- **Histórico** de solicitações lido de `lgpd_data_requests`.

Linter do banco: única pendência INFO restante é `internal_fn_secrets` (RLS sem policy —
intencional: tabela acessível apenas por `service_role`).

### OPS-READY (concluído — 03/08)
- `.lovable/ops/runbooks.md`: 6 runbooks (fiscal, banco lento, webhook de cobrança, divergência de
  estoque, RLS/acesso, PDV offline) + matriz de severidade e escalonamento.
- `.lovable/ops/backup-restore.md`: política de backup/retenção, ensaio trimestral de restauração
  com metas RTO 4 h / RPO 15 min e ordem de recuperação em desastre.
- `scripts/load-test.mjs`: teste de carga sem dependências (p50/p90/p95/p99, erro, throughput),
  falha o processo fora da meta (p95 ≤ 2 s, erro ≤ 0,5 %). Smoke local: p95 32 ms, 0 % de erro.

Restam apenas os itens externos: chaves do PSP (BILLING-ON), certificado A1 (S6a) e tenant de
teste para E2E mutante (E2E-MUT).
