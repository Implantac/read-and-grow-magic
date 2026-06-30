import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/ui/base/card';
import { PackagePlus, MapPin, ListChecks, ScanBarcode, ArrowRight } from 'lucide-react';

async function fetchCounts() {
  const [recv, put, pick] = await Promise.all([
    supabase.from('wms_receiving_orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('putaway_tasks').select('id', { count: 'exact', head: true }).in('status', ['pending', 'assigned']),
    supabase.from('wms_picking_orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'assigned', 'in_progress']),
  ]);
  return {
    receiving: recv.count ?? 0,
    putaway: put.count ?? 0,
    picking: pick.count ?? 0,
  };
}

const tiles = [
  { to: '/coletor/recebimento', label: 'Recebimento', icon: PackagePlus, key: 'receiving' as const, desc: 'Conferir notas e produtos' },
  { to: '/coletor/putaway', label: 'Guarda (Put-away)', icon: MapPin, key: 'putaway' as const, desc: 'Endereçar pallets' },
  { to: '/coletor/picking', label: 'Separação', icon: ListChecks, key: 'picking' as const, desc: 'Picking de pedidos' },
];

export default function ColetorHome() {
  const { data, isLoading } = useQuery({ queryKey: ['coletor-counts'], queryFn: fetchCounts, refetchInterval: 30000 });

  return (
    <div className="p-4 space-y-4">
      <section aria-label="Resumo" className="rounded-xl border bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 grid place-items-center">
            <ScanBarcode className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Bom turno!</h1>
            <p className="text-xs text-muted-foreground">Selecione uma tarefa para começar a operar.</p>
          </div>
        </div>
      </section>

      <ul className="space-y-3" aria-label="Tarefas disponíveis">
        {tiles.map(({ to, label, icon: Icon, key, desc }) => {
          const count = data?.[key] ?? 0;
          return (
            <li key={to}>
              <Link to={to} className="block">
                <Card className="p-4 active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                      <Icon className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate">{label}</p>
                        <span
                          className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
                          aria-label={`${count} tarefas pendentes`}
                        >
                          {isLoading ? '…' : count}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Dica: instale o Coletor na tela inicial pelo menu do navegador.
      </p>
    </div>
  );
}
