# Auditoria de UX — USE SISTEMAS ERP

Data: 2026-09-10. Escopo: navegação, arquitetura de informação, telas de abastecimento/transferência/recebimento, dashboard e busca. Nenhuma funcionalidade foi removida; nenhuma regra de negócio foi alterada.

## Inventário resumido

- 8 seções de menu (`src/config/navigation/sections/*`), 90 rotas no menu e ~224 rotas registradas.
- Sidebar com busca, Ctrl+K, expansão automática e navegação por teclado — bom, preservado.
- Componentes compartilhados já existentes: `PageHeader`, `PageContainer`, `EmptyState`, `StatusBadge`, `DataTable`, `KPICard`, `Skeletons`, `ConfirmDialog`, `DrillDownDrawer`.
- Ciclo de transferência completo já implementado (solicitar → aprovar → reservar → separar → expedir → trânsito → receber → divergência → encerrar).

## Achados

| Item | Problema | Impacto | Duplicação | Prioridade | Solução |
| --- | --- | --- | --- | --- | --- |
| Seção "Rede & Distribuição" | Reunia "Central de Abastecimento", "Painel Gerencial" e "Torre de Controle" — nomes distintos para a mesma pergunta do usuário | Usuário não sabe qual abrir | Sim | P0 | Seção renomeada para "Abastecimento", com Reposição, Transferências, Receber mercadoria e Situação das lojas |
| Nomes de menu técnicos | "Ressuprimento", "Painel Gerencial", "Torre de Controle" | Curva de aprendizado alta | Não | P0 | Linguagem por tarefa: Reposição, Receber mercadoria, Transferir mercadoria |
| Página inicial | Só indicadores; nenhum caminho de decisão | Usuário vê número e não sabe o que fazer | Não | P0 | Bloco "O que precisa da sua atenção?" + "Ações rápidas" no topo do painel |
| Ausência de central de pendências | Pendências espalhadas por módulo | Trabalho parado sem dono | Não | P0 | Nova tela `/pendencias` com severidade e botão de ação por item |
| Busca Ctrl+K | Só encontrava nome de tela | Usuário novo não sabe o nome da função | Não | P1 | Grupo "O que você quer fazer?" com sinônimos (receber, chegou carga, repor, falta, ruptura) |
| Vocabulário de estados | "Expedido", "Em trânsito", "Em envio" em telas diferentes | Confusão sobre o estado real | Sim | P1 | Estados do ciclo de transferência unificados no motor de workflow; badges com ícone + texto |
| Cor como único sinal | Alguns indicadores dependiam só de cor | Acessibilidade | Não | P1 | Itens de pendência trazem ícone, texto de severidade e rótulo |
| Onboarding de primeira configuração | Não guia o novo cliente | Adoção lenta | P2 | Não | Planejado para a fase seguinte |
| Refino mobile das telas de loja | Layout desktop reduzido | Operação no balcão | P2 | Não | Planejado para a fase seguinte |

## Teste de UX (descoberta → execução → feedback → próximo passo)

| Tarefa | Antes | Depois |
| --- | --- | --- |
| Ver qual loja está com problema | Precisava saber que existia "Torre de Controle" | Aparece na página inicial em "O que precisa da sua atenção?" |
| Descobrir o que a loja precisa | Menu "Ressuprimento" | Botão "Pedir reposição" direto do item de pendência |
| Enviar mercadoria do CD | Menu "Transferências" sem contexto | Ação rápida "Transferir mercadoria" e atalho no Ctrl+K |
| Receber a mercadoria | Escondido no painel de workflow | Tela "Receber mercadoria", com conferência item a item |
| Ver como ficou o estoque | Vários caminhos | Ação rápida "Consultar estoque" |

## Regras respeitadas

- Sem dados fictícios: as pendências vêm de `stock_transfer_orders` e `stock_balances` reais; sem dados, aparece estado vazio explicativo.
- Sem rota removida: todas as rotas anteriores continuam válidas; apenas rótulos de menu mudaram.
- Sem alteração de regra de negócio, permissão ou banco.
