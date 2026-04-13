import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useERPAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-erp-assistant', {
        body: { action: 'chat', messages: chatHistory },
      });

      if (error) {
        const msg = error.message?.includes('429')
          ? 'Limite de requisições excedido. Aguarde um momento.'
          : error.message?.includes('402')
          ? 'Créditos insuficientes.'
          : error.message || 'Erro ao processar';
        toast({ title: 'Erro', description: msg, variant: 'destructive' });
        throw error;
      }

      const assistantMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.content || 'Não foi possível processar.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('ERP Assistant error:', e);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '❌ Ocorreu um erro ao processar sua solicitação. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat };
}

export function useDailySummary() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-erp-assistant', {
        body: { action: 'daily_summary' },
      });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao gerar resumo', description: e.message, variant: 'destructive' });
    },
  });
}
