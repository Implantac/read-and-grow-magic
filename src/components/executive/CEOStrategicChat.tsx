import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Brain, Send, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/hooks/useExecutiveAI';

const strategicPrompts = [
  '🎯 Quais decisões estratégicas devo tomar esta semana?',
  '⚠️ Quais são os maiores riscos do negócio agora?',
  '💰 Como melhorar minha margem de lucro?',
  '📈 Onde estão minhas melhores oportunidades de crescimento?',
];

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (msg: string) => void;
  clearChat: () => void;
}

export function CEOStrategicChat({ messages, isLoading, sendMessage, clearChat }: Props) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <Card className="flex flex-col h-[520px]">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Chat Estratégico — IA CEO</CardTitle>
              <p className="text-[10px] text-muted-foreground">Discuta decisões, valide hipóteses e simule estratégias</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs gap-1">
              <Trash2 className="h-3 w-3" />Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <Brain className="h-12 w-12 text-primary/30 mb-3" />
              <p className="text-sm font-medium mb-1">Pense como CEO</p>
              <p className="text-xs text-muted-foreground mb-5 max-w-md">
                Faça perguntas estratégicas e a IA usará dados reais da empresa para te apoiar nas decisões.
              </p>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 max-w-lg w-full">
                {strategicPrompts.map(p => (
                  <Button key={p} variant="outline" size="sm" className="text-xs h-auto py-2 text-left justify-start" onClick={() => sendMessage(p)}>
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[90%] rounded-2xl px-4 py-3', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5
                        [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1
                        [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-1.5
                        [&_ul]:text-xs [&_ul]:space-y-0.5 [&_ul]:my-1.5 [&_ul]:pl-4
                        [&_ol]:text-xs [&_ol]:space-y-0.5 [&_ol]:my-1.5 [&_ol]:pl-4
                        [&_strong]:text-foreground [&_strong]:font-semibold
                        [&_hr]:my-2.5 [&_hr]:border-border/40
                      ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className={cn('text-[10px] mt-1.5 pt-1 border-t border-current/10', msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analisando...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Pergunte como um CEO faria..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
