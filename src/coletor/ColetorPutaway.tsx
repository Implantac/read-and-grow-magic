import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner, type ScanFeedback } from '@/components/wms/BarcodeScanner';
import { Card } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { ArrowLeft, MapPin, CheckCircle2 } from 'lucide-react';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

async function fetchTasks() {
  const { data, error } = await supabase
    .from('putaway_tasks')
    .select('id, product_code, product_name, quantity, from_location, to_location, status, priority')
    .in('status', ['pending', 'assigned'])
    .order('priority', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export default function ColetorPutaway() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const tasks = useQuery({ queryKey: ['coletor-putaway'], queryFn: fetchTasks });
  const active = tasks.data?.find(t => t.id === activeId);

  const onScan = async (code: string): Promise<ScanFeedback> => {
    if (!active) return { type: 'error', message: 'Selecione uma tarefa' };
    if (code.trim().toUpperCase() !== String(active.to_location).toUpperCase()) {
      return { type: 'error', message: `Endereço errado. Esperado ${active.to_location}`, code };
    }
    const { error } = await supabase
      .from('putaway_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', active.id);
    if (error) return { type: 'error', message: 'Falha ao concluir', code };
    toastSuccess('Endereçamento confirmado');
    setActiveId(null);
    qc.invalidateQueries({ queryKey: ['coletor-putaway'] });
    qc.invalidateQueries({ queryKey: ['coletor-counts'] });
    return { type: 'success', message: 'Endereço correto', code };
  };

  if (!active) {
    return (
      <div className="p-4 space-y-3">
        <h1 className="text-lg font-semibold">Guarda (Put-away)</h1>
        <p className="text-xs text-muted-foreground">Toque numa tarefa para iniciar o endereçamento.</p>
        {tasks.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {tasks.data?.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">Sem tarefas pendentes.</Card>
        )}
        <ul className="space-y-2" aria-label="Tarefas de put-away">
          {tasks.data?.map(t => (
            <li key={t.id}>
              <button onClick={() => setActiveId(t.id)} className="w-full text-left active:scale-[0.99] transition-transform">
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.product_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {t.from_location || '—'} → {t.to_location}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{t.quantity}</Badge>
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setActiveId(null)} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold flex-1 truncate">{active.product_name}</h1>
      </div>

      <Card className="p-4 space-y-2 bg-primary/5 border-primary/30">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Destino esperado</p>
        <p className="text-3xl font-bold font-mono tracking-wider">{active.to_location}</p>
        <p className="text-xs text-muted-foreground">Quantidade: {active.quantity}</p>
      </Card>

      <BarcodeScanner onScan={onScan} placeholder="Escaneie o endereço de destino" />

      <p className="text-[11px] text-muted-foreground text-center">
        Aponte o leitor para a etiqueta da posição. Não conferindo? Avise o supervisor.
      </p>
    </div>
  );
}
