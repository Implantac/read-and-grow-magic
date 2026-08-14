# Plano: Inteligência e Auditoria de Abastecimento Read & Grow

Este plano expande o motor logístico para incluir suporte a curvas de demanda, saúde de lojas e regras de auditoria/aprovação automática.

## Camada de Dados (Database)

1.  **Novas Estruturas**:
    *   Enum `demand_curve`: Classificação de giro (`HIGH`, `MEDIUM`, `LOW`, etc.).
    *   Tabela `store_health_metrics`: Histórico de performance de cada unidade (score, rupturas, acuracidade).
    *   Tabela `stock_transfer_divergences`: Registro detalhado de perdas e erros de conferência.
    *   Tabela `auto_approval_policies`: Regras para aprovação automática de transferências seguras (baixo valor/volume).

## Camada de Aplicação (Frontend)

1.  **Mapa de Saúde**:
    *   Implementar `src/modules/operational/network/StoreHealthMap.tsx` para visualização estratégica do ranking da rede.
2.  **Motor de Estoque (Engine)**:
    *   Expandir `stockEngine.ts` para suportar cálculos de excesso e visibilidade de curva ABC.
3.  **Auditoria Operacional**:
    *   Integrar o Mapa de Saúde na Torre de Controle de Abastecimento.
    *   Preparar o workflow de transferências para registrar divergências na nova tabela.

## Próximos Passos
*   Implementar lógica de "Aprovação Automática" baseada em IA e políticas.
*   Criar painel de auditoria de divergências para o gestor financeiro/logístico.
