# Decisões arquiteturais

- Hooks React devem ser chamados antes de qualquer retorno condicional, garantindo ordem estável entre renderizações.
- Políticas empresariais vindas de metadados devem ser tipadas e mescladas no PolicyProvider, sem supressões TypeScript.
- Integrações fiscais e bancárias devem falhar com segurança quando indisponíveis; é proibido persistir documentos ou cobranças fictícias.
- Pedidos novos permanecem pendentes até uma transição explícita do fluxo O2C; criação nunca equivale a conclusão.
- Arquivos gerados automaticamente pelo ambiente de autenticação e MCP ficam fora do lint; correções devem ocorrer em suas fontes geradoras.
- HOCs só encaminham `ref` para classes ou componentes `forwardRef`; `memo` isolado não implica suporte a referência.
- Pagamentos PIX no PDV só contam como recebidos após consulta autenticada de cobrança paga; sem provedor, nenhuma cobrança é criada.
- A busca global usa a navegação filtrada pelo contexto operacional e o atalho Ctrl/Cmd+K tem um único destino, evitando oferecer telas incompatíveis com a unidade ativa.