# Consolidação enterprise e contexto operacional canônico

## Objetivo
Evoluir o Read & Grow Magic sem reconstrução e sem dados simulados, incorporando integralmente os três documentos recebidos ao programa enterprise vigente. O eixo prioritário passa a ser um contexto único e verificável:

```text
usuário → empresa → unidade → tipo da unidade → canal → escopo → módulo → permissão
```

A execução seguirá lotes incrementais. Nenhuma fase será declarada concluída sem validação do frontend, banco, segurança e testes reais.

## Diagnóstico consolidado

### Estado já entregue
- O baseline, o inventário inicial, a matriz de rastreabilidade e os gates principais de CI já existem.
- A sessão e o `EnterpriseContext` já são a fonte preferida em partes críticas; empresa e filial são limpas no logout.
- A troca de empresa já recarrega unidades e escolhe uma unidade válida, e RPCs financeiras críticas receberam endurecimento multiempresa.
- A suíte atual possui 95 testes aprovados e a compilação está verde.
- Transferências, ledger logístico-fiscal e `correlation_id` já possuem implementação e testes próprios.

### Lacunas confirmadas pelos documentos e pelo código atual
- A lista de empresas permitidas ainda não é exposta pelo contexto; o seletor mostra somente a empresa ativa.
- Empresa, unidade e canal ainda existem em estados concorrentes (`EnterpriseContext`, stores legados e filtro de canal).
- A mudança de contexto não é uma única operação atômica e ainda não invalida o cache de forma centralizada.
- Tipos de unidade divergem entre valores legados e canônicos; o enum atual não contempla atacado.
- O modo de escopo (`CONSOLIDATED`, `SINGLE_UNIT`, `MULTI_UNIT`) ainda não está formalizado.
- O menu ainda é filtrado principalmente pelo segmento da empresa, não por unidade, canal, papel, permissão e escopo.
- Rotas não usam uma política contextual uniforme para acesso direto por URL.
- Há dezenas de consumidores dos estados atuais; a migração precisa usar adaptadores temporários para evitar quebra ampla.
- Os testes específicos de troca de contexto, cache, isolamento por filial/canal e navegação contextual ainda são insuficientes.
- Permanecem etapas posteriores do programa: ledger integral, PDV offline idempotente, fiscal/financeiro, E2E críticos, performance, IA governada e produção.

## Decisões de arquitetura
- `branch_id` será o identificador canônico de unidade transacional; `operational_units` será consolidado por compatibilidade, sem criar um terceiro cadastro paralelo.
- Tipos oficiais: `STORE`, `INDUSTRY`, `DISTRIBUTION_CENTER`, `OFFICE`, `WHOLESALE`.
- Canais oficiais: `CONSOLIDADO`, `VAREJO_PDV`, `ATACADO_INDUSTRIA`.
- Escopos oficiais: `CONSOLIDATED`, `SINGLE_UNIT`, `MULTI_UNIT`.
- Segmento empresarial continuará existindo apenas como refinamento, nunca como autorização principal.
- O frontend orientará a experiência, mas isolamento e autorização continuarão obrigatoriamente protegidos no banco e nas funções.
- Stores antigos serão adaptadores somente durante a migração; novas telas não poderão escrever contexto diretamente neles.

## Plano de implementação

### Lote 1 — Contrato canônico e troca atômica (P0)
- Criar o contrato tipado do contexto operacional com usuário, empresas permitidas, empresa ativa, unidades permitidas, unidade/tipo ativos, canal, escopo, papel, permissões, `admin_matriz`, loading, readiness e erro.
- Expor a lista real de empresas autorizadas.
- Implementar `switchContext({ companyId, unitId, channel, scope })` com validação de empresa, carregamento de unidades, validação de unidade/canal, seleção padrão e atualização indivisível.
- Cancelar e invalidar consultas do contexto anterior antes de liberar o novo contexto.
- Persistir somente IDs válidos e revalidá-los contra a sessão em inicialização, troca de usuário e mudança de permissão.
- Sincronizar temporariamente os stores legados por adaptadores somente leitura e registrar sua retirada gradual.
- Registrar auditoria da troca sem expor dados sensíveis.

**Aceite:** Topbar, consultas e stores observam o mesmo contexto; nenhuma empresa/unidade anterior permanece visível após a troca.

### Lote 2 — Unidade, canal e seletor contextual (P0)
- Criar normalização única para tipos legados (`factory`, `industria`, `filial`, `cd` etc.) até os cinco tipos oficiais.
- Confirmar o schema real e aplicar somente migration incremental necessária para `WHOLESALE`, canais suportados e metadados comprovadamente ausentes.
- Evoluir o seletor para empresas autorizadas, visão consolidada, grupos de lojas/indústrias/CDs e unidade individual.
- Restringir visão consolidada e seleção ampla a `admin_matriz` ou permissão equivalente.
- Mostrar sempre empresa, unidade, tipo e canal em PT-BR, com estado de transição e sem contexto ambíguo.
- Separar claramente contexto operacional de filtros analíticos; filtros nunca poderão contradizer a unidade ativa.

**Aceite:** loja, indústria, CD, atacado e consolidado são identificados sem ambiguidade e somente opções autorizadas podem ser selecionadas.

