# UEEF Maturity Audit — 2026-06

Modo: **Enterprise Review Loop** sobre o estado atual do ERP. Sem alterações de código — apenas diagnóstico, evidências e Evolution Score por domínio.

## 1. Postura de segurança & multi-tenant

| Métrica | Valor |
|---|---|
| Total de tabelas em `public` | **307** |
| Tabelas com RLS habilitado | **307 (100%)** |
| Tabelas com ao menos uma policy | **307 (100%)** |
| Tabelas com coluna `company_id` | **299 / 307 (97%)** |
| Tabelas globais legítimas (sem `company_id`) | **17** — `companies`, `tenants`, `plans`, `plan_features`, `plan_modules`, `plugins`, `plugin_versions`, `permissions`, `role_permissions`, `enterprise_groups`, `enterprise_segments`, `holding_entities`, `fiscal_cfop_reference`, `accounting_items`, `billing_meters`, `crm_pipeline_stages`, `wms_docks` |
| Tabelas com RLS ativo e **sem** policy | **0** (corrigido nesta janela: `ai_executive_decisions`) |
| Warnings linter `0029` (RPCs `SECURITY DEFINER` executáveis) | **44** — todas RPCs legítimas (`has_role`, `get_user_company_id`, `wms_*`, `get_dre`, etc.) que já filtram tenant internamente |

**Veredito**: postura multi-tenant **A** — sem brechas conhecidas, globais explicitamente justificadas.

## 2. Evolution Score por domínio

Escala 0–5 (cobertura funcional × maturidade técnica × observabilidade).

| Domínio | Score | Pontos fortes | Próxima evolução natural |
|---|---|---|---|
| WMS | **4.8** | 35+ telas, Digital Twin 3D, ML, 3PL Billing, Yard, Cycle Count, Scorecard transp. | RMA v2, Wave Planning v2, integração TMS bidirecional |
| Financeiro | **4.5** | AP/AR, DRE dinâmica, antifraude, recorrências, alertas preditivos | Conciliação Open Finance auto-match em produção |
| Fiscal | **4.3** | NF-e/NFC-e/CT-e/MDF-e, SPED, tax engine, ICMS ST/DIFAL | EFD-Reinf, e-Social fase 2, painel obrigações |
| Contabilidade | **4.0** | Plano de contas, lançamentos, razão, balancete, DRE, fechamento | Consolidação multi-empresa, conversão moeda |
| Comercial / CRM | **4.4** | Funil, comissões, forecast, IA comercial, gamificação | Lead scoring ML em produção, ABM |
| Produção / PCP | **4.6** | MRP, OEE, Kanban, APS, Digital Twin, IoT | Manutenção preditiva (TPM/MTBF), genealogia 100% |
| Compras | **3.5** | Pedidos, cotações, fornecedores | Sourcing event/leilão reverso, contratos |
| Estoque | **4.0** | Produtos, kardex, movimentações, saldos | Forecast de demanda S&OP |
| Operacional | **3.8** | Fila separação/conferência/faturamento/expedição | Orquestração com workflow engine v3 |
| Admin / Plataforma | **4.5** | RBAC, metadata engine, workflows, automation, dashboard engine, observabilidade | Marketplace v4 (revenue share), SSO SAML self-service |
| Verticais | **3.0** | Têxtil, confecção, fiação, tecelagem, alimentos, farma, distrib., varejo, franquia, holding | Aprofundar 2 verticais até "pronto pra vender" |
| IA / Cérebro Nativo | **4.7** | Multi-agente, memória, decisões, autopilot, A11y completa | Treinamento contínuo via feedback loop |

**Média ponderada do ERP**: **4.26 / 5** — estágio **"Production-grade plataforma horizontal"**.

## 3. Dívidas técnicas mapeadas (não bloqueantes)

1. **44 warnings `0029`** — advisory; padrão correto para RPCs auth-only com filtro interno. Documentar exceção formal.
2. **`navigation.ts` monolítico** — 350+ linhas; candidato a split por domínio.
3. **Serviços legados em `src/services/wms/wmsService.ts`** com `as any` — migrar para tipos gerados.
4. **Cobertura de testes** — Vitest configurado, suíte ainda concentrada em pontos críticos (auth, RLS, brain).
5. **Bundle**: code splitting ativo, mas alguns chunks WMS (>500KB) merecem lazy-route adicional.

## 4. Riscos abertos

| Risco | Severidade | Mitigação atual |
|---|---|---|
| Vazamento cross-tenant via RPC mal escrita | Médio | Padrão `get_user_company_id(auth.uid())` + revisão obrigatória |
| Drift de schema vs. tipos TS | Baixo | Regeneração automática pós-migration |
| Custo de IA (Lovable AI) sem teto por tenant | Médio | `billing_meters` existe; falta hard-cap por plano |
| Observabilidade de Edge Functions | Baixo | `_shared/observability.ts` + SRE dashboard |

## 5. Recomendações priorizadas (próximas 3 Sprints)

1. **RMA v2** — fechar ciclo reverso (cliente/fornecedor/produção) com disposição atômica.
2. **Hard-cap de uso IA por plano** — proteção financeira do SaaS.
3. **EFD-Reinf** — obrigação fiscal recorrente faltante.

---

**Conclusão UEEF**: o ERP cruzou o limiar de plataforma. Foco agora é **profundidade vertical e governança de custo**, não mais largura de módulos.
