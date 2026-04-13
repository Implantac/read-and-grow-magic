import { useState, useRef, useEffect } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, Send, Trash2, FileText, Loader2, Sparkles, DollarSign, ShoppingCart, Factory, Package } from 'lucide-react';
import { useERPAssistant, useDailySummary } from '@/hooks/useERPAssistant';
import ReactMarkdown from 'react-markdown';

const QUICK_ACTIONS = [
  { label: '💰 Resumo Financeiro', prompt: 'Qual o resumo financeiro de hoje? Saldos, vencimentos e inadimplência.', icon: DollarSign, color: 'text-emerald-500' },
  { label: '📊 Vencimentos Hoje', prompt: 'Quais contas vencem hoje? Quanto vou receber e quanto vou pagar?', icon: FileText, color: 'text-blue-500' },
  { label: '🛒 Status Comercial', prompt: 'Como está o comercial? Pedidos recentes, funil e metas.', icon: ShoppingCart, color: 'text-violet-500' },
  { label: '🏭 Produção', prompt: 'Qual o status da produção? Ordens ativas, atrasadas e eficiência.', icon: Factory, color: 'text-orange-500' },
  { label: '📦 Estoque Crítico', prompt: 'Quais produtos estão abaixo do estoque mínimo? Existe risco de ruptura?', icon: Package, color: 'text-red-500' },
  { label: '⚠️ Contas Atrasadas', prompt: 'Liste todas as contas atrasadas, tanto a pagar quanto a receber.', icon: DollarSign, color: 'text-amber-500' },
];

export default function ERPAssistantPage() {
  const { messages, isLoading, sendMessage, clearChat } = useERPAssistant();
  const dailySummary = useDailySummary();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  const handleDailySummary = async () => {
    const result = await dailySummary.mutateAsync();
    if (result?.resumo_executivo) {
      sendMessage('Gere o resumo executivo diário completo.');
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Assistente ERP Inteligente</h1>
              <p className="text-sm text-muted-foreground">Consulte dados e execute ações por linguagem natural</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearChat} disabled={messages.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" /> Limpar
            </Button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Sidebar - Quick Actions */}
          <div className="hidden lg:flex flex-col w-64 shrink-0 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                  >
                    <span className="text-xs leading-tight">{action.label}</span>
                  </Button>
                ))}
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleDailySummary}
                  disabled={dailySummary.isPending || isLoading}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {dailySummary.isPending ? 'Gerando...' : 'Resumo do Dia'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Exemplos de comandos:</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>"Qual o fluxo de caixa dos próximos 15 dias?"</li>
                  <li>"Liste os top 5 clientes por faturamento"</li>
                  <li>"Quais OPs estão atrasadas?"</li>
                  <li>"Busque o produto 'Parafuso M8'"</li>
                  <li>"Quais clientes estão em risco de churn?"</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Olá! Sou seu Assistente ERP.</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Posso consultar dados financeiros, comerciais, de produção e estoque em tempo real. 
                    Também executo ações no sistema — basta pedir!
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg lg:hidden">
                    {QUICK_ACTIONS.slice(0, 6).map((action, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2"
                        onClick={() => handleQuickAction(action.prompt)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Processando...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite um comando ou pergunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
