import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Brain, Send, Sparkles, X, Loader2, ExternalLink, MessageSquare, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/ui/base/sheet';
import { Button } from '@/ui/base/button';
import { Textarea } from '@/ui/base/textarea';
import { Badge } from '@/ui/base/badge';
import { ScrollArea } from '@/ui/base/scroll-area';
import { useBrainChat } from '@/hooks/ai/useAIBrain';
import { cn } from '@/lib/utils';

/**
 * Global event to open the contextual Brain drawer from anywhere.
 *   window.dispatchEvent(new CustomEvent('brain:open'))
 */
export const BRAIN_OPEN_EVENT = 'brain:open';

// Human labels + suggested prompts by route prefix. Keeps the drawer
// contextual: opening it on /financial pre-loads finance-oriented actions.
const ROUTE_CONTEXT: Array<{
  match: RegExp;
  label: string;
  agent: string;
  suggestions: string[];
}> = [
  {
    match: /^\/financial|\/accounting|\/treasury/,
    label: 'Financeiro',
    agent: 'cfo',
    suggestions: [
      'Resumo do fluxo de caixa dos próximos 30 dias',
      'Quais são os 5 maiores títulos a receber vencidos?',
      'Aponte anomalias nas despesas do mês',
    ],
  },
  {
    match: /^\/wms|\/warehouse|\/inventory|\/stock/,
    label: 'WMS / Estoque',
    agent: 'coo',
    suggestions: [
      'Quais SKUs estão em risco de ruptura?',
      'Sugira reposição para posições com ocupação < 20%',
      'Compare produtividade de picking por operador',
    ],
  },
  {
    match: /^\/commercial|\/sales|\/crm/,
    label: 'Comercial',
    agent: 'cro',
    suggestions: [
      'Top 5 oportunidades com maior probabilidade',
      'Leads estagnados há mais de 15 dias',
      'Sugira próxima ação para o funil',
    ],
  },
  {
    match: /^\/production|\/pcp|\/mrp/,
    label: 'Produção',
    agent: 'coo',
    suggestions: [
      'Ordens de produção com atraso',
      'Análise de OEE por linha nas últimas 24h',
      'Bottlenecks atuais no chão de fábrica',
    ],
  },
  {
    match: /^\/fiscal|\/nfe|\/sped/,
    label: 'Fiscal',
    agent: 'cfo',
    suggestions: [
      'NF-e rejeitadas nas últimas 24h e motivos',
      'Divergências fiscais em aberto',
      'Resumo de apuração de ICMS/PIS/COFINS do mês',
    ],
  },
  {
    match: /^\/purchases|\/purchasing/,
    label: 'Compras',
    agent: 'coo',
    suggestions: [
      'Pedidos de compra aguardando aprovação',
      'Fornecedores com pior OTD nos últimos 90 dias',
      'Sugira consolidação de compras recorrentes',
    ],
  },
  {
    match: /^\/executive|\/dashboards?|\/$/,
    label: 'Executivo',
    agent: 'ceo',
    suggestions: [
      'Briefing executivo do dia',
      'Principais riscos e oportunidades agora',
      'Compare desempenho vs. mês anterior',
    ],
  },
];

function contextFor(pathname: string) {
  return (
    ROUTE_CONTEXT.find((c) => c.match.test(pathname)) ?? {
      label: 'Geral',
      agent: 'geral',
      suggestions: [
        'Resuma o estado atual do meu negócio',
        'Que ações prioritárias devo tomar hoje?',
        'Aponte anomalias nos últimos 7 dias',
      ],
    }
  );
}

export function BrainDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const location = useLocation();
  const { messages, loading, send, clear } = useBrainChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ctx = useMemo(() => contextFor(location.pathname), [location.pathname]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(BRAIN_OPEN_EVENT, handler);
    return () => window.removeEventListener(BRAIN_OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || loading) return;
    setInput('');
    await send(`[Contexto: ${ctx.label} · rota ${location.pathname}]\n${value}`, ctx.agent);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
        aria-describedby="brain-drawer-desc"
      >
        <SheetHeader className="px-4 py-3 border-b space-y-1">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                <Brain className="h-4 w-4 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
              </span>
              <span>Cérebro Contextual</span>
            </SheetTitle>
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" /> {ctx.label}
            </Badge>
          </div>
          <SheetDescription id="brain-drawer-desc" className="text-xs">
            Análises e ações da IA com o contexto da tela atual pré-carregado.
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Sugestões para {ctx.label}
              </p>
              <div className="grid gap-2">
                {ctx.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="text-left text-sm p-3 rounded-lg border bg-card hover:bg-accent/40 hover:border-primary/40 transition-colors"
                  >
                    <MessageSquare className="inline h-3.5 w-3.5 mr-2 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col gap-1 text-sm',
                  m.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[90%] rounded-lg px-3 py-2 whitespace-pre-wrap break-words',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {m.content}
                </div>
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.actions.map((a, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {a.tool}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Cérebro pensando...
            </div>
          )}
        </div>

        <div className="border-t p-3 space-y-2">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Pergunte algo sobre ${ctx.label}...`}
              rows={2}
              className="resize-none text-sm"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={messages.length === 0}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Limpar
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              <Link to="/executive/brain">
                Abrir Cérebro completo <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
