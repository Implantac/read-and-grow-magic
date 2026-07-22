import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { publicSurveyUrl } from '../hooks';
import { exportToCSV } from '@/lib/exportUtils';
import type { BulkResult, BulkResultItem } from './parts';

export function useInvitesActions(
  invites: any[],
  setBulkResult: (r: BulkResult) => void,
  setSelectedInvites: (s: Set<string>) => void,
) {
  const qc = useQueryClient();

  const inviteNameById = (id: string) => {
    const inv = invites.find((i) => i.id === id);
    return inv?.clients?.name || inv?.clients?.email || inv?.clients?.phone || id.slice(0, 8);
  };

  const revoke = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const { error } = await supabase.from('nps_invites').update({ status: 'revoked' }).eq('id', id);
          return { id, name: inviteNameById(id), ok: !error, error: error?.message };
        }),
      );
      return results;
    },
    onSuccess: (items) => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      const ok = items.filter((r) => r.ok).length;
      const fail = items.length - ok;
      if (fail === 0) toast.success(`${ok} convite(s) revogado(s)`);
      else toast.error(`${ok} revogado(s) · ${fail} falha(s)`);
      if (fail > 0) setBulkResult({ title: 'Resultado da revogação', items });
      setSelectedInvites(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendInvites = useMutation({
    mutationFn: async (invite_ids?: string[]) => {
      const { data, error } = await supabase.functions.invoke('nps-send-invite', { body: invite_ids ? { invite_ids } : {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      const sent = d?.sent ?? 0;
      const failed = d?.failed ?? 0;
      const results: any[] = Array.isArray(d?.results) ? d.results : [];
      const items: BulkResultItem[] = results.map((r) => ({
        id: r.id, name: inviteNameById(r.id), ok: !!r.ok, error: r.error,
      }));
      if (failed === 0) toast.success(`Enviados: ${sent}`);
      else toast.error(`Enviados: ${sent} · Falhas: ${failed}`);
      if (items.length > 0 && (failed > 0 || items.length > 1)) {
        setBulkResult({ title: 'Resultado do envio', items });
      }
      setSelectedInvites(new Set());
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao enviar'),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_invites').update({ status: 'pending' }).eq('id', id);
      if (error) throw error;
      const { data, error: err2 } = await supabase.functions.invoke('nps-send-invite', { body: { invite_ids: [id] } });
      if (err2) throw err2;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Convite reenviado'); },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao reenviar'),
  });

  const shareUrl = (token: string, ch: string, contact?: { email?: string | null; phone?: string | null; name?: string | null }) => {
    const link = publicSurveyUrl(token);
    if (ch === 'whatsapp' && contact?.phone) {
      const msg = encodeURIComponent(`Olá ${contact.name ?? ''}, sua opinião é muito importante para nós. Responda em 1 minuto: ${link}`);
      const phone = contact.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      return;
    }
    if (ch === 'email' && contact?.email) {
      const subj = encodeURIComponent('Sua opinião conta');
      const body = encodeURIComponent(`Olá ${contact.name ?? ''},\n\nSua opinião é muito importante. Responda em 1 minuto:\n${link}`);
      window.open(`mailto:${contact.email}?subject=${subj}&body=${body}`, '_self');
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  const copyAllLinks = async (selectedInvites: Set<string>) => {
    const ids = Array.from(selectedInvites);
    if (ids.length === 0) return;
    const { data: tokens, error } = await supabase.from('nps_tokens').select('invite_id,token').in('invite_id', ids);
    if (error) { toast.error('Erro ao buscar tokens'); return; }
    const map = new Map<string, string>();
    (tokens ?? []).forEach((t: any) => { if (t.invite_id) map.set(t.invite_id, t.token); });
    const items: BulkResultItem[] = ids.map((id) => {
      const tk = map.get(id);
      return tk
        ? { id, name: inviteNameById(id), ok: true }
        : { id, name: inviteNameById(id), ok: false, error: 'Token indisponível' };
    });
    const links = items.filter((r) => r.ok).map((r) => publicSurveyUrl(map.get(r.id)!)).join('\n');
    const okCount = items.filter((r) => r.ok).length;
    const failCount = items.length - okCount;
    if (!links) {
      toast.error('Nenhum link disponível');
      setBulkResult({ title: 'Copiar links', items });
      return;
    }
    try {
      await navigator.clipboard.writeText(links);
      if (failCount === 0) toast.success(`${okCount} link(s) copiado(s)`);
      else { toast.error(`${okCount} copiado(s) · ${failCount} sem link`); setBulkResult({ title: 'Copiar links', items }); }
    } catch {
      toast.error('Não foi possível copiar para a área de transferência');
    }
  };

  const exportCsv = (filteredInvites: any[]) => {
    if (filteredInvites.length === 0) { toast.error('Sem dados para exportar'); return; }
    const rows = filteredInvites.map((i) => ({
      cliente: i.clients?.name ?? '',
      email: i.clients?.email ?? '',
      telefone: i.clients?.phone ?? '',
      campanha: i.nps_campaigns?.name ?? '',
      canal: i.channel,
      status: i.status,
      tentativas: i.attempts ?? 0,
      criado_em: i.created_at ? new Date(i.created_at).toLocaleString('pt-BR') : '',
      enviado_em: i.sent_at ? new Date(i.sent_at).toLocaleString('pt-BR') : '',
      aberto_em: i.opened_at ? new Date(i.opened_at).toLocaleString('pt-BR') : '',
      respondido_em: i.responded_at ? new Date(i.responded_at).toLocaleString('pt-BR') : '',
    }));
    exportToCSV(rows as any, [
      { key: 'cliente', label: 'Cliente' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'campanha', label: 'Campanha' },
      { key: 'canal', label: 'Canal' },
      { key: 'status', label: 'Status' },
      { key: 'tentativas', label: 'Tentativas' },
      { key: 'criado_em', label: 'Criado em' },
      { key: 'enviado_em', label: 'Enviado em' },
      { key: 'aberto_em', label: 'Aberto em' },
      { key: 'respondido_em', label: 'Respondido em' },
    ], `nps_convites_${new Date().toISOString().split('T')[0]}`);
    toast.success('Exportado com sucesso');
  };

  return { revoke, sendInvites, resend, shareUrl, copyAllLinks, exportCsv, inviteNameById };
}
