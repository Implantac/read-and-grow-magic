execute
# READ & GROW — PLANO MASTER DE HARDENING ANTES DE NOVAS FUNCIONALIDADES

## OBJETIVO

Você está trabalhando no projeto READ & GROW.

Antes de criar qualquer nova funcionalidade, execute uma fase completa de estabilização, segurança, arquitetura, testes, UX, performance e qualidade.

O objetivo é transformar o estado atual do projeto em uma base confiável para evolução contínua.

O projeto NÃO deve receber novos módulos ou funcionalidades de negócio durante esta fase.

A prioridade absoluta é:

1. preservar funcionalidades existentes;
2. eliminar regressões;
3. reforçar segurança;
4. garantir isolamento multi-tenant;
5. consolidar arquitetura;
6. fortalecer testes;
7. melhorar UX estrutural;
8. melhorar performance;
9. documentar decisões;
10. estabelecer uma Definition of Done permanente.

---

# REGRA ABSOLUTA

NÃO reescreva o projeto do zero.

NÃO substitua a arquitetura atual por outra sem necessidade.

NÃO remova funcionalidades existentes simplesmente para facilitar a refatoração.

NÃO introduza mocks, dados fictícios ou telas falsas para "fazer o teste passar".

NÃO altere regras fiscais, financeiras, de estoque ou produção sem primeiro identificar exatamente o comportamento atual.

NÃO faça grandes alterações simultâneas sem validação intermediária.

Sempre prefira:

AUDITAR → PLANEJAR → ALTERAR → TESTAR → VALIDAR → DOCUMENTAR.

Se uma parte já estiver correta, PRESERVE-A.

Se houver dúvida sobre uma regra de negócio, não invente uma regra. Identifique a dúvida e documente-a.

---

# FASE 0 — BASELINE E CHECKPOINT

Antes de alterar qualquer coisa:

1. analisar o repositório inteiro;
2. identificar stack;
3. identificar arquitetura;
4. identificar módulos;
5. identificar serviços;
6. identificar hooks;
7. identificar Edge Functions;
8. identificar migrations;
9. identificar RLS;
10. identificar testes;
11. identificar workflows;
12. identificar dependências;
13. identificar secrets/configurações;
14. identificar arquivos grandes;
15. identificar duplicações;
16. identificar código morto;
17. identificar mocks;
18. identificar TODOs/FIXMEs;
19. identificar operações críticas.

Executar e registrar o resultado de:

* lint;
* typecheck;
* build;
* testes unitários;
* testes de integração existentes;
* E2E existente;
* CI existente.

Criar:

docs/hardening/BASELINE.md

O documento deve registrar:

* data;
* branch;
* commit;
* comandos executados;
* resultados;
* falhas existentes antes da intervenção;
* quantidade de testes;
* problemas encontrados;
* funcionalidades que não devem ser alteradas.

NÃO corrigir tudo ainda.

Primeiro estabelecer o baseline.

---

# FASE 1 — MAPA ARQUITETURAL

Criar:

docs/architecture/ARCHITECTURE.md

Documentar:

Frontend
→ React
→ Hooks
→ Services
→ Supabase
→ PostgreSQL
→ RLS

Documentar também:

* módulos;
* domínios;
* entidades;
* dependências;
* Edge Functions;
* autenticação;
* autorização;
* multi-tenancy;
* auditoria;
* integrações externas.

Identificar claramente:

UI
→ Hook
→ Service
→ Database/RPC/Edge Function
→ RLS
→ Audit

Nenhuma regra crítica deve permanecer escondida dentro de componentes de UI quando puder ser isolada em serviço/domínio.

---

# FASE 2 — SEGURANÇA E MULTI-TENANT

Esta é uma fase CRÍTICA.

Auditar TODAS as tabelas.

Para cada tabela registrar:

* finalidade;
* global/tenant/company/branch/user scoped;
* tenant_id;
* company_id;
* branch_id;
* foreign keys;
* RLS habilitado;
* policies SELECT;
* policies INSERT;
* policies UPDATE;
* policies DELETE;
* funções SECURITY DEFINER relacionadas;
* possibilidade de acesso indireto.

Criar:

docs/security/TENANT_MATRIX.md

Toda tabela precisa possuir uma classificação explícita de escopo.

Exemplos:

GLOBAL
TENANT
COMPANY
BRANCH
USER

