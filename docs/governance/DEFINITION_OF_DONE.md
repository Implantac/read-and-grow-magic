# Definition of Done (DoD) Permanente — READ & GROW
Data: 2026-08-07

Nenhuma funcionalidade é considerada concluída ("DONE") sem cumprir rigorosamente este checklist de qualidade e segurança:

## 1. Interface e Experiência (UI/UX)
- [ ] **Visual**: Alinhado ao Design System (FASE 21).
- [ ] **Loading**: Estados de carregamento/skeleton implementados.
- [ ] **Empty State**: Feedback claro quando não há dados.
- [ ] **Error State**: Tratamento de erro amigável e ação de retry.
- [ ] **Responsividade**: Testado em Mobile, Tablet e Desktop.

## 2. Lógica e Dados (Backend/DB)
- [ ] **Tipagem**: TypeScript estrito, sem uso de \`any\`.
- [ ] **Validação**: Validação de inputs no cliente e no servidor.
- [ ] **Database**: Migrations criadas com GRANTs e índices necessários.
- [ ] **Multi-tenancy**: Isolamento via RLS testado e verificado.
- [ ] **Performance**: Consultas paginadas e limites aplicados (QueryLimits).

## 3. Segurança e Auditoria
- [ ] **Autorização**: RBAC aplicado (permissões granulares).
- [ ] **IDOR**: Proteção contra manipulação de IDs em URLs/Payloads.
- [ ] **Auditoria**: Logs de operações críticas registrados.
- [ ] **LGPD**: Respeito aos consentimentos e direitos do titular.

## 4. Estabilidade
- [ ] **Testes**: Testes unitários para regras de negócio críticas.
- [ ] **Regressão**: Verificado contra efeitos colaterais em módulos adjacentes.
- [ ] **Documentação**: Atualizado em \`/docs\` se houver mudança arquitetural.

---
*Assinado: Sistema Hardening Engine*
