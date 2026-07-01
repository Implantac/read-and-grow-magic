# ADR-0002 — Conciliação Bancária Avançada (Matching Engine)

**Data:** 2026-07-01 · **Status:** Aceito · **Domínio:** Financial

## Contexto
`BankReconciliation.tsx` hoje faz match manual 1-a-1. Precisamos evoluir para um motor que sugere reconciliações automáticas com score, aprendendo regras por tenant.

## Decisão
Sprint aditiva, sem quebrar a UI atual:

1. **`bank_match_rules`** (por `company_id`): regras opcionais que ajustam pesos e whitelists (ex.: "descrição contém X → categoria Y").
2. **RPC `bank_reconcile_auto(p_bank_account_id, p_date_from, p_date_to)`**: para cada `bank_transactions.status='pending'` do tenant, procura candidatos em `cash_flow_entries` no intervalo ±3 dias com |Δvalor| ≤ R$ 0,01 e calcula score:
   - **valor exato**: 50 pts
   - **data exata**: 25 pts, ±1 dia: 15, ±3 dias: 5
   - **similaridade descrição** (bigrams, 0–1) × 20 pts
   - **regra tenant match**: +10 pts (boost) por regra ativa
   Score ≥ 70 → auto-match (grava `matched_entry_id`, marca `reconciled`). Score 40–69 → **sugestão** persistida em `bank_match_suggestions`. < 40 descartado.
3. **UI**: novo botão **"Conciliar automaticamente"** em `BankReconciliation.tsx` + `AutoMatchDialog` com lista de sugestões (aceitar/rejeitar).

## Consequências
- Aditivo, RLS por `company_id`, sem alteração de contratos existentes.
- Score explicável (retornado no JSON — cada componente pontuado).
- Regras futuras (ML) plugam por peso sem refactor.

## Review Loop
- **Arq**: função SECURITY DEFINER com verificação de tenant ✔
- **QA**: threshold conservador (70) evita falsos positivos; sugestões requerem aprovação humana ✔
- **Seg**: RLS + `EXECUTE` restrito a `authenticated` do próprio tenant ✔
- **Negócio**: reduz tempo de fechamento mensal; explicabilidade preserva confiança ✔