### Lote 3 — Navegação e rotas orientadas ao contexto (P1)
- Estender os metadados de navegação com tipos de unidade, canais, escopos, permissão, papéis e feature flag.
- Implementar uma função pura `getNavigationForContext` e aplicá-la ao menu e à busca.
- Criar `OperationalScopeGuard` com a mesma política para acesso direto por URL.
- Exibir bloqueio objetivo em PT-BR, orientando troca de contexto ou solicitação de acesso.
- Manter rotas existentes e ocultar recursos incompatíveis: loja/PDV, indústria/PCP, CD/WMS, atacado e visão administrativa.
- Atualizar breadcrumbs e cabeçalhos para explicitar escopo atual.

**Aceite:** menu e URL direta produzem a mesma decisão de acesso; nenhuma opção incompatível aparece como disponível.

### Lote 4 — Banco, permissões e isolamento por unidade/canal (P0)
- Inventariar tabelas transacionais, políticas, RPCs e funções relacionadas a empresa, filial e canal.
- Corrigir apenas lacunas comprovadas, com migrations incrementais, grants explícitos, RLS e `search_path` seguro.
- Derivar empresa/usuário da sessão e rejeitar `company_id`, `branch_id` ou canal adulterados no payload.
- Restringir consolidado, operações administrativas e mudanças entre unidades aos papéis/permissões corretos.
- Garantir que estoque, vendas, caixa, financeiro e fiscal não cruzem unidades/canais sem documento operacional formal.

**Aceite:** testes negativos provam isolamento entre empresas, filiais e canais, inclusive contra payload adulterado.

### Lote 5 — Migração de consultas e serviços (P1)
- Inventariar os consumidores dos estados legados e migrar por domínio, começando por dashboard, estoque, PDV, financeiro, fiscal e produção.
- Padronizar `Tela → Hook → Serviço → função protegida → RLS → auditoria`.
- Eliminar escritas diretas de contexto em componentes.
- Garantir chaves de cache com empresa, unidade, canal e escopo; remover dados antigos durante transições.
- Reduzir casts inseguros e chamadas diretas ao banco nas áreas críticas sem alterar comportamento funcional.

**Aceite:** cada domínio consome o contexto canônico e não combina manualmente múltiplos stores.

### Lote 6 — Testes reais e gates bloqueantes (P0/P1)
- Criar testes unitários para normalização, validação de contexto, navegação e guard.
- Criar integração real para empresas/unidades autorizadas, canal compatível, cache e RLS.
- Criar E2E determinístico para troca de empresa, unidade, consolidado, loja, indústria, CD, URL indevida, logout/login e recarga.
- Completar E2E reais de O2C, P2P, Produção e PDV; nenhum teste poderá passar por ausência de dados ou placeholder.
- Manter o pipeline bloqueante: lint → tipos → unitário/integração → RLS → build → E2E → segurança.

**Aceite:** os fluxos preparam e verificam seus próprios dados e falham diante de vazamento, contexto inválido ou regressão.

### Lotes 7–10 — Continuidade do programa enterprise
- **Estoque/ledger:** toda movimentação com empresa, filial, canal, usuário, origem, idempotência e `correlation_id`; nenhuma alteração silenciosa de saldo.
- **PDV/fiscal/financeiro:** fila offline, retry idempotente, documentos fiscais separados, caixa e títulos sem duplicidade e fechamento protegido.
- **Performance/observabilidade/UX:** paginação, índices comprovados, SLA, métricas operacionais, acessibilidade e PT-BR consistente.
- **IA e produção:** confirmação humana, custo e rastreabilidade por empresa, backup/restauração, rollback, carga, runbooks e go-live controlado.

## Ordem de execução imediata
1. Implementar o contrato canônico e testes unitários.
2. Expor empresas permitidas e tornar a troca de contexto atômica.
3. Normalizar tipos e validar compatibilidade do schema.
4. Evoluir o seletor e separar contexto de filtro analítico.
5. Migrar navegação e criar o guard contextual.
6. Endurecer banco/RLS conforme lacunas comprovadas.
7. Migrar consultas por domínio e executar E2E reais.

## Regras de segurança e qualidade
- Não reescrever o sistema, apagar migrations, resetar o banco ou criar módulos paralelos.
- Não inventar tabelas/colunas, IDs, permissões ou dados; confirmar schema e dados reais antes de alterar.
- Não usar mocks, fallbacks estáticos ou testes vazios para declarar conclusão.
- Não confiar em estado persistido, menu ou filtro visual como segurança.
- Cada lote deve registrar arquivos, migrations, testes, resultados, riscos restantes e próximo passo.
- Mudanças amplas serão divididas por domínio e validadas antes do lote seguinte.

## Critério final de pronto
- Empresa, unidade, tipo, canal e escopo estão sempre claros e coerentes.
- Gestor autorizado alterna entre rede e unidades; usuários comuns veem somente seu ambiente.
- Menu, rotas, consultas, cache, banco e permissões usam a mesma regra contextual.
- Nenhum dado atravessa empresa, filial ou canal.
- Estoque é reconstruível por eventos; venda, fiscal e financeiro são idempotentes.
- O2C, P2P, Produção, PDV e isolamento possuem E2E real.
- Todos os gates críticos passam e a documentação corresponde às evidências.
