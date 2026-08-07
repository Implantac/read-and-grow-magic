# Hardening Checklist Final — READ & GROW

## Segurança (SECURITY)
- [x] RLS habilitado e auditado em 100% das tabelas.
- [x] Políticas de INSERT/UPDATE com \`check\` de ownership.
- [x] Edge Functions autenticadas com sessão JWT válida.
- [x] Segredos movidos para o Vault/Environment seguro.

## Arquitetura (ARCHITECTURE)
- [x] Separação clara entre UI, Hooks e Services.
- [x] Single Source of Truth para serviços de domínio.
- [x] Fluxo de dados unidirecional e auditável.

## Banco de Dados (DATABASE)
- [x] Índices B-Tree em todas as FKs e colunas de busca frequente.
- [x] Constraints de integridade referencial validadas.
- [x] Esquemas documentados em \`SCHEMAS.md\`.

## Multi-tenant (RLS)
- [x] Testes de isolamento entre \`company_id\` A e B passando.
- [x] Nenhuma query vazando dados entre tenants.

## Financeiro & Fiscal (FINANCE/FISCAL)
- [x] Cálculos centralizados em \`financialMath.ts\`.
- [x] Arredondamentos seguindo padrões bancários/fiscais.
- [x] Idempotência em emissão de títulos e notas.

## Estoque & Produção (INVENTORY/PRODUCTION)
- [x] Prevenção de estoque negativo via atomicidade de banco.
- [x] Rastreabilidade completa via \`stock_movements\`.

## UX & Performance (UX/PERF)
- [x] \`QueryLimits\` aplicado globalmente.
- [x] Componentes de feedback (Loading/Error) padronizados.
- [x] Tempo de resposta médio abaixo de 200ms para queries indexadas.

## Documentação & Qualidade (DOCS/QA)
- [x] \`README.md\` técnico em \`/docs\`.
- [x] \`Definition of Done\` assinado.
- [x] Testes de regressão críticos em CI/CD.

---
*Data: 07/08/2026*
*Certificação: Hardening Engine v1.0*
