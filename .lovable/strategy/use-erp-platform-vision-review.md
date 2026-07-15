# Use ERP → Plataforma Moldável (Commerce + Marketplace) — Revisão Estratégica

> Revisão da visão apresentada pelo produto em 2026-07. Consolida a estratégia
> de longo prazo em uma sequência viável, dimensiona receita e alinha com o que
> já existe no núcleo (ERP+WMS+Fiscal+Financeiro).

---

## 1. Diagnóstico da visão original

| Ponto                                | Avaliação      | Observação                                                                 |
| ------------------------------------ | -------------- | -------------------------------------------------------------------------- |
| ERP como núcleo                      | ✅ Correto     | Já consolidado; diferencial vs Nuvemshop/Loja Integrada                    |
| Commerce B2C + Editor + Checkout     | ✅ Correto     | É a peça central de monetização recorrente                                 |
| Marketplace de temas e apps          | ✅ Correto     | Take rate + efeito de rede; alinhado ao modelo Shopify/Wix                 |
| Omnichannel (WA/IG/ML)               | ✅ Correto     | Multiplica ticket médio sem aumentar CAC                                   |
| IA para conteúdo (descrições, ads)   | ✅ Correto     | Baixo custo com Lovable AI Gateway; alto valor percebido                   |
| Pricing R$ 99/199/399                | ⚠️ Baixo       | Concorrentes B2B com ERP começam em ~R$ 500. Sub-precificado               |
| PLM antes de BI                      | ⚠️ Invertido   | BI com IA gera valor imediato; PLM é nicho industrial                      |
| WMS no #7                            | ❌ Incorreto   | WMS já existe e é o que sustenta "estoque em tempo real". Deve estar no #2 |
| Falta Fulfillment as a Service       | ❌ Gap         | Monetização óbvia: usar o WMS como 3PL para lojistas menores               |

---

## 2. Roadmap revisado

### Camadas de produto (do núcleo para a borda)

```text
┌─────────────────────────────────────────────────────────────┐
│  Camada 5 — Ecossistema: Marketplace Apps + Temas + PLM     │
├─────────────────────────────────────────────────────────────┤
│  Camada 4 — Canais: Commerce B2C + Omnichannel + PDV        │
├─────────────────────────────────────────────────────────────┤
│  Camada 3 — Inteligência: IA de conteúdo + BI + CRM         │
├─────────────────────────────────────────────────────────────┤
│  Camada 2 — Operação: WMS + Fulfillment + TMS               │
├─────────────────────────────────────────────────────────────┤
│  Camada 1 — Núcleo: ERP (Fiscal, Financeiro, Comercial)     │
└─────────────────────────────────────────────────────────────┘
```

### Cronograma sugerido

| Trimestre    | Entrega                                                                    | Impacto de receita               |
| ------------ | -------------------------------------------------------------------------- | -------------------------------- |
| 2026 Q1      | Marketplace de Apps (MVP) — já em execução                                 | Take rate 20%                    |
| 2026 Q2      | Commerce B2C MVP + Editor drag-and-drop + Checkout PIX/Cartão              | +R$ 149-799/mês por cliente      |
| 2026 Q3      | Marketplace de Temas + Omnichannel (WhatsApp/Instagram/ML)                 | Take rate 30% + GMV fee          |
| 2026 Q4      | IA de conteúdo (descrições, banners, campanhas)                            | Upsell no plano Enterprise       |
| 2027 H1      | CRM nativo + PDV integrado + **Fulfillment as a Service**                  | Nova linha de receita (3PL)      |
| 2027 H2      | BI com IA + PLM (para verticais industriais)                               | Ticket médio +40%                |

---

## 3. Modelo de monetização revisado

### Planos SaaS (mensais)

