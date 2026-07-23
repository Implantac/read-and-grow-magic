import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage } from './types';
import {
  SESSION_TIMEOUT_MS,
  sessionKeyFor,
  purgeOtherSessionKeys,
  loadSession,
  saveSession,
} from './sessionStore';

export function useUnifiedChat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current user ID, then load tenant-scoped session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || null;
      setUserId(uid);
      purgeOtherSessionKeys(uid);
      setMessages(loadSession(uid));
    });
  }, []);

  // Persist messages to sessionStorage on every change
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(userId, messages);
    }
  }, [messages, userId]);

  // Load server-side history on mount if session is empty
  useEffect(() => {
    if (messages.length === 0 && userId) {
      supabase
        .from('ai_executive_chat')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(30)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const restored = data.map((m: any) => ({
              id: crypto.randomUUID(),
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
            }));
            setMessages(restored);
          }
        });
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset inactivity timer on every interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setMessages([]);
      sessionStorage.removeItem(sessionKeyFor(userId));
    }, SESSION_TIMEOUT_MS);
  }, [userId]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    resetInactivityTimer();

    const userMsg: ChatMessage = {
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

      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'assistant_chat', messages: chatHistory, user_id: userId },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.content || 'Não foi possível processar.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Chat error:', e);
      const errMsg = e instanceof Error ? e.message : '';
      let content = '❌ Erro ao processar. Tente novamente.';
      if (errMsg.includes('429')) content = '⏳ Limite de requisições excedido. Aguarde alguns minutos.';
      else if (errMsg.includes('402')) content = '💳 Créditos insuficientes. Adicione créditos em Configurações > Workspace.';

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, resetInactivityTimer, userId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem(sessionKeyFor(userId));
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (userId) {
      supabase.functions.invoke('ai-executive', {
        body: { action: 'clear_history', user_id: userId },
      }).catch(() => {});
    }
  }, [userId]);

  return { messages, isLoading, sendMessage, clearChat };
}
