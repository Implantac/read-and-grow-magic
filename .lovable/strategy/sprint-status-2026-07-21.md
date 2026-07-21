# Status Sprints S4/S5/S6 — 21 jul 2026

## ✅ S4 — Perfil Comercial (entregue)
- View `commercial_client_profiles` com `security_invoker=true` (herda RLS de clients/orders)
- Cálculo automático: LTV, ticket médio, frequência, dias desde última compra
- Tiers: Bronze (<5k) / Prata (5k-25k) / Ouro (25k-100k) / Diamante (>100k)
- Ciclo de vida: ativo (60d) / em_risco (120d) / inativo / sem_compras
- Página `/comercial/perfil-clientes` com KPIs, filtros, busca e tabela

## ✅ S5 — Commerce Bridge Fase 2 (entregue)
- Tabela `storefront_notifications` (RLS por company do storefront)
- Trigger `commerce_log_order_notifications` registra evento a cada mudança
  (order_created, order_paid, order_shipped, order_cancelled, order_status_changed)
- Edge function `commerce-notify` processa fila pendente (integra com Resend
  quando `RESEND_API_KEY` configurado; caso contrário, marca como sent/failed)
- Flag `storefronts.auto_authorize_nfce` + UI toggle na tela da loja
- Componente `StorefrontNotificationsPanel` reutilizável

## ⚠️ S6 — Fiscal GA (parcial / bloqueado por infra externa)
### O que já existe
- `nfe-emit` edge function com fluxo SEFAZ (rascunho + envio)
- Tabela `nfe_certificates` para armazenar A1
- Trigger de rascunho NFC-e a partir de pagamento confirmado (S5 concluído)
- `auto_authorize_nfce` sinaliza rascunhos prontos para transmissão

### O que falta (não entregável nesta sprint por depender de infra real)
1. **Assinatura A1 de produção**: exige biblioteca de assinatura XML nativa em
   Deno (não trivial — envolve XMLDSig com C14N canonical). Recomendo edge
   function separada `fiscal-xml-sign` isolando essa complexidade e cobrindo
   com testes automatizados usando certificados de homologação.
2. **Reinf R-2020 / R-2099**: exige mapeamento completo de retenções
   (INSS/IR/PIS/COFINS/CSLL), geração do XML no leiaute 2.1.2, transmissão
   pelo webservice específico da Receita e controle de eventos. Não deve ser
   feito sem sprint dedicada com acompanhamento contábil real.

### Recomendação
- Criar sprint isolada **S6a: Sign A1 + envio SEFAZ produção** (2 semanas)
- Criar sprint isolada **S6b: Reinf 2020/2099** (3 semanas) com contador
- Manter `auto_authorize_nfce` marcando rascunhos como `pending_transmission`
  até que S6a esteja concluída.

## 🧹 Débitos técnicos identificados
- Rotas órfãs (sem link no menu): mapear via script e ligar ao navigation
- Hardcoded URLs (ex.: `usecommerce.app`, `usecommerce.com.br`) → mover para
  `src/config/env.ts`
- 88 warnings do linter Supabase são pré-existentes (SECURITY DEFINER dos
  triggers). Manter revocação de EXECUTE em novas funções.

## Próximo passo sugerido
Iniciar **S6a** com timebox e certificado homologação SEFAZ, sem misturar com
outras entregas.
