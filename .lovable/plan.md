# Plano de Evolução ERP Enterprise — READ & GROW

Este plano detalha a transição do sistema para uma arquitetura de ecossistema integrado, orquestrado e rastreável, conforme a diretriz da Software House Enterprise.

## 1. Auditoria e Diagnóstico (FASE 0)

### Arquitetura Atual (Diagnóstico)
*   **Fundação**: Baseada em domínios isolados com comunicação via `EventBus`. RLS ativado via Supabase.
*   **Core**: `EnterpriseContext` estabilizado para evitar loops (React Error #185).
*   **Inventory**: Implementado como SSOT funcional, mas com brechas para ajustes sem correlação completa.
*   **Workflow**: Transferências operam via estados, mas a integração com Fiscal/Financeiro é reativa, não orquestrada.

### Arquitetura Alvo
*   **Orquestração Central**: Passar de "Módulos que reagem" para "Processos que orquestram".
*   **Rastreabilidade Total**: Implantação obrigatória de `correlation_id` em toda a cadeia O2C e P2P.
*   **UX Task-Oriented**: Consolidação do cockpit "Minha Loja" e "Central de Gestão".

## 2. P1 — Core & Contratos (Blindagem e Políticas)

### 2.1 Policy Engine Centralizado
*   Mover configurações como `allowNegativeStock`, `autoAdjustmentThreshold` e `replenishmentMethod` para um `PolicyEngine` no Core.
*   Garantir que os domínios consultem o Core antes de executar ações críticas.

### 2.2 Padronização de Auditoria
*   Expandir `correlation_id` para todos os logs de auditoria e movimentos de ledger.
*   Implementar `causation_id` para rastrear eventos filhos (ex: NF-e gerada por uma Transferência).

## 3. P2 — Inventory SSOT (Imutabilidade)

*   **Ledger Logístico**: Blindar a tabela `supply_chain_ledger` contra inserções manuais; apenas via RPCs ou Triggers autorizados.
*   **Kardex Unificado**: Criar uma view consolidada que mostre o histórico físico, fiscal e financeiro de um SKU.

## 4. P3 — Store Operations (Minha Loja)

*   **Cockpit Operacional**: Transformar `StoreCentral` na tela principal do operador de loja.
*   **Central de Exceções**: Implementar o motor que identifica rupturas, atrasos e divergências, apresentando "Ações" em vez de "Dados".

## 5. P4 — Logistics & WMS (Workflow Total)

*   **Picking Waves**: Integrar o WMS diretamente no workflow de transferências e vendas.
*   **Divergência Automática**: Gerar workflows de inspeção quando o recebimento físico ≠ esperado.

## Detalhes Técnicos
*   **Segurança**: RLS em nível de Tenant e Filial.
*   **Performance**: Uso de `requestAnimationFrame` para navegações pós-evento para evitar bloqueio de UI.
*   **Qualidade**: Cobertura de testes em orquestradores críticos.