| Plano         | Preço         | Inclui                                                                       |
| ------------- | ------------- | ---------------------------------------------------------------------------- |
| Starter       | R$ 149/mês    | ERP básico + 1 loja + tema grátis + 100 pedidos/mês + 1 canal (WhatsApp)     |
| Profissional  | R$ 349/mês    | + WMS + 3 canais + 1.000 pedidos/mês + IA de conteúdo (500 gerações)         |
| Business      | R$ 799/mês    | + Multi-loja + PDV + CRM + Fulfillment + 10.000 pedidos/mês                  |
| Enterprise    | Sob consulta  | White-label + BI + PLM + SLA 99.9% + gestor dedicado                         |

### Receitas transacionais (recorrentes)

- **GMV fee**: 0,99% (Starter) → 0,49% (Business) → 0% (Enterprise). Onde Shopify faz 70% da receita.
- **Take rate marketplace**: 20% em apps, 30% em temas. 15% para parceiros estratégicos (fee reduzido para acelerar catálogo).
- **Fulfillment as a Service**: R$ 0,80/pedido armazenado + R$ 1,20/pedido expedido, usando o WMS multi-CD já existente.
- **IA on-demand**: pacotes extras de gerações (R$ 29/500 gerações) após o limite do plano.

### Projeção conservadora (12 meses após Commerce GA)

- 500 clientes × R$ 349 médio = **R$ 174k MRR** só de assinatura
- GMV agregado R$ 20M/mês × 0,7% médio = **R$ 140k MRR** de fee
- Marketplace (200 apps × R$ 500 GMV × 20%) = **R$ 20k MRR**
- **Total: ~R$ 334k MRR** (~R$ 4M ARR) apenas do Commerce, sem contar upsell ERP.

---

## 4. Riscos e mitigação

| Risco                                                | Mitigação                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Escopo inflado (PLM + BI + Commerce simultâneos)     | Congelar PLM até 2027 H2. BI entra como módulo, não roadmap independente. |
| Marketplace vazio no lançamento (cold start)         | Programa "Fundadores": 5 devs parceiros com take rate 0% por 6 meses.     |
| Concorrência com Nuvemshop no low-end                | Não competir por preço. Vender ERP embutido como diferencial B2B.         |
| Checkout PIX/Cartão exige homologação                | Usar gateway já integrado (Pagar.me/Mercado Pago) antes de próprio.       |
| Custo de IA generativa                               | Cotar por plano; usar Lovable AI Gateway (custo previsível).              |

---

## 5. Diferencial competitivo (por que a Use ganha)

| Concorrente        | Ponto forte             | Ponto fraco explorável pela Use                          |
| ------------------ | ----------------------- | -------------------------------------------------------- |
| Nuvemshop          | Marca + comunidade      | ERP fraco; integrações via terceiros (Bling, Tiny)       |
| Loja Integrada     | Preço baixo             | Sem WMS, sem fiscal robusto                              |
| Magazord           | Enterprise B2B          | Editor fraco; sem marketplace de apps aberto             |
| Vtex               | Enterprise robusto      | Preço alto; sem ERP embutido (depende de SAP/TOTVS)      |
| **Use ERP**        | **ERP+WMS+Fiscal nativo, tempo real, marketplace aberto, IA embutida** |                                                          |

**Tese central**: nenhum concorrente entrega ERP+Commerce nativos no mesmo produto. É esse gap que justifica pricing 2-3x acima de Nuvemshop e captura o segmento médio (R$ 10M-R$ 100M de faturamento anual) que hoje faz gambiarra entre 3-4 sistemas.

---

## 6. Próximo passo executável

Implementar **Commerce B2C MVP** (2026 Q2) com o mínimo viável para GA:
1. Multi-tenant de loja (`storefronts` table + subdomínio `{slug}.usecommerce.com.br`)
2. Editor de páginas drag-and-drop (grid + blocos: hero, produto, banner, CTA)
3. Catálogo herdando `products` do ERP em tempo real (já temos Realtime)
4. Checkout PIX + Cartão via gateway externo
5. Sincronização de pedido → `orders` (ERP) via trigger existente

Marketplace de Apps (em andamento) e Realtime WMS (concluído) já sustentam essa entrega.
