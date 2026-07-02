
# Etapa 1 — Cadastro Dinâmico de Clientes (PF/PJ)

Evolução do cadastro atual em `public.clients` (38 colunas já existentes, incluindo `document`, `document_type`, `address_*`, `state_registration`) sem migração destrutiva. Camada de UI reativa + serviços de enriquecimento por cima.

---

## 1. [Visão do PM] — Regra de negócio e ganho operacional

**Problema hoje**
- Formulário único genérico: vendedor preenche campos irrelevantes (IE, razão social, nome fantasia) mesmo em PF.
- Digitação manual de CNPJ, razão social, endereço → alta taxa de erro cadastral, retrabalho no fiscal (NF-e rejeitada por endereço divergente).
- Sem validação de duplicidade de documento.

**Regra otimizada**
1. Escolha do tipo (PF/PJ) é o **primeiro e único gatilho** — o formulário se reorganiza a partir dela.
2. PJ: digitar CNPJ dispara consulta automática (BrasilAPI → Receita) e preenche razão social, fantasia, IE, endereço, CNAE, situação cadastral.
3. PF: campos exclusivos (RG, data de nascimento, gênero) aparecem; campos PJ desaparecem.
4. CEP dispara ViaCEP e preenche logradouro, bairro, cidade, UF (usuário só digita número + complemento).
5. Bloqueio de duplicidade: mesmo `document` já cadastrado na empresa → sugere abrir cadastro existente.
6. Situação cadastral "Inapta/Suspensa" na Receita → aviso amarelo, não bloqueia (decisão comercial).

**Ganho**
- Tempo médio de cadastro: **~4 min → ~40s** (estimativa: 8 campos digitados vs. 2).
- Redução de rejeição de NF-e por endereço/razão social divergente.
- Base fiscal íntegra desde a origem → impacto direto em SPED, Reinf e faturamento.

---

## 2. [Visão do UX/UI] — Comportamento dinâmico

**Fluxo em uma tela, 3 seções colapsáveis** (evita wizard multi-etapa desnecessário):

```text
┌────────────────────────────────────────────────────┐
│ [ PF ]  [ PJ ]     ← toggle grande, primeira ação  │
├────────────────────────────────────────────────────┤
│ IDENTIFICAÇÃO                                      │
│  CNPJ [__.___.___/____-__]  🔍  ← autofill        │
│  Razão Social ........... (auto)                   │
│  Nome Fantasia .......... (auto)                   │
│  IE [____]  IM [____]  Situação: ✅ Ativa          │
├────────────────────────────────────────────────────┤
│ CONTATO                                            │
│  E-mail  ·  Telefone  ·  Celular                   │
├────────────────────────────────────────────────────┤
│ ENDEREÇO                                           │
│  CEP [_____-___] 🔍   Número [__]  Compl.          │
│  Rua/Bairro/Cidade/UF (auto, editável)             │
├────────────────────────────────────────────────────┤
│ COMERCIAL (colapsado por padrão)                   │
│  Limite crédito · Cond. pagto · Tabela · Vendedor  │
└────────────────────────────────────────────────────┘
```

**Regras de exibição condicional**
- Toggle **PJ** → mostra: Razão Social, Nome Fantasia, IE, IM, CNAE, Situação Receita.
- Toggle **PF** → mostra: Nome, RG, Data Nascimento, Gênero. Oculta IE/IM/Razão.
- Campos preenchidos por API vêm com badge **"auto"** cinza; editáveis com 1 clique.
- Loading inline no ícone 🔍 (spinner) durante fetch — sem modal, sem bloqueio da tela.
- Duplicidade → toast + botão "Abrir cadastro existente" (não força).

**Redução de cliques**: 1 clique (PF/PJ) + 2 buscas automáticas (CNPJ, CEP) substituem ~15 tabs manuais.

---

## 3. [Visão do Tech Lead] — Engenharia

