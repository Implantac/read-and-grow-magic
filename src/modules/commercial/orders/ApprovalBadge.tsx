import { Badge } from '@/ui/base/badge';

export function ApprovalBadge({ status }: { status: string | null }) {
  if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Aprovado</Badge>;
  if (status === 'rejected') return <Badge variant="destructive" className="text-[10px]">Rejeitado</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Pendente</Badge>;
}
