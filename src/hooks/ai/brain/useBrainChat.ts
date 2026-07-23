import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeBrainText } from './sanitize';
import type { BrainChatAction, BrainChatMessage } from './types';

export function useBrainChat() {
  const [messages, setMessages] = useState<BrainChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (text: string, agent: string = 'geral') => {
    const userMsg: BrainChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: 'chat', messages: history, agent },
      });
      let payload = (data ?? {}) as { content?: string; actions?: BrainChatAction[]; error?: string; message?: string; required_plan?: string };
      if (error) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resp = (error as any)?.context;
          if (resp && typeof resp.json === 'function') {
            payload = { ...(await resp.json()), ...payload };
          }
        } catch { /* ignore */ }
        if (!payload.error) throw error;
      }
      if (payload.error === 'PLAN_REQUIRED') {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: `⚠️ ${payload.message || 'Plano da IA insuficiente.'}${payload.required_plan ? ` (Requer: ${payload.required_plan})` : ''}` },
        ]);
        return;
      }
      if (payload.error === 'QUOTA_EXCEEDED' || payload.error === 'quota_exceeded') {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: `⚠️ ${payload.message || 'Cota mensal de IA atingida. Faça upgrade para continuar.'}` },
        ]);
        return;
      }
      if (payload.error === 'RATE_LIMITED') {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: `⏳ ${payload.message || 'Limite de requisições atingido. Tente novamente em instantes.'}` },
        ]);
        return;
      }
      if (payload.error) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: `❌ ${payload.message || 'Falha ao processar.'}` },
        ]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: sanitizeBrainText(payload.content || '—'), actions: payload.actions || [] },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: '❌ ' + message },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clear = useCallback(() => setMessages([]), []);
  return { messages, loading, send, clear };
}
