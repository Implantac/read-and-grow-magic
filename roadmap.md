# Roadmap

- [x] Fase 0 — Baseline, inventário e matriz de rastreabilidade
- [ ] Fase 1 — Segurança multiempresa, filial e canal (Lotes 1–2 concluídos; Lote 4 auditado: guards pendentes em `settle_account`, faturamento atômico, auditoria financeira, ajustes e RLS por filial/canal; aplicação bloqueada enquanto o Lovable Cloud finaliza alterações)
- [ ] Fase 3 — Ledger e integridade de estoque
- [ ] Fases 4–5 — PDV, fiscal e financeiro idempotentes
- [ ] Fase 2 — Consolidação arquitetural e tipagem por domínio
- [ ] Fase 6 — E2E críticos e CI bloqueante (pipeline bloqueante criado; fixtures O2C/P2P/PCP pendentes)
- [ ] Fase 7 — Performance e observabilidade
- [ ] Fase 8 — UX, acessibilidade e navegação
  - [x] Evoluir navegação por tarefas conforme contexto ativo e dar feedback confiável às pendências (lote de experiência operacional).
  - [x] Ajustar seleção de empresa e unidade para caber no topo do celular.
  - [x] Facilitar a escolha de produtos na transferência, mostrar saldos e impedir solicitações acima do disponível antes do envio.
- [ ] Fase 9 — IA e automações governadas
- [ ] Fase 10 — Preparação e validação de produção

## Revisão ponta a ponta — 2026-09-30

- [x] Corrigir painel WMS: retirar indicadores fictícios, mostrar falhas e atualizar dados operacionais.
- [x] Bloquear QR e confirmação PIX fictícios no PDV; sem provedor configurado, cobrança retorna 503 sem criação. Integração PSP real permanece pendente.

- [x] Corrigir ordem instável de hooks no painel WMS.
- [x] Impedir conclusão automática prematura de pedidos recém-criados.
- [x] Remover fallback de boleto fictício; falhar com segurança sem provedor válido.
- [x] Calcular sugestões de compras com saldos reais de estoque.
- [x] Bloquear NF-e automática de transferência enquanto faltarem numeração e valores fiscais reais.
- [x] Tornar atualização e exclusão RFID funcionais, com confirmação destrutiva.
- [ ] Implementar emissão fiscal real de transferência com numeração idempotente e valores dos itens.
- [ ] Implementar consumo de matéria-prima e quantidade produzida na conclusão da OP.
- [ ] Implementar CRUD completo de cotações de compra.
- [ ] Substituir indicadores simulados da governança por consultas reais.
- [ ] Ativar fixtures e testes E2E completos de O2C, P2P, PCP e PDV no pipeline.
- [ ] Concluir isolamento por filial/canal e revisar funções privilegiadas apontadas pelo linter.
