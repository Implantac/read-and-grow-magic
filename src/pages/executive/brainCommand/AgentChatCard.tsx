import { RefObject, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Textarea } from '@/ui/base/textarea';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Bot, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AGENTS } from './constants';

interface Props {
  messages: any[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  agent: string;
  setAgent: (v: string) => void;
  onSend: () => void;
  onClear: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  chatEndRef: RefObject<HTMLDivElement>;
}

export function AgentChatCard({ messages, loading, input, setInput, agent, setAgent, onSend, onClear, textareaRef, chatEndRef }: Props) {
  const agentToolbarRef = useRef<HTMLDivElement | null>(null);

  const handleAgentKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = agentToolbarRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    if (!buttons || buttons.length === 0) return;
    let next = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    buttons[next].focus();
    setAgent(AGENTS[next].id);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2" id="agentes-titulo">
            <Bot className="h-4 w-4 text-primary" aria-hidden="true" /> Agentes especializados
          </CardTitle>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs" aria-label="Limpar conversa (Ctrl+L)">
              Limpar
            </Button>
          )}
        </div>
        <div ref={agentToolbarRef} role="radiogroup" aria-label="Selecionar agente especializado" className="flex flex-wrap gap-1">
          {AGENTS.map((a, i) => (
            <Button
              key={a.id}
              size="sm"
              variant={agent === a.id ? 'default' : 'outline'}
              onClick={() => setAgent(a.id)}
              onKeyDown={(e) => handleAgentKeyDown(e, i)}
              role="radio"
              aria-checked={agent === a.id}
              tabIndex={agent === a.id ? 0 : -1}
              className="h-7 text-[11px] px-2"
            >
              {a.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <ScrollArea className="h-[380px] border rounded-lg p-3 flex-1">
          <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversa com agente especializado">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">
                💬 Selecione um agente acima e pergunte. Cada persona tem foco e tom próprios.
              </p>
            )}
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    aria-label={m.role === 'user' ? 'Sua mensagem' : 'Resposta do agente'}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    ) : m.content}
                  </div>
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1 max-w-[90%]" role="list" aria-label="Ações executadas">
                      {m.actions.map((a: any, i: number) => (
                        <div
                          key={i}
                          role="listitem"
                          className={`text-[11px] rounded border px-2 py-1 ${a.result?.ok ? 'border-green-500/40 bg-green-500/10' : a.result?.pending_approval ? 'border-amber-500/40 bg-amber-500/10' : 'border-destructive/40 bg-destructive/10'}`}
                        >
                          <span className="font-mono font-semibold" aria-hidden="true">⚙ {a.tool}</span>{' '}
                          <span className="sr-only">Ferramenta {a.tool}: </span>
                          {a.result?.ok ? '✅ executada' : a.result?.pending_approval ? '⏳ aguarda aprovação' : '❌ ' + (a.result?.error || 'falhou')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div role="status" aria-live="polite" className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:120ms]" aria-hidden="true" />
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:240ms]" aria-hidden="true" />
                  <span>cérebro pensando…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </ScrollArea>

        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSend(); }} aria-label="Enviar mensagem ao agente">
          <label htmlFor="brain-cmd-input" className="sr-only">
            Mensagem para o agente {AGENTS.find((a) => a.id === agent)?.label || ''}
          </label>
          <Textarea
            id="brain-cmd-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder={`Pergunte ao ${AGENTS.find((a) => a.id === agent)?.label || 'agente'}... (atalho: /)`}
            className="resize-none"
            rows={2}
            aria-describedby="brain-cmd-hint"
          />
          <span id="brain-cmd-hint" className="sr-only">
            Pressione Enter para enviar, Shift+Enter para nova linha, Esc para limpar, Ctrl+L para limpar a conversa.
          </span>
          <Button type="submit" disabled={loading || !input.trim()} aria-label="Enviar mensagem">
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
