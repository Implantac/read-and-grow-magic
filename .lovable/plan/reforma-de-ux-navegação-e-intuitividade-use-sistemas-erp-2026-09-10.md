# Reforma de UX, navegação e intuitividade — USE SISTEMAS ERP

Objetivo: quem nunca usou o sistema consegue fazer as operações principais sem treinamento. Nada de recurso removido; a complexidade fica escondida atrás de linguagem e caminhos simples.

## O que já auditei

- A navegação tem 8 seções e o menu "Rede & Distribuição" concentra 4 entradas com nomes parecidos: Central de Abastecimento, Painel Gerencial, Torre de Controle, Transferências, Receber Mercadoria. É exatamente a dúvida "qual eu devo usar?".
- Os nomes vêm da estrutura interna do sistema, não da tarefa do usuário.
- A busca do menu e o atalho Ctrl+K existem e funcionam bem — serão mantidos e ampliados.
- O ciclo de transferência (pedir → aprovar → separar → enviar → receber → divergência) já está implementado e funcionando; a reforma é de caminho e linguagem, não de regra de negócio.

## Etapas

### Etapa 1 — Documento de auditoria
- `docs/audits/ux-audit.md` com tabela item / problema / impacto / duplicação / prioridade / solução, classificando P0 a P3.
- `docs/audits/ux-score.md` com nota antes e depois, justificada.

### Etapa 2 — Página inicial orientada a tarefas (P0)
- Bloco "O que precisa da sua atenção?" com contagens reais do banco: lojas em risco de ruptura, transferências aguardando aprovação, mercadorias a receber, transferências atrasadas, sugestões de reposição.
- Cada linha leva à tela certa com o filtro já aplicado. Sem dados reais → estado vazio explicando o motivo.
- Bloco "Ações rápidas": Solicitar reposição, Receber mercadoria, Criar transferência, Consultar estoque, Ver lojas.

### Etapa 3 — Navegação por tarefa (P0)
- Renomear entradas para a pergunta do usuário: Reposição, Transferências, Receber mercadoria, Lojas, Estoque, Pendências.
- Agrupar a sobreposição atual em "Abastecimento" com um painel único e abas, mantendo as telas existentes por trás.
- Manter as rotas antigas funcionando por redirecionamento; nenhum link quebra.

### Etapa 4 — Central de pendências (P0)
- Tela única "O que precisa da sua atenção?" por severidade (crítico, atenção, pendência, informação), cada item com botão Resolver que abre a ação certa.

### Etapa 5 — Linguagem e estados padronizados (P1)
- Vocabulário único de botões (Criar, Salvar, Aprovar, Rejeitar, Enviar, Receber, Cancelar).
- Um único conjunto de estados visuais (Rascunho, Solicitado, Aguardando aprovação, Em preparação, Expedido, Em trânsito, Concluído, Com divergência, Cancelado), com ícone e texto — nunca só cor.
- Bloco "Próxima ação" nas telas de transferência e recebimento.

### Etapa 6 — Busca global (P1)
- Ctrl+K passa a encontrar também produtos, clientes, pedidos, transferências e lojas, com o tipo do resultado visível, além de executar ações diretas ("receber mercadoria", "nova transferência").

### Etapa 7 — Testes e entrega
- Varredura autenticada das telas alteradas, com verificação das 10 tarefas do teste de usuário novo.
- Relatório final com antes/depois, arquivos alterados, testes e pendências reais.

## Detalhes técnicos

- Frontend: `src/config/navigation/*`, `src/core/layout/Sidebar`, `CommandPalette.tsx`, `Breadcrumbs`, nova página de pendências, novos componentes compartilhados `StatusBadge`, `ActionCard`, `Timeline`, `NextActionBar` em `src/shared/components`.
- Dados: apenas consultas de leitura sobre tabelas já existentes (`stock_transfer_orders`, `stock_balances`, saldos e sugestões de reposição). Nenhuma tabela nova, nenhuma regra de negócio alterada.
- Rotas antigas ganham `Navigate` para as novas, preservando links salvos.

## Fora desta entrega

Onboarding guiado de primeira configuração e refino mobile profundo entram depois das etapas P0/P1, por dependerem do resultado dos testes com as telas já reorganizadas.
