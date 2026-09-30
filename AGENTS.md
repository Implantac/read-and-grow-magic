# Decisões arquiteturais

- Hooks React devem ser chamados antes de qualquer retorno condicional, garantindo ordem estável entre renderizações.
- Políticas empresariais vindas de metadados devem ser tipadas e mescladas no PolicyProvider, sem supressões TypeScript.