Não adicionar tenant_id cegamente.

Respeitar o modelo relacional existente.

Garantir que relações não permitam combinações inválidas entre:

tenant
company
branch

---

# FASE 3 — RLS HARDENING

Para TODAS as tabelas tenant-scoped:

* confirmar RLS;
* revisar policies;
* revisar SELECT;
* revisar INSERT;
* revisar UPDATE;
* revisar DELETE;
* revisar USING;
* revisar WITH CHECK;
* verificar funções usadas pelas policies;
* verificar SECURITY DEFINER;
* verificar privilégios.

O tenant nunca deve ser confiado exclusivamente ao frontend.

A identidade autenticada deve ser a origem confiável da autorização.

Avaliar FORCE ROW LEVEL SECURITY para tabelas críticas quando apropriado.

NÃO aplicar FORCE indiscriminadamente.

Criar testes automatizados de isolamento.

Teste mínimo:

TENANT A
→ cria dados A

TENANT B
→ cria dados B

Usuário A:

* pode SELECT A;
* não pode SELECT B;
* pode INSERT A;
* não pode INSERT B;
* pode UPDATE A;
* não pode UPDATE B;
* pode DELETE A;
* não pode DELETE B.

O teste deve ser executado diretamente contra a camada de banco/autorização, não somente pelo frontend.

---

# FASE 4 — IDOR E ESCALADA DE PRIVILÉGIO

Testar manipulação direta de IDs.

Exemplo:

usuário A acessa registro A.

Alterar o ID manualmente para registro B.

Resultado:

* nenhum dado B pode ser retornado;
* nenhuma alteração B pode ocorrer;
* nenhuma exclusão B pode ocorrer.

Testar isso em:

* clientes;
* produtos;
* pedidos;
* compras;
* estoque;
* produção;
* financeiro;
* fiscal;
* NPS;
* documentos;
* anexos;
* relatórios.

Testar também tentativa de alterar:

* tenant_id;
* company_id;
* branch_id;
* owner_id;
* user_id;
* role;
* permission.

O backend/banco deve impedir qualquer escalada.

---

# FASE 5 — EDGE FUNCTIONS

Inventariar todas as Edge Functions.

Para cada uma documentar:

* propósito;
* endpoint;
* pública/privada;
* autenticação;
* autorização;
* tenant;
* permissões;
* validação;
* secrets utilizados;
* service_role;
* logs;
* auditoria;
* idempotência.

Nenhuma Edge Function protegida pode confiar somente no frontend.

Se usar service_role:

1. validar identidade;
2. validar tenant;
3. validar permissão;
4. validar input;
5. executar operação mínima necessária;
6. registrar auditoria quando aplicável.

---

# FASE 6 — SECRETS E CONFIGURAÇÃO

Auditar:

* .env;
* arquivos públicos;
* código frontend;
* Edge Functions;
* scripts;
* workflows;
* logs.

Nunca expor:

* service_role keys;
* private keys;
* passwords;
* tokens;
* certificados privados;
* secrets de integrações.

Variáveis públicas devem ser claramente diferenciadas de secrets.

Se houver segredo exposto em histórico Git:

1. não apenas apagar do arquivo atual;
2. identificar exposição;
3. recomendar/realizar rotação da credencial;
4. verificar histórico;
5. documentar o incidente.

---

# FASE 7 — AUTORIZAÇÃO

Criar matriz de permissões.

Modelo:

USER
→ MEMBERSHIP
→ ROLE
→ PERMISSION
→ SCOPE

Permissões devem ser granulares.

Exemplos:

sales.view
sales.create
sales.edit
sales.approve
sales.cancel

inventory.view
inventory.adjust
inventory.transfer

finance.view
finance.create
finance.approve
finance.pay
finance.cancel

production.view
production.create
production.release
production.complete

fiscal.view
fiscal.issue
fiscal.cancel

Não depender de:

isAdmin === true

para tudo.

O frontend pode esconder ações.

O backend/RLS deve impedir a operação mesmo que o frontend seja manipulado.

---

# FASE 8 — INTEGRIDADE DE DADOS

Auditar foreign keys.

Garantir relações válidas entre:

* tenant;
* company;
* branch;
* warehouse;
* customer;
* supplier;
* product;
* order;
* order_item;
* invoice;
* financial_title;
* payment;
* production_order;
* stock_movement.

