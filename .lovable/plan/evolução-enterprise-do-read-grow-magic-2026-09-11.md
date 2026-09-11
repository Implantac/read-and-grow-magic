# Evolução enterprise do Read & Grow Magic

## Objetivo
Executar o plano recebido de forma incremental, sem reconstruir o ERP e sem considerar uma área concluída antes de validar segurança, dados e fluxos reais.

## Diagnóstico inicial confirmado
- O projeto já possui módulos amplos, migrations, controle por empresa, suíte de regressão e testes de fluxos críticos.
- O teste E2E de isolamento entre empresas ainda é apenas um placeholder (`expect(true)`), portanto não comprova o requisito P0.
- O teste logístico-fiscal pode encerrar sem validar o fluxo quando não encontra dados, então ainda não comprova rastreabilidade ponta a ponta.
- A suíte local reúne lint, tipos, testes, RLS e build, mas a checagem RLS é ignorada quando falta a conexão de teste e o workflow E2E não cobre toda essa sequência.
- Existem chamadas diretas ao banco em telas, muitos casts sem tipo nas áreas críticas e arquivos operacionais grandes; a consolidação arquitetural será gradual para evitar regressões.

## Execução

### 1. Baseline reproduzível e governança P0
- Gerar inventário atual de rotas, páginas, funções, migrations, tabelas, RPCs, políticas e testes.
- Criar matriz rastreável `rota → página → menu → permissão → teste` e backlog único P0–P2.
- Registrar resultados reais de lint, tipos, testes, análise RLS, build, E2E e dependências, sem mascarar etapas ignoradas.
- Unificar os gates no CI na ordem: lint → tipos → unitário/integração → RLS → build → E2E → segurança.

### 2. Segurança multiempresa, filial e canal P0
- Adotar `company_id → branch_id → canal_operacional` como escopo canônico, mantendo compatibilidade com dados existentes.
- Inventariar e corrigir somente lacunas comprovadas em RLS, grants, RPCs privilegiadas e funções com privilégios elevados.
- Derivar empresa e permissões da sessão no lado protegido; rejeitar tentativas de trocar escopo pelo payload.
- Substituir o teste placeholder por cenários negativos reais entre duas empresas, filiais, papéis e canais.

### 3. Estoque e ledger P0
- Mapear todas as rotas que alteram saldos, reservas, trânsito, cancelamentos e devoluções.
- Fazer toda mutação crítica passar pelo ledger oficial, com empresa, filial, canal, origem, usuário e `correlation_id`.
- Aplicar idempotência e transações aos fluxos de reserva, transferência, faturamento, cancelamento e devolução.
- Validar reconstrução de saldo, ausência de ajustes silenciosos e impossibilidade de duplicação por reprocessamento.

### 4. PDV, fiscal e financeiro P0/P1
- Fortalecer o PDV offline existente: identificador prévio, persistência local, fila, retry idempotente e reconciliação sem venda duplicada.
- Separar e validar os ciclos de NFC-e, NF-e, NFS-e, CT-e, MDF-e e Reinf sem criar módulos paralelos.
- Garantir emissão fiscal, baixa de estoque, caixa e títulos financeiros de forma atômica e rastreável.
- Implementar testes para retry fiscal, fechamento de período, PIX/chargeback, estornos e títulos únicos.

### 5. Consolidação arquitetural e tipagem P1
- Consolidar gradualmente contexto de sessão, empresa, filial, canal e permissões.
- Padronizar `Tela → Hook → Serviço → função protegida → RLS → auditoria` nos domínios críticos.
- Remover chamadas diretas das telas e reduzir casts sem tipo por domínio, começando em estoque, PDV, fiscal e financeiro.
- Dividir arquivos operacionais grandes sem alterar comportamento ou rotas públicas.

### 6. E2E críticos e proteção contra regressão
- Tornar reais e determinísticos os fluxos O2C, P2P, Produção, PDV e isolamento multiempresa.
- Proibir testes que “passam” por ausência de dados; cada fluxo deve preparar, executar e conferir seus próprios registros.
- Validar `correlation_id` do documento de origem até estoque, fiscal e financeiro.
- Bloquear entrega quando qualquer gate crítico falhar.

### 7. Performance, UX, IA e produção
- Paginar consultas críticas, remover leituras amplas, criar índices comprovados por plano de execução e medir latência.
- Manter a navegação orientada a tarefas, com permissões, estados vazios, carregamento, erros, responsividade e PT-BR.
- Garantir confirmação humana, rastreabilidade, limites e isolamento para ações da IA.
- Executar checklist de produção: backup/restauração, rollback, observabilidade, carga, runbooks, fiscal e E2E verdes.

## Primeiro incremento após aprovação
1. Criar o baseline versionado e a matriz de rastreabilidade.
2. Corrigir o pipeline para expor etapas ignoradas e executar a regressão completa.
3. Substituir o falso teste de isolamento por um teste negativo real e determinístico.
4. Tornar o E2E logístico-fiscal incapaz de passar sem executar e conferir o fluxo.
5. Entregar relatório com evidências, falhas encontradas e próximo lote P0.

## Critérios de conclusão
- Nenhum dado atravessa empresa, filial ou canal.
- Toda alteração de estoque é auditável e idempotente.
- Vendas, documentos fiscais e títulos financeiros não duplicam em retry.
- O2C, P2P, Produção, PDV e isolamento possuem E2E real e estável.
- O CI bloqueia regressões e não omite silenciosamente verificações obrigatórias.
- Rotas, permissões, documentação e testes permanecem sincronizados.
- Nenhum indicador crítico usa dado fictício.
