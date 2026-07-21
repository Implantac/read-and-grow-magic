import { Link2, Mail, MessageCircle, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BulkResultItem = { id: string; name: string; ok: boolean; error?: string };
export type BulkResult = { title: string; items: BulkResultItem[] } | null;

export const CHANNELS = [
  { v: 'link', label: 'Link manual', icon: Link2 },
  { v: 'email', label: 'E-mail', icon: Mail },
  { v: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { v: 'sms', label: 'SMS', icon: MessageCircle },
  { v: 'qr', label: 'QR Code', icon: QrCode },
];

export const PAGE_SIZE = 20;

export function KPI({ label, value, sub, tone = 'default' }: { label: string; value: number | string; sub?: string; tone?: 'default' | 'success' | 'warn' | 'danger' | 'info' }) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-green-500',
    warn: 'text-amber-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  }[tone];
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any; className?: string }> = {
    pending: { label: 'Pendente', variant: 'secondary' },
    sent: { label: 'Enviado', variant: 'default' },
    opened: { label: 'Aberto', variant: 'default', className: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
    responded: { label: 'Respondido', variant: 'default', className: 'bg-green-500/20 text-green-500 border-green-500/30' },
    bounced: { label: 'Falha', variant: 'outline', className: 'text-red-500 border-red-500/40' },
    failed: { label: 'Falha', variant: 'outline', className: 'text-red-500 border-red-500/40' },
    revoked: { label: 'Revogado', variant: 'outline' },
  };
  const s = map[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
}

export function useTokensMap(invites: any[]) {
  const inviteIds = useMemo(() => invites.map((i) => i.id), [invites]);
  const { data } = useQuery({
    queryKey: ['nps', 'tokens', inviteIds.join(',')],
    enabled: inviteIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('nps_tokens').select('invite_id,token').in('invite_id', inviteIds);
      return data ?? [];
    },
  });
  return useMemo(() => {
    const m = new Map<string, string>();
    (data ?? []).forEach((t: any) => { if (t.invite_id) m.set(t.invite_id, t.token); });
    return m;
  }, [data]);
}
