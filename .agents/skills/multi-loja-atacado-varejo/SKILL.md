---
name: multi-loja-atacado-varejo
description: Regras de arquitetura para multi-loja com separação de canal operacional (VAREJO_PDV vs ATACADO_INDUSTRIA). Use ao criar/alterar vendas, estoque, financeiro, transferências entre canais e dashboards consolidados.
---

# Multi-Loja: Atacado (Indústria) vs Varejo (PDV)

## Objetivo
Isolar dados operacionais entre Indústria/Atacado e Varejo/PDV, mantendo consolidação em tempo real para o gestor da matriz.

## Regras invioláveis

### 1. Canal Operacional
Toda transação (venda, movimentação de estoque, lançamento financeiro) DEVE ter:
- `loja_id uuid` — filial física ou unidade industrial (FK → `lojas.id`).
- `canal_operacional canal_operacional_enum` — `'VAREJO_PDV' | 'ATACADO_INDUSTRIA'`.

Nunca inserir linha nessas tabelas sem esses dois campos preenchidos.

### 2. Estoque segregado
- Saldo por (produto, loja, canal) na tabela `estoque_lojas`.
- Estoque de um canal NUNCA é consumido pelo outro automaticamente.
- Movimentação entre canais só via `transferencias_canal` (documento formal).

### 3. Vendas / Faturamento
- **Varejo (PDV):** NFC-e, baixa imediata `canal_operacional='VAREJO_PDV'`, caixa da loja.
- **Atacado/Indústria:** NF-e, faturamento a prazo (boleto/30d), `canal_operacional='ATACADO_INDUSTRIA'`.

### 4. Financeiro
- `financeiro_lancamentos` sempre com `canal_operacional` + `loja_id`.
- DRE e conciliação da Indústria separadas do caixa diário das lojas.

### 5. Consolidação (visão gestor)
- Papel `admin_matriz` ignora filtros de `loja_id` / `canal_operacional`.
- Vendedores/operadores de loja só enxergam a própria `loja_id`.
- Dashboards devem suportar 3 modos: **Consolidada**, **Apenas Varejo**, **Apenas Indústria/Atacado**.
- Agregações sempre disponíveis via `GROUP BY canal_operacional, loja_id`.

## Tabelas canônicas

| Tabela | Campos-chave |
|---|---|
| `lojas` | id, company_id, nome, tipo (`industria`/`filial`), cnpj, ativo |
| `estoque_lojas` | produto_id, loja_id, canal_operacional, quantidade, reservado |
| `transferencias_canal` | origem_loja_id, destino_loja_id, status (`pendente`/`em_transito`/`recebido`), itens |
| `financeiro_lancamentos` | loja_id, canal_operacional, tipo (`receber`/`pagar`), valor |
| `vendas` / `orders` | loja_id, canal_operacional |

## Frontend
- Componente global `<CanalFilter />` no topo do dashboard do gestor.
- Store Zustand `useCanalStore` com `{ canal: 'CONSOLIDADO' | 'VAREJO_PDV' | 'ATACADO_INDUSTRIA', lojaId: string | null }`.
- Hooks Supabase leem o store e aplicam `.eq('canal_operacional', ...)` quando ≠ CONSOLIDADO.
- Tela `Matriz de Estoque Global`: pivot produto × loja com saldo por canal.
- Relatórios financeiros: abas separadas "Caixa PDV" e "Faturamento Atacado".

## RLS
- Vendedor de loja: policy filtra `loja_id = get_user_loja_id(auth.uid())`.
- `admin_matriz`: policy libera todas as lojas da própria `company_id`.
- Reutilizar helper `get_user_company_id(auth.uid())` já existente.

## Anti-padrões
- ❌ Query sem `canal_operacional` em tabelas transacionais.
- ❌ Update direto de saldo entre canais sem `transferencias_canal`.
- ❌ Hardcoded `loja_id` no client — sempre vem do store/contexto.
- ❌ Misturar caixa PDV e faturamento atacado no mesmo relatório sem segmentação.