Criar constraints quando forem seguras e compatíveis com os dados existentes.

Nunca apagar dados para "resolver" constraint.

Primeiro identificar e corrigir inconsistências.

---

# FASE 9 — ESTOQUE

Estabelecer claramente:

stock balance
≠
stock movement history.

Movimentos devem registrar:

* produto;
* depósito;
* tipo;
* quantidade;
* origem;
* documento relacionado;
* usuário;
* data;
* contexto.

Separar claramente:

* físico;
* reservado;
* disponível;
* em trânsito;
* comprometido.

Implementar/validar operações atômicas.

CRIAR TESTE DE CONCORRÊNCIA:

Estoque disponível = 1.

Usuário A tenta reservar 1.
Usuário B tenta reservar 1 simultaneamente.

Somente um pode vencer.

Nunca permitir estoque negativo acidental por race condition.

---

# FASE 10 — TRANSAÇÕES

Identificar operações compostas.

Exemplos:

* faturamento;
* recebimento;
* pagamento;
* movimentação de estoque;
* produção;
* cancelamento;
* transferência;
* fechamento financeiro.

Garantir atomicidade.

Evitar estados:

NF criada
+
estoque não atualizado
+
financeiro não criado.

Quando a operação for transacional:

OU TUDO ACONTECE
OU NADA É COMMITADO.

Quando não for possível uma transação única por integração externa, implementar máquina de estados e compensação apropriada.

---

# FASE 11 — IDEMPOTÊNCIA

Identificar operações que podem ser repetidas:

* NF;
* pagamento;
* webhook;
* importação;
* sincronização;
* integração externa;
* geração de documento.

Adicionar idempotency key ou mecanismo equivalente quando necessário.

Uma mesma requisição repetida não pode gerar duas operações financeiras/fiscais/estoque.

Criar testes de repetição.

---

# FASE 12 — DINHEIRO E PRECISÃO

Auditar TODOS os cálculos monetários.

Verificar:

* preços;
* descontos;
* impostos;
* frete;
* juros;
* multas;
* parcelas;
* pagamentos;
* arredondamentos;
* totais.

Não utilizar floating point de maneira insegura para regras financeiras críticas.

Centralizar cálculos financeiros em funções de domínio testáveis.

Criar testes para:

* centavos;
* grandes valores;
* descontos fracionados;
* impostos;
* parcelamentos;
* arredondamentos.

---

# FASE 13 — AUDITORIA EMPRESARIAL

Criar ou consolidar sistema de auditoria.

Registrar quando aplicável:

WHO
WHAT
WHEN
WHERE
BEFORE
AFTER

Exemplos:

* alteração de pedido;
* alteração de preço;
* ajuste de estoque;
* aprovação financeira;
* cancelamento;
* alteração de permissões;
* emissão fiscal;
* alterações administrativas.

Auditoria deve ser empresarialmente legível.

Não registrar apenas SQL técnico.

---

# FASE 14 — TESTES UNITÁRIOS

Criar testes prioritariamente para regras críticas:

* pricing;
* discounts;
* taxes;
* financial calculations;
* installments;
* inventory;
* stock availability;
* reservations;
* MRP;
* NPS;
* permissions;
* state transitions.

Não perseguir 100% de coverage artificial.

Priorizar regras de negócio.

---

# FASE 15 — TESTES DE INTEGRAÇÃO

Criar testes:

service
→ database

para:

* pedidos;
* estoque;
* compras;
* financeiro;
* produção;
* fiscal;
* NPS;
* permissões.

Testar também:

* RLS;
* transactions;
* constraints;
* RPC;
* Edge Functions.

---

# FASE 16 — GOLDEN PATH E2E

Criar E2E:

sales-golden-path.spec.ts

Fluxo:

login
→ empresa
→ cliente
→ produto
→ estoque
→ pedido
→ aprovação
→ reserva
→ faturamento
→ financeiro
→ pagamento
→ auditoria.

Criar:

purchase-golden-path.spec.ts

Fluxo:

necessidade
→ solicitação
→ cotação
→ fornecedor
→ pedido de compra
→ recebimento parcial
→ estoque
→ contas a pagar.

Criar:

production-golden-path.spec.ts

Fluxo:

