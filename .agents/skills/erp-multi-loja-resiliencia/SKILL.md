---
name: erp-multi-loja-resiliencia
description: Regras de arquitetura para ERP multi-loja com canais VAREJO_PDV vs ATACADO_INDUSTRIA — RLS por loja, ledger imutável de estoque, PDV offline-first e idempotente, compliance NFC-e/NF-e, filtros globais de canal e UX por teclado.
---

# Arquitetura ERP Multi-Loja, Canais de Venda Segregados e Resiliência Operacional

Aplique esta skill em qualquer feature que toque PDV, estoque, financeiro, dashboard consolidado ou frente de caixa deste ERP.

## 1. Arquitetura de Dados & Multi-Tenancy (Supabase)

- **Isolamento lógico**: toda tabela transacional (vendas, estoque, financeiro, notas) DEVE conter `loja_id uuid` (FK → `branches.id`) e `canal_operacional canal_operacional_enum` (`'VAREJO_PDV' | 'ATACADO_INDUSTRIA'`). Nunca insira linha sem esses dois campos.
- **RLS por loja**: vendedores/operadores só enxergam dados com `loja_id = get_user_branch_id(auth.uid())`. Perfis com `admin_matriz` (ou `is_matriz_viewer(auth.uid()) = true`) fazem bypass e enxergam a rede toda dentro do próprio `company_id`.
- **Ledger imutável de estoque**: proibido `UPDATE` direto em saldos. Toda mudança física passa por `stock_movements` (`id, product_id, loja_id, canal_operacional, quantidade, tipo_movimentacao, usuario_id, created_at`) — extrato bancário do estoque. Saldo em `stock_balances` é sempre reflexo de trigger sobre o ledger. Transferência entre canais só via `transferencias_canal` (documento formal).

## 2. Resiliência e Idempotência (Frente de Caixa / PDV)

- **Offline-first**: catálogo de produtos, preços e formas de pagamento espelhados no IndexedDB do navegador. Vendas feitas com rede instável ficam com `sincronizado = false` e são reenviadas em background.
- **Idempotência**: o frontend gera o `UUID` da venda ANTES do envio e usa-o como PK no Supabase. Cliques duplos, reenvios ou retries de rede colidem em `ON CONFLICT DO NOTHING` — nunca duplicam venda.
- **Compliance fiscal por canal**:
  - `VAREJO_PDV` → **NFC-e** (mod. 65) com contingência offline (fila local, transmite quando volta rede).
  - `ATACADO_INDUSTRIA` → **NF-e mod. 55**, exige autorização online **antes** de liberar carga/expedição. Sem protocolo autorizado, WMS/TMS não libera o pedido.

## 3. Usabilidade (shadcn/ui + Tailwind, tokens semânticos)

- **Sidebar adaptativa**: oculta módulos sem permissão para o perfil logado (`Can`/`usePermission`). Nada de item cinza "sem acesso".
- **Filtro global síncrono**: cabeçalho do dashboard usa `<CanalFilter />` (Select persistido em `useCanalStore`) com 3 modos — **Rede Completa (CONSOLIDADO)**, **Canal** (`VAREJO_PDV` | `ATACADO_INDUSTRIA`), **Filial específica** (`loja_id`). Todos os hooks de KPI/Recharts reagem ao store.
- **PDV 100% teclado**: F1–F6 formas de pagamento, F7 suspender, F8 retomar, F9 desconto, F10 cliente, F12 finalizar, Esc limpa. Foco automático e persistente no campo de leitura de código de barras. Tap targets ≥ 44×44 em mobile.
- **Tokens semânticos sempre**: `bg-primary`, `text-foreground`, `bg-destructive`. Proibido `text-white`, `bg-[#...]` em componentes — quebra o Dark Mode Premium do projeto.

## Anti-padrões

- ❌ Query em tabela transacional sem `canal_operacional` / `loja_id`.
- ❌ `UPDATE stock_balances` direto sem passar por `stock_movements`.
- ❌ PDV enviando venda sem UUID pré-gerado.
- ❌ NF-e mod. 55 liberando expedição antes do protocolo autorizado.
- ❌ Dashboard com filtro de canal desacoplado dos hooks de dados.
- ❌ `loja_id` hardcoded no client — sempre vem do `useCanalStore` / contexto do usuário.

## Reuso obrigatório

`useCanalStore`, `<CanalFilter />`, `useBranches`, `get_user_branch_id`, `is_matriz_viewer`, `stock_movements`, `transferencias_canal`, `PDVDialog`, `useNFCe`, `toastError`.
