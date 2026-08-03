# Runbooks Operacionais — Use Platform

Última revisão: 2026-08-03 · Dono: plantão SRE (`/observabilidade` → aba Plantão)

Cada runbook segue o mesmo formato: **Sintoma → Diagnóstico → Mitigação → Pós**.
Todo incidente aberto deve referenciar o slug do runbook em `sre_incidents.runbook_slug`.

---

## RB-001 — Emissão fiscal falhando (NF-e/NFC-e)

**Sintoma:** notas presas em `pendente`/`rejeitada`, alertas do painel fiscal.

**Diagnóstico**
1. `/fiscal` → painel de status SEFAZ por UF (`sefaz_status_uf`).
2. Logs da função `nfe-transmit` (últimos 30 min) — procurar `cStat` retornado.
3. Validade do certificado A1 em `/fiscal/certificado` (alerta automático 30 dias antes).

**Mitigação**
- `cStat` 108/109 (SEFAZ fora) → ativar contingência offline; notas ficam em fila e retransmitem.
- Certificado vencido/senha errada → subir novo `.pfx`; sem isso não há emissão.
- Rejeição de regra (2xx/5xx) → corrigir cadastro (NCM/CFOP/CST) em `/fiscal/regras` e reenviar.

**Pós:** registrar contagem de notas afetadas e reprocessadas; se a causa foi cadastro, abrir ação
corretiva em `sre_actions`.

---

## RB-002 — Banco lento / timeouts na API

**Sintoma:** telas com carregamento longo, erros 5xx do PostgREST.

**Diagnóstico**
1. Painel de queries lentas (Observabilidade) — identificar as 5 piores.
2. Confirmar se a query ofensora respeita os limites de `src/lib/queryLimits.ts`.
3. Checar picos de conexões (jobs cron das 06:00 e 07:00 UTC).

**Mitigação**
- Query sem `limit` → aplicar `LIST_LIMIT`/`REPORT_LIMIT` e publicar hotfix.
- Cron concorrendo com pico de uso → reagendar para janela ociosa.
- Índice ausente → criar via migração (nunca `CREATE INDEX` manual fora de migração).

**Pós:** anexar o plano de execução (`EXPLAIN ANALYZE`) no post-mortem.

---

## RB-003 — Webhook de cobrança sem processar

**Sintoma:** assinatura paga mas plano não liberado; divergência em `subscriptions`.

**Diagnóstico**
1. Logs da função `stripe-webhook` — verificar falha de assinatura (`signature verification failed`).
2. Conferir se o segredo do webhook corresponde ao endpoint configurado no PSP.
3. Comparar `subscriptions.status` com o estado no PSP.

**Mitigação**
- Segredo divergente → atualizar no cofre e reenviar os eventos pelo painel do PSP.
- Evento perdido → reprocessar manualmente o `checkout.session.completed` correspondente.
- Liberação urgente do cliente → ajustar `subscriptions` com registro em auditoria e reconciliar depois.

**Pós:** nenhuma alteração manual de plano pode ficar sem lançamento de reconciliação.

---

## RB-004 — Divergência de estoque

**Sintoma:** alerta da conciliação diária; saldo do Kardex ≠ saldo em `stock_balances`.

**Diagnóstico**
1. `/estoque/auditoria` → lista de divergências por produto/depósito.
2. Conferir movimentos do período no ledger imutável `stock_movements`.

**Mitigação**
- Divergência de cálculo → `recompute_stock_balance` (service_role) para os SKUs afetados.
- Movimento faltante → lançar ajuste com motivo; **nunca** editar/apagar linha do ledger.

**Pós:** se a origem foi integração (WMS/PDV offline), abrir ação corretiva no módulo de origem.

---

## RB-005 — Falha de autenticação / acesso negado em massa

**Sintoma:** usuários sem acesso a módulos, erros de RLS em várias telas.

**Diagnóstico**
1. Verificar `user_roles` e `plan_modules` do tenant afetado.
2. Rodar `scripts/rls-static-check.mjs` para detectar política recém-publicada sem GRANT.
3. Logs de erro do PostgREST: mensagens `permission denied` indicam GRANT ausente; `new row violates
   row-level security` indica policy.

**Mitigação**
- GRANT ausente → migração com o `GRANT` sugerido no HINT.
- Policy ampla demais removida sem substituta → restaurar a policy correta escopada por empresa.

**Pós:** o check estático de RLS deve rodar em CI antes de qualquer migração de política.

---

## RB-006 — PDV offline não sincroniza

**Sintoma:** vendas na fila local sem subir após retorno de rede.

**Diagnóstico:** console do terminal → tamanho da fila em `offlineQueue`; erros de conflito de numeração.

**Mitigação:** forçar sincronização manual na tela do PDV; em conflito de série/número, renumerar a
venda pendente. A fila local nunca deve ser limpa antes de confirmar a persistência no servidor.

**Pós:** conferir se as vendas sincronizadas geraram movimento de estoque e recebível.

---

## Escalonamento

| Severidade | Critério | Prazo de resposta | Escalonamento |
|---|---|---|---|
| SEV1 | Sistema fora / dinheiro parado | 15 min | Plantão + responsável técnico |
| SEV2 | Módulo crítico degradado | 1 h | Plantão |
| SEV3 | Funcionalidade isolada | 1 dia útil | Fila normal |

Todo SEV1/SEV2 exige post-mortem em `/observabilidade` com ações e responsáveis.
