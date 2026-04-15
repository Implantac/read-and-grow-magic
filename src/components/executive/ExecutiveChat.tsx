import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Brain, Send, Loader2, Trash2, Sparkles, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/hooks/useExecutiveAI';

const quickActions = [
  { label: '💰 Resumo Financeiro', prompt: 'Qual o resumo financeiro de hoje? Saldos, vencimentos e inadimplência.' },
  { label: '📊 Vencimentos Hoje', prompt: 'Quais contas vencem hoje? Quanto vou receber e pagar?' },
  { label: '🛒 Status Comercial', prompt: 'Como está o comercial? Pedidos recentes, funil e metas.' },
  { label: '🏭 Produção', prompt: 'Qual o status da produção? Ordens ativas, atrasadas e eficiência.' },
  { label: '📦 Estoque Crítico', prompt: 'Quais produtos estão abaixo do mínimo?' },
  { label: '⚠️ Contas Atrasadas', prompt: 'Liste todas as contas atrasadas com valores.' },
  { label: '🎯 Análise Estratégica', prompt: 'Faça uma análise estratégica completa da empresa com riscos e oportunidades.' },
  { label: '📈 Performance', prompt: 'Como está a performance da empresa? Receita, margem, crescimento e metas.' },
];

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (msg: string) => void;
  clearChat: () => void;
  onDailySummary: () => void;
  dailySummaryPending: boolean;
}

export function ExecutiveChat({ messages, isLoading, sendMessage, clearChat, onDailySummary, dailySummaryPending }: Props) {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!chatInput.trim() || isLoading) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex gap-4">
      {/* Sidebar Quick Actions */}
      <div className="hidden lg:flex flex-col w-60 shrink-0 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {quickActions.map((action, i) => (
              <Button key={i} variant="ghost" size="sm" className="w-full justify-start text-left h-auto py-2 px-3" onClick={() => !isLoading && sendMessage(action.prompt)} disabled={isLoading}>
                <span className="text-xs leading-tight">{action.label}</span>
              </Button>
            ))}
            <Separator className="my-2" />
            <Button variant="outline" size="sm" className="w-full" onClick={onDailySummary} disabled={dailySummaryPending || isLoading}>
              <FileText className="h-4 w-4 mr-1" />{dailySummaryPending ? 'Gerando...' : 'Resumo do Dia'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">🔍 Consultas</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>"Fluxo de caixa dos próximos 15 dias"</li>
                <li>"Quais OPs estão atrasadas?"</li>
                <li>"Top 5 clientes por faturamento"</li>
              </ul>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">⚙️ Ações</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>"Registrar pagamento da conta X"</li>
                <li>"Priorizar OP-2024001"</li>
                <li>"Adiar vencimento para dia 30"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat */}
      <Card className="flex-1 h-[650px] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Diretor Digital</CardTitle>
                <p className="text-[10px] text-muted-foreground">Consultas · Ações · Análises Estratégicas</p>
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
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-10 w-10 text-primary/40" />
                </div>
                <p className="text-sm font-medium mb-1">Diretor Digital</p>
                <p className="text-xs text-muted-foreground mb-6 max-w-md">
                  Seu assistente executivo unificado. Faça perguntas, peça análises ou execute ações no sistema — tudo por linguagem natural.
                </p>
                <div className="grid gap-2 grid-cols-2 max-w-lg">
                  {quickActions.slice(0, 6).map(a => (
                    <Button key={a.label} variant="outline" size="sm" className="text-xs h-auto py-2" onClick={() => sendMessage(a.prompt)}>
                      {a.label}
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
                          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-foreground
                          [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-foreground
                          [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-1.5
                          [&_strong]:text-foreground [&_strong]:font-semibold
                          [&_table]:text-[11px] [&_table]:w-full [&_table]:border-collapse [&_table]:my-2
                          [&_th]:bg-muted-foreground/10 [&_th]:text-left [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-border/50 [&_th]:font-semibold [&_th]:text-foreground
                          [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-border/50
                          [&_ul]:text-xs [&_ul]:space-y-0.5 [&_ul]:my-1.5 [&_ul]:pl-4
                          [&_ol]:text-xs [&_ol]:space-y-0.5 [&_ol]:my-1.5 [&_ol]:pl-4
                          [&_li]:leading-relaxed
                          [&_hr]:my-2.5 [&_hr]:border-border/40
                          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-xs
                          [&_code]:text-[10px] [&_code]:bg-muted-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                        ">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                      <span className="text-sm text-muted-foreground">Processando...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Mobile quick actions */}
          <div className="lg:hidden border-t px-3 py-2 flex gap-1.5 overflow-x-auto">
            {quickActions.slice(0, 4).map((a, i) => (
              <Button key={i} variant="outline" size="sm" className="text-[10px] shrink-0 h-7 px-2" onClick={() => !isLoading && sendMessage(a.prompt)} disabled={isLoading}>
                {a.label}
              </Button>
            ))}
          </div>

          <div className="border-t p-3 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Pergunte, analise ou execute ações..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !chatInput.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