produto
→ BOM
→ demanda
→ MRP
→ OP
→ reserva
→ apontamento
→ produção
→ qualidade
→ estoque.

Criar:

tenant-isolation.spec.ts

Fluxo:

tenant A
↔ tenant B

Nenhum dado pode atravessar o limite.

---

# FASE 17 — REGRESSÃO

Criar suíte crítica que rode antes de merge.

No mínimo:

* lint;
* typecheck;
* build;
* unit;
* integration;
* critical E2E;
* security/tenant tests.

Falha em teste crítico deve impedir merge/deploy.

---

# FASE 18 — CI/CD

Revisar:

.github/workflows/ci.yml
.github/workflows/e2e.yml

Garantir pipeline:

PR
→ lint
→ typecheck
→ unit
→ integration
→ build
→ E2E crítico
→ security tests

Se possível, separar:

fast checks
e
full checks.

Não permitir que a velocidade do pipeline seja motivo para remover testes críticos.

---

# FASE 19 — REFATORAÇÃO

Somente depois dos testes de segurança e regressão estarem protegendo o sistema.

Priorizar arquivos grandes já identificados pela auditoria:

1. ProductionKanban.tsx
2. CreateNFeDialog.tsx
3. pcpServices.ts
4. Orders.tsx
5. SellerDashboard.tsx
6. useSalesIntelligence.ts
7. BIIndustrial.tsx
8. FiscalDashboard.tsx
9. AICommercialDashboard.tsx
10. OperatorTerminal.tsx
11. AccountsReceivable.tsx
12. StockLevels.tsx
13. CTe.tsx
14. PCPPanel.tsx

Não dividir apenas por quantidade de linhas.

Separar por responsabilidade:

UI
state
data fetching
business rules
validation
subcomponents.

Preservar APIs públicas quando possível.

Não alterar comportamento sem teste.

---

# FASE 20 — CONSOLIDAÇÃO DE SERVICES

Revisar:

clientService.ts
clientsService.ts

Determinar uma única API.

Adaptar consumidores.

Remover duplicação somente depois que todos os consumidores estiverem migrados.

Não manter duas APIs indefinidamente.

---

# FASE 21 — DESIGN SYSTEM / UX

Consolidar componentes reutilizáveis:

ERPDataTable
ERPFilterBar
ERPStatusBadge
ERPSummaryCard
ERPDetailPanel
ERPDocumentTimeline
ERPCommandBar
ERPEmptyState
ERPErrorState
ERPFormSection
ERPActionBar

Padronizar:

* espaçamento;
* tipografia;
* status;
* botões;
* tabelas;
* filtros;
* modais;
* formulários;
* mensagens;
* loading;
* empty states;
* error states.

Não redesenhar o produto inteiro nesta fase.

Fazer somente a consolidação necessária para consistência.

---

# FASE 22 — UX OPERACIONAL

Avaliar e melhorar:

* navegação;
* breadcrumbs;
* busca global;
* Command Palette;
* Ctrl+K;
* filtros;
* ações contextuais;
* densidade das tabelas;
* formulários;
* atalhos;
* central de pendências;
* notificações;
* estados de loading;
* estados vazios;
* erros.

Priorizar produtividade.

Não adicionar animações desnecessárias.

---

# FASE 23 — PERFORMANCE

Auditar:

* queries;
* N+1;
* React Query;
* staleTime;
* paginação;
* virtualização;
* tabelas grandes;
* renders;
* bundle;
* lazy loading;
* imagens;
* Edge Functions;
* índices do banco.

Não otimizar prematuramente.

Primeiro medir.

Registrar:

docs/performance/PERFORMANCE.md

---

# FASE 24 — BANCO E ÍNDICES

Auditar índices para:

* tenant_id;
* foreign keys;
* company_id;
* branch_id;
* customer_id;
* product_id;
* status;
* created_at;
* dates usadas em relatórios;
* chaves de busca.

Evitar índices inúteis.

Não criar índices indiscriminadamente.

Considerar queries reais e EXPLAIN quando possível.

---

# FASE 25 — LGPD

Mapear dados pessoais.

Classificar:

* público;
* interno;
* confidencial;
* sensível operacionalmente.

Revisar:

* acesso;
* exportação;
* retenção;
* anonimização;
* logs;
* auditoria.

Nunca registrar dados pessoais desnecessários em logs.

---

# FASE 26 — DOCUMENTAÇÃO

