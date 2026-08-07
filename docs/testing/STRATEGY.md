# Estratégia de Testes — READ & GROW

## 1. Pirâmide de Testes
A plataforma utiliza uma abordagem de pirâmide balanceada:

- **Unitários (Vitest)**: Regras de negócio puras (cálculos financeiros, impostos, validações).
- **Integração (Supabase/Node)**: Validação de RLS, triggers e RPCs.
- **E2E (Playwright)**: Golden Paths (Vendas, Compras, Produção).

## 2. Testes Críticos de Segurança
O teste de isolamento multi-tenant (`tenant-isolation.spec.ts`) é obrigatório e deve validar que dados de uma `company_id` nunca vazam para outra.

## 3. Cobertura Prioritária
- Cálculos de Impostos (ICMS/PIS/COFINS).
- Reserva de Estoque (Race Conditions).
- Permissões de Usuário (RBAC).
