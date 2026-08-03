# Backup, Restore e Teste de Carga

Última revisão: 2026-08-03

## 1. Backups

| Item | Estratégia | Retenção |
|---|---|---|
| Banco (Postgres) | Backup diário automático + PITR do provedor | Diário: 7 dias · PITR: 7 dias |
| Storage (XMLs, PDFs, certificados) | Réplica do bucket | 5 anos para documentos fiscais (art. 16 II LGPD) |
| Segredos (cofre) | Fora do banco; inventário versionado neste repositório (sem valores) | — |
| Código e migrações | Git | Permanente |

Documentos fiscais **não** podem ser removidos por solicitação de exclusão LGPD — são
anonimizados nos dados pessoais e retidos pelo prazo legal.

## 2. Ensaio de restauração (trimestral)

Objetivo: provar RTO ≤ 4 h e RPO ≤ 15 min.

1. Escolher um ponto no tempo ~1 h atrás e restaurar para um projeto **separado**.
   Nunca restaurar por cima do ambiente de produção.
2. Apontar uma cópia local do app para o banco restaurado (variáveis de ambiente locais).
3. Checklist de validação:
   - login e troca de tenant funcionam;
   - `/dashboard` carrega KPIs com dados;
   - contagem de linhas de `orders`, `stock_movements`, `accounts_receivable` compatível com o ponto escolhido;
   - último `stock_movements.created_at` dentro da janela de RPO;
   - `scripts/rls-static-check.mjs` sem falhas.
4. Registrar no ensaio: horário de início, horário de app utilizável, RPO real observado.
5. Encerrar o projeto de restauração e anexar o resultado ao histórico de ensaios.

Falha em qualquer item do passo 3 vira SEV2 com ação corretiva.

## 3. Teste de carga

Script: `scripts/load-test.mjs` (sem dependências, usa `fetch` nativo).

```bash
LOAD_URL=https://<app>/ LOAD_CONC=20 LOAD_REQS=400 node scripts/load-test.mjs
```

Mede p50/p90/p95/p99, taxa de erro e throughput. Metas de aceite:

| Métrica | Meta |
|---|---|
| p95 da carga inicial do app | ≤ 2 s |
| Taxa de erro | ≤ 0,5 % |
| p95 das rotas públicas (vitrine/NPS) | ≤ 1,5 s |

Rodar antes de cada onboarding de tenant grande e após mudanças em consultas de alto volume.

## 4. Ordem de recuperação em desastre

1. Restaurar banco no ponto mais recente saudável.
2. Reapontar variáveis de ambiente e segredos.
3. Subir o app e validar login + dashboard.
4. Reprocessar filas: PDV offline, transmissões fiscais pendentes, webhooks de cobrança.
5. Conciliar estoque (`/estoque/auditoria`) e financeiro (conciliação bancária) do período afetado.
6. Comunicar clientes e abrir post-mortem.