Criar:

docs/
├── architecture/
├── security/
├── testing/
├── database/
├── performance/
├── ux/
└── operations/

Documentar:

* arquitetura;
* tenant model;
* RLS;
* permissions;
* audit;
* transactions;
* testing strategy;
* deployment;
* secrets;
* recovery;
* critical flows.

---

# FASE 27 — DEFINITION OF DONE PERMANENTE

Criar:

docs/DEFINITION_OF_DONE.md

Toda nova funcionalidade futura deverá cumprir:

[ ] UI
[ ] loading
[ ] empty state
[ ] error state
[ ] validation
[ ] backend/service
[ ] database
[ ] authorization
[ ] RLS
[ ] audit
[ ] transaction quando necessária
[ ] idempotency quando necessária
[ ] unit test
[ ] integration test
[ ] E2E quando crítico
[ ] lint
[ ] typecheck
[ ] build
[ ] documentation

Somente então:

READY.

---

# FASE 28 — NO-MOCK POLICY

Não criar:

* arrays fake;
* fake API;
* mock permanente;
* dados fictícios usados como backend;
* botão que simula operação real.

Se uma integração externa não estiver disponível:

usar uma abstração clara e documentada.

Não mascarar ausência de implementação.

---

# FASE 29 — RELATÓRIO FINAL

Criar:

docs/hardening/HARDENING_FINAL_REPORT.md

Informar:

1. problemas encontrados;
2. problemas corrigidos;
3. problemas que já estavam corretos;
4. problemas que não puderam ser corrigidos;
5. arquivos modificados;
6. migrations adicionadas;
7. policies alteradas;
8. testes adicionados;
9. resultados dos testes;
10. riscos restantes.

Criar também:

docs/hardening/HARDENING_CHECKLIST.md

com:

SECURITY
ARCHITECTURE
DATABASE
RLS
AUTH
PERMISSIONS
AUDIT
FINANCE
INVENTORY
FISCAL
PRODUCTION
PURCHASING
TESTS
E2E
CI/CD
UX
PERFORMANCE
LGPD
DOCUMENTATION

---

# CRITÉRIOS PARA ENCERRAR A FASE

A fase de hardening só pode ser considerada concluída quando:

✓ build passa
✓ typecheck passa
✓ lint passa
✓ testes unitários passam
✓ testes de integração passam
✓ E2E crítico passa
✓ tenant isolation passa
✓ IDOR tests passam
✓ permission escalation tests passam
✓ operações financeiras críticas estão protegidas
✓ estoque concorrente está protegido
✓ idempotência crítica está protegida
✓ RLS auditado
✓ Edge Functions auditadas
✓ secrets auditados
✓ documentação criada
✓ arquivos críticos refatorados quando necessário
✓ nenhuma regressão conhecida bloqueadora

---

# REGRA DE PARADA

Se qualquer teste crítico falhar:

PARAR.

Não adicionar nova funcionalidade.

Corrigir a causa.

Executar novamente a suíte.

Somente prosseguir quando estiver verde.

---

# ORDEM OBRIGATÓRIA

Executar nesta ordem:

FASE 0
→ FASE 1
→ FASE 2
→ FASE 3
→ FASE 4
→ FASE 5
→ FASE 6
→ FASE 7
→ FASE 8
→ FASE 9
→ FASE 10
→ FASE 11
→ FASE 12
→ FASE 13
→ FASE 14
→ FASE 15
→ FASE 16
→ FASE 17
→ FASE 18
→ FASE 19
→ FASE 20
→ FASE 21
→ FASE 22
→ FASE 23
→ FASE 24
→ FASE 25
→ FASE 26
→ FASE 27
→ FASE 28
→ FASE 29

Não pule diretamente para refatoração visual.

Segurança, integridade e testes vêm primeiro.

---

# PRINCÍPIO FINAL

O Read & Grow já possui uma base grande e madura.

Não trate este projeto como um protótipo descartável.

Trate-o como um ERP empresarial em evolução.

Preserve o que está funcionando.

Corrija o que está frágil.

Prove por testes o que é crítico.

E só depois volte a desenvolver novas funcionalidades.

AO FINAL, NÃO CRIE NENHUMA NOVA FUNCIONALIDADE DE NEGÓCIO.

Entregue o projeto estabilizado e o relatório final de hardening.