### 3.1 Banco (aditivo, sem breaking change)

Migration única em `clients`:
- `person_type text` (`PF`|`PJ`, default `PJ`, backfill via `length(document)`)
- `rg text`, `birth_date date`, `gender text` (PF)
- `cnae_primary text`, `cnae_description text`, `receita_status text`, `receita_status_date date`, `receita_synced_at timestamptz` (PJ enriquecido)
- `UNIQUE (company_id, document) WHERE document IS NOT NULL` — bloqueia duplicidade por tenant.
- Índice `idx_clients_document_company` para o lookup de duplicidade.

### 3.2 Enriquecimento (Edge Functions, não expor API externa direto do browser)

Duas edge functions novas, ambas com CORS, JWT em código, rate-limit simples por IP:

**`lookup-cnpj`** — `POST { cnpj }`
- Valida CNPJ (14 dígitos + dígito verificador).
- Cache-first: `SELECT * FROM clients WHERE document=$1 AND receita_synced_at > now()-'7 days'` → devolve.
- Chama `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` (fallback `receitaws.com.br`).
- Retorna JSON normalizado `{ razao_social, fantasia, ie, endereco, cnae, situacao }`.

**`lookup-cep`** — `POST { cep }`
- Valida CEP (8 dígitos).
- Chama `https://viacep.com.br/ws/{cep}/json/` (fallback `brasilapi/cep/v2`).
- Retorna `{ logradouro, bairro, cidade, uf, ibge }`.

Sem chaves privadas (APIs públicas) → nenhum secret novo.

### 3.3 Frontend

Novo componente `<PersonTypeToggle />` + refactor de `ClientFormDialog` (que hoje é único e estático) para render condicional guiado por `person_type`.

Hooks:
- `useCnpjLookup(cnpj)` — React Query, `enabled: cnpj.length === 14`, `staleTime: 7d`.
- `useCepLookup(cep)` — idem, `enabled: cep.length === 8`.
- `useClientDuplicateCheck(document, companyId)` — query direta ao Supabase.

Validação com **zod** por variante (`clientPFSchema` / `clientPJSchema`) via `discriminatedUnion('person_type')`.

### 3.4 Backfill seguro

Uma execução idempotente na migration:
```sql
UPDATE clients
   SET person_type = CASE
     WHEN length(regexp_replace(coalesce(document,''),'\D','','g')) = 11 THEN 'PF'
     ELSE 'PJ' END
 WHERE person_type IS NULL;
```

### 3.5 Entregáveis desta etapa

| # | Item | Local |
|---|------|-------|
| 1 | Migration aditiva + índice único + backfill | `supabase/migrations/*` |
| 2 | Edge function `lookup-cnpj` | `supabase/functions/lookup-cnpj/index.ts` |
| 3 | Edge function `lookup-cep` | `supabase/functions/lookup-cep/index.ts` |
| 4 | Hooks `useCnpjLookup`, `useCepLookup`, `useClientDuplicateCheck` | `src/hooks/commercial/` |
| 5 | `PersonTypeToggle` + refactor `ClientFormDialog` dinâmico | `src/modules/commercial/clients/` |
| 6 | Schemas zod PF/PJ com `discriminatedUnion` | `src/modules/commercial/clients/schema.ts` |

### 3.6 Critérios de aceite
- Preencher CNPJ válido → 8 campos autocompletam em <2s.
- Preencher CEP → 4 campos autocompletam em <1s.
- Toggle PF esconde IE/IM/Razão sem perder dados já digitados.
- Segundo cadastro com mesmo CNPJ na mesma empresa é bloqueado com atalho para o registro existente.
- Cadastro existente antigo continua abrindo sem erro (backward compatible).

---

**Aguardo aprovação para iniciar a implementação da Etapa 1.** Após entrega e seu OK, avançamos para a Etapa 2 (Cadastro Universal de Produtos).
