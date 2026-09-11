# Matriz de rastreabilidade crítica

Esta matriz é o registro canônico entre fluxo, entrada, autorização e evidência automatizada. Uma linha sem teste real permanece **Pendente**.

| Fluxo | Entrada principal | Escopo obrigatório | Evidência atual | Estado |
|---|---|---|---|---|
| Isolamento multiempresa | Autenticação | `company_id` | `tests/e2e/tenant-isolation.spec.ts` | Implementado; requer duas contas CI |
| Transferência entre unidades | Rede → Transferências | `company_id`, origem, destino, `correlation_id` | teste unitário do workflow | Parcial |
| Transferência → NF-e | Minha Loja / Rede | empresa, filial, `correlation_id` | `tests/e2e/logistic-fiscal-correlation.spec.ts` | Implementado; requer fixture real |
| Order-to-Cash | Comercial → Pedidos | empresa, filial, canal | `tests/e2e/sales-golden-path.spec.ts` | Pendente; placeholder bloqueado no backlog |
| Procure-to-Pay | Compras → Pedidos | empresa, filial | `tests/e2e/purchase-golden-path.spec.ts` | Pendente; placeholder bloqueado no backlog |
| Produção | PCP → Ordens | empresa, filial | `tests/e2e/production-golden-path.spec.ts` | Pendente; placeholder bloqueado no backlog |
| PDV | PDV | empresa, filial, canal e caixa | sem E2E completo | Pendente |

## Regra de atualização

- Não alterar **Pendente** para concluído sem execução determinística no CI.
- Testes não podem retornar cedo ou aprovar uma constante.
- Toda evidência de fluxo crítico deve confirmar o registro final e seu `correlation_id` quando aplicável.