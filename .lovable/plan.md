# Plano de Implementação: Store Management 2.0 (Minha Loja)

Este plano detalha a evolução do cockpit operacional "Minha Loja" para se tornar o centro de comando do ERP Enterprise, focando em inteligência prescritiva e automação.

## 1. Visão Geral (Minha Loja 2.0)
Transformar a experiência do gestor de loja de um visualizador de dados para um executor de tarefas guiado por IA e regras de negócio centralizadas.

## 2. Componentes Estruturais
- **Camada Prescritiva**: Alertas que não apenas mostram problemas, mas sugerem a melhor ação (ex: "Ruptura prevista -> Transferir da Loja X").
- **Mapa de Estoque da Rede**: Visualização da saúde do estoque em relação aos vizinhos e CD para suporte à decisão rápida.
- **Orquestração de Tarefas (StoreOrchestrator)**: Motor que gera automaticamente tarefas operacionais críticas com base em análise de estoque e pedidos.
- **Auditoria Cíclica Inteligente**: Sugestão automática de SKUs para contagem baseada em risco e giro.

## 3. Detalhes Técnicos

### Backend & Lógica
- **`replenishmentEngine.ts`**: Implementação do motor de origem inteligente (CD -> Rede -> Compra).
- **`StoreOrchestrator.ts`**: Hook de orquestração que monitora movimentações de estoque e gera `operational_tasks` proativas.
- **`InventoryOrchestrator.ts`**: Reforço da SSOT para garantir que toda ação gerada no cockpit preserve a rastreabilidade imutável (`correlation_id`).

### Frontend & UX
- **`StoreCentral.tsx`**: Novo layout com hierarquia de "Estado da Operação" e cartões prescritivos.
- **`NetworkMap.tsx`**: Visualização tática do estoque na malha logística.
- **`PrescriptiveAlert.tsx`**: Componente de feedback proativo com botão de ação direta.

## 4. Próximos Passos (Aprovação Necessária)
- [x] Implementação dos motores de recomendação (`replenishmentEngine`).
- [x] Criação dos componentes visuais de suporte (`NetworkMap`, `PrescriptiveAlert`).
- [x] Integração do `StoreOrchestrator` no ciclo de vida da aplicação.
- [ ] Validação do fluxo de "Aprovação de Sugestão" direto na interface.
- [ ] Expansão dos alertas fiscais para exibir NF-e geradas automaticamente por transferências.
