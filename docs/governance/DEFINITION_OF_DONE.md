# Definition of Done (DoD) - READ & GROW
Data: 2026-08-06

Nenhuma tarefa é considerada "Pronta" sem atender aos seguintes critérios:

1. **Tipagem**: Sem uso de `any` em novos códigos ou códigos modificados.
2. **Segurança**: RLS habilitado e testado para isolamento de tenant.
3. **Qualidade**: Lint e Typecheck passando sem erros residuais.
4. **Isolamento**: Filtros de `company_id` ou `branch_id` aplicados em todas as consultas.
5. **Documentação**: Atualização dos docs relevantes em `/docs`.
6. **Performance**: Consultas paginadas e com limites.
