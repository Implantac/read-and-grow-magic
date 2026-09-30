# Decisões arquiteturais

- Hooks React devem ser chamados antes de qualquer retorno condicional, garantindo ordem estável entre renderizações.
- Políticas empresariais vindas de metadados devem ser tipadas e mescladas no PolicyProvider, sem supressões TypeScript.
- Integrações fiscais e bancárias devem falhar com segurança quando indisponíveis; é proibido persistir documentos ou cobranças fictícias.
- Pedidos novos permanecem pendentes até uma transição explícita do fluxo O2C; criação nunca equivale a conclusão.
- Arquivos gerados automaticamente pelo ambiente de autenticação e MCP ficam fora do lint; correções devem ocorrer em suas fontes geradoras.