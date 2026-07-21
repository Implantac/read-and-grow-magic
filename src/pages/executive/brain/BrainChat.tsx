import { useRef, useState, useEffect } from 'react';
import { Brain, Send, ArrowDown, User2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Textarea } from '@/ui/base/textarea';
import { ScrollArea } from '@/ui/base/scroll-area';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { SUGGESTED_PROMPTS } from './constants';

interface BrainChatProps {
  messages: any[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: (text?: string) => void;
  onClear: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function BrainChat({ messages, loading, input, setInput, onSend, onClear, textareaRef }: BrainChatProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const handleScroll = () => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  };

  const handleSuggestionsKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(suggestionsRef.current?.querySelectorAll<HTMLButtonElement>('button[data-suggestion]') ?? []);
    if (buttons.length === 0) return;
    const idx = buttons.findIndex((b) => b === document.activeElement);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); buttons[(idx + 1 + buttons.length) % buttons.length]?.focus(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); buttons[(idx - 1 + buttons.length) % buttons.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); buttons[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); buttons[buttons.length - 1]?.focus(); }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <CardTitle className="text-sm font-medium">Conversa com o cérebro</CardTitle>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs" aria-label="Limpar conversa" aria-keyshortcuts="Control+L">
            Limpar
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <ScrollArea ref={scrollRef} className="h-[500px]" onScrollCapture={handleScroll}>
            <div className="p-5 space-y-4" role="log" aria-live="polite" aria-relevant="additions text" aria-busy={loading} aria-label="Histórico da conversa com o Cérebro Nativo">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-5">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20" aria-hidden="true">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Comece uma conversa</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Pergunte sobre KPIs, financeiro, vendas, produção. O cérebro tem acesso a tudo e memória de longo prazo.
                    </p>
                  </div>
                  <div ref={suggestionsRef} role="toolbar" aria-label="Sugestões de perguntas" onKeyDown={handleSuggestionsKey} className="flex flex-wrap justify-center gap-2 px-4">
                    {SUGGESTED_PROMPTS.map((p, i) => (
                      <button
                        key={p}
                        data-suggestion
                        type="button"
                        tabIndex={i === 0 ? 0 : -1}
                        onClick={() => onSend(p.replace(/^\S+\s/, ''))}
                        className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <article key={m.id} aria-label={m.role === 'user' ? 'Sua mensagem' : 'Resposta do Cérebro'} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div aria-hidden="true" className={cn(
                    'shrink-0 h-8 w-8 rounded-full flex items-center justify-center ring-1',
                    m.role === 'user' ? 'bg-primary/15 ring-primary/30' : 'bg-gradient-to-br from-primary/20 to-orange-500/10 ring-primary/30',
                  )}>
                    {m.role === 'user' ? <User2 className="h-4 w-4 text-primary" /> : <Brain className="h-4 w-4 text-primary" />}
                  </div>
                  <div className={cn('flex flex-col gap-1 max-w-[78%]', m.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn('rounded-2xl px-4 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm')}>
                      {m.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:mt-2 prose-headings:mb-1">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      )}
                    </div>
                    {m.actions && m.actions.length > 0 && (
                      <ul className="flex flex-col gap-1 w-full list-none p-0 m-0" aria-label="Ações executadas">
                        {m.actions.map((a: any, i: number) => (
                          <li key={i} className={cn(
                            'text-[11px] rounded-lg border px-2.5 py-1.5 flex items-center gap-2',
                            a.result?.ok && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                            a.result?.pending_approval && 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                            !a.result?.ok && !a.result?.pending_approval && 'border-destructive/30 bg-destructive/10 text-destructive',
                          )}>
                            <Zap className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="font-mono font-semibold">{a.tool}</span>
                            <span className="opacity-80">
                              {a.result?.ok ? '· executada' : a.result?.pending_approval ? '· aguarda aprovação' : `· ${a.result?.error || 'falhou'}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <div className="flex gap-3 items-center" role="status" aria-label="Cérebro processando resposta">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/10 ring-1 ring-primary/30 flex items-center justify-center" aria-hidden="true">
                    <Brain className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:120ms]" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:240ms]" />
                  </div>
                  <span className="sr-only">Processando…</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {showScrollBtn && (
            <Button size="icon" variant="secondary" onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })} className="absolute bottom-3 right-4 h-8 w-8 rounded-full shadow-lg" aria-label="Rolar para a última mensagem">
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <form className="border-t bg-muted/20 p-3" onSubmit={(e) => { e.preventDefault(); onSend(); }} aria-label="Enviar mensagem ao Cérebro Nativo">
          <label htmlFor="brain-composer" className="sr-only">Mensagem para o Cérebro Nativo</label>
          <div className="relative flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
            <Textarea
              id="brain-composer"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
                else if (e.key === 'Escape' && input) { e.preventDefault(); setInput(''); }
              }}
              placeholder="Pergunte qualquer coisa sobre o seu negócio..."
              aria-label="Mensagem para o Cérebro Nativo"
              aria-describedby="brain-composer-hint"
              aria-keyshortcuts="Enter Shift+Enter Escape"
              aria-multiline="true"
              disabled={loading}
              className="resize-none border-0 focus-visible:ring-0 shadow-none min-h-[44px] max-h-32 px-2"
              rows={1}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-9 w-9 shrink-0 rounded-lg" aria-label="Enviar mensagem">
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <p id="brain-composer-hint" className="mt-2 text-[10px] text-muted-foreground text-center">
            Enter envia · Shift+Enter quebra linha · Esc limpa · / foca o chat · Ctrl+K busca memórias · Ctrl+L limpa conversa · Alt+1–4 alterna abas
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
