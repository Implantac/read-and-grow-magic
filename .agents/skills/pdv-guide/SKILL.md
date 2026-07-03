---
name: pdv-guide
description: Guia de decisões técnicas, UX e design para o PDV (Ponto de Venda). Use ao criar ou evoluir telas, componentes, fluxos de venda, pagamento, caixa, comprovante, mensagens de erro e feedbacks do PDV — inclui paleta, padrões de ProductCard/CartItem, fluxo operacional e mapeamento de erros técnicos para mensagens amigáveis em PT-BR.
---

# PDV Skill — Guia de Decisões Técnicas

## Identidade
- Público-alvo: pequeno e médio varejo, lanchonetes, lojas de roupas.
- Tom da interface: profissional mas amigável, sem termos técnicos.
- Idioma: PT-BR em toda UI e mensagens.

## Paleta padrão (referências — usar tokens semânticos do projeto)
Sempre mapear para tokens em `src/index.css` / `tailwind.config.ts`. Nunca hardcodar `text-white`, `bg-[#...]` em componentes.

| Uso | Cor referência |
|---|---|
| Primária (ações principais) | `#2563EB` |
| Sucesso / Finalizar | `#16A34A` |
| Alerta / Desconto | `#D97706` |
| Perigo / Cancelar | `#DC2626` |
| Neutro / Fundo | `#F8FAFC` |
| Texto principal | `#0F172A` |

Quando o projeto tiver tema Dark Premium (default deste ERP), preservar o dark mode e usar as cores acima só como intenção semântica — variante via tokens (`--primary`, `--success`, `--warning`, `--destructive`).

## Componentes

### ProductCard (grid de produtos)
- Tamanho mínimo: 120x80px.
- Conteúdo: imagem (ou ícone da categoria como fallback), nome truncado (2 linhas máx), preço em `tabular-nums`.
- Hover: elevação `shadow-elevation-2` + borda colorida da categoria.
- Sem estoque: `opacity-50` + badge "Sem estoque" (`variant="destructive"`).
- Toque/click: adiciona 1 ao carrinho e dispara animação de badge.

### CartItem (linha do carrinho)
- Controles: `[-] qtd [+]`. Campo de qtd clicável para digitar direto.
- Mobile: swipe-to-delete.
- Preço unitário e subtotal alinhados à direita, `tabular-nums`.
- Ícone remover (lixeira) visível no hover em desktop.

### Feedback de ação
- Adicionar ao carrinho: `toast` discreto no canto (sonner) + pulse no badge do carrinho.
- Pagamento confirmado: modal fullscreen com checkmark animado por ~2s, depois retorna à tela limpa.
- Erro de conexão: banner âmbar no topo (não bloqueia venda — modo offline continua registrando).

## Fluxo de venda (regra de negócio)
1. Abrir caixa (saldo inicial informado pelo operador).
2. Registrar itens (busca por código/nome, leitor de código de barras, câmera, ou clique no grid).
3. Identificar cliente (opcional; obrigatório para fiado).
4. Abrir modal de pagamento.
5. Selecionar formas (split permitido) e confirmar valores; calcular troco.
6. Gerar número da venda, baixar estoque, atualizar `current_balance` se fiado.
7. Emitir comprovante (PDF/impressão térmica).
8. Retornar à tela limpa para próxima venda.

Suspender/retomar cupom disponível a qualquer momento antes do pagamento.

## Fechamento de caixa
- Sempre CEGO: operador informa valor contado antes de ver o esperado.
- Exibir diferença com destaque (verde = zerado, âmbar = sobra, vermelho = falta).
- Imprimir Redução Z ao final.

## Atalhos de teclado (referência)
`F1`–`F6` formas de pagamento (Dinheiro, Crédito, Débito, PIX, Voucher, Fiado).
`F7` suspender cupom · `F8` retomar cupom · `F9` desconto · `F10` cliente · `F12` finalizar · `Esc` limpar busca.

## Mensagens de erro (técnico → amigável)

| Erro técnico | Mensagem para o usuário |
|---|---|
| Network timeout | "Sem conexão. A venda foi salva localmente." |
| Unique constraint (`23505`) | "Este código já está cadastrado. Verifique o SKU." |
| Foreign key (`23503`) na exclusão | "Não é possível excluir. Este item está vinculado a vendas." |
| Auth expired (JWT) | "Sua sessão expirou. Faça login novamente." |
| Stock < 0 | "Estoque insuficiente para este produto." |
| RLS/permission denied | "Você não tem permissão para esta operação." |
| Crédito insuficiente (fiado) | "Limite de crédito do cliente insuficiente." |

Centralizar via `toastError` / `mutationErrorHandler` em `src/lib/toastHelpers.ts` — nunca vazar mensagens cruas do Postgres/PostgREST ao usuário.

## Convenções técnicas do projeto
- Backend: Lovable Cloud (Supabase). Sempre RLS por `company_id` via `get_user_company_id()`.
- Realtime obrigatório em listas afetadas por venda: `sales`, `sale_items`, `nfce`, `products.stock`.
- Estado do carrinho e sessão de caixa persistidos em `localStorage` (chaves `pdv:session`, `pdv:audit`, `pdv:parked`).
- Sem mocks: dados reais do Supabase.
- Reaproveitar: `PDVDialog`, `PDVCloseSessionDialog`, `PDVParkedDialog`, `PDVPixDialog`, `useNFCe`, `useActiveCategories`, `pdvReceipt`. Não duplicar.

## Estrutura de pastas
```
src/components/fiscal/         # PDVDialog e sub-diálogos (Close, Pix, Parked, Cancel, Return)
src/hooks/fiscal/              # useNFCe, hooks de venda
src/hooks/inventory/           # useProducts, useActiveCategories
src/services/commercial/       # clientService (crédito, fidelidade)
src/lib/pdvReceipt.ts          # geração de comprovante
src/lib/toastHelpers.ts        # toastError / toastSuccess
```

## Checklist ao evoluir o PDV
- [ ] Mensagens em PT-BR e amigáveis (sem SQL/tech).
- [ ] Tokens semânticos, sem cores hardcoded.
- [ ] Realtime + `queryClient.invalidateQueries` após mutações.
- [ ] Baixa de estoque + atualização de saldo (fiado) atômicas.
- [ ] Fechamento cego preservado.
- [ ] Comprovante gerado em toda venda finalizada.
- [ ] Atalhos F1–F12 e Esc funcionando.
- [ ] Empty state, skeleton e ARIA em novas telas.
