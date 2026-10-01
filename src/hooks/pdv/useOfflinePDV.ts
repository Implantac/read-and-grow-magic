import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  listQueue,
  queueSize,
  markFailure,
  type QueuedNFCe,
} from '@/lib/pdv/offlineQueue';

/**
 * Offline-first PDV hook.
 * - Monitors network status.
 * Mantém a fila legada visível, sem autorizar notas sem retorno fiscal oficial.
 */
export function useOfflinePDV() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [size, setSize] = useState<number>(queueSize());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    const change = () => setSize(queueSize());
    window.addEventListener('online', goOn);
    window.addEventListener('offline', goOff);
    window.addEventListener('pdv-queue-changed', change);
    return () => {
      window.removeEventListener('online', goOn);
      window.removeEventListener('offline', goOff);
      window.removeEventListener('pdv-queue-changed', change);
    };
  }, []);

  const submitOne = useCallback(async (q: QueuedNFCe) => {
    throw new Error('NFC-e pendente: sincronização fiscal indisponível sem autorização oficial.');
  }, []);

  const flush = useCallback(async () => {
    if (syncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const items = listQueue();
    if (items.length === 0) return;

    setSyncing(true);
    let fail = 0;
    for (const it of items) {
      try {
        await submitOne(it);
      } catch (e: unknown) {
        markFailure(it.id, errorMessage(e));
        fail += 1;
      }
    }
    setSize(queueSize());
    setSyncing(false);

    if (fail > 0) toast.error(`${fail} venda(s) pendente(s): emissão fiscal indisponível. Nenhuma foi autorizada.`);
  }, [submitOne, syncing]);

  const emitOffline = useCallback((payload: QueuedNFCe['payload']) => {
    toast.error('Venda offline indisponível sem sincronização fiscal segura. Nenhuma venda foi registrada.');
    return null;
  }, []);

  return {
    online,
    queueSize: size,
    syncing,
    emitOffline,
    flush,
  };
}
