import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Checkbox } from '@/ui/base/checkbox';
import { Badge } from '@/ui/base/badge';
import { Copy, Eye, Mail, MessageCircle, QrCode, RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { publicSurveyUrl } from '../hooks';
import { StatusBadge } from './parts';

interface InvitesTableProps {
  pageInvites: any[];
  filteredInvites: any[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  campaignId?: string;
  tokensByInvite: Map<string, string>;
  selectedInvites: Set<string>;
  setSelectedInvites: (s: Set<string>) => void;
  allPageChecked: boolean;
  togglePageSelection: (v: boolean) => void;
  setQrUrl: (u: string) => void;
  shareUrl: (token: string, ch: string, contact?: any) => void;
  resendMutate: (id: string) => void;
  resendPending: boolean;
  confirmRevokeOne: (id: string) => void;
  setPage: (n: number) => void;
}

export function InvitesTable({
  pageInvites, filteredInvites, currentPage, totalPages, pageSize, campaignId,
  tokensByInvite, selectedInvites, setSelectedInvites, allPageChecked, togglePageSelection,
  setQrUrl, shareUrl, resendMutate, resendPending, confirmRevokeOne, setPage,
}: InvitesTableProps) {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="p-3 w-10"><Checkbox checked={allPageChecked} onCheckedChange={(v) => togglePageSelection(!!v)} /></th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Canal</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Tent.</th>
              <th className="text-left p-3">Enviado</th>
              <th className="text-left p-3">Aberto</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pageInvites.map((i: any) => {
              const tk = tokensByInvite.get(i.id);
              const checked = selectedInvites.has(i.id);
              return (
                <tr key={i.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3">
                    <Checkbox checked={checked} onCheckedChange={(v) => {
                      const s = new Set(selectedInvites);
                      v ? s.add(i.id) : s.delete(i.id);
                      setSelectedInvites(s);
                    }} />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{i.clients?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[240px]">{i.clients?.email ?? i.clients?.phone ?? ''}</div>
                  </td>
                  <td className="p-3"><Badge variant="outline">{i.channel}</Badge></td>
                  <td className="p-3"><StatusBadge status={i.status} /></td>
                  <td className="p-3 text-xs">{i.attempts ?? 0}</td>
                  <td className="p-3 text-xs text-muted-foreground">{i.sent_at ? new Date(i.sent_at).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{i.opened_at ? new Date(i.opened_at).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {tk && (
                        <>
                          <Button size="sm" variant="ghost" title="Abrir pesquisa" onClick={() => window.open(publicSurveyUrl(tk), '_blank')}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Copiar link" onClick={() => { navigator.clipboard.writeText(publicSurveyUrl(tk)); toast.success('Link copiado'); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" title="WhatsApp" onClick={() => shareUrl(tk, 'whatsapp', i.clients)}>
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" title="E-mail" onClick={() => shareUrl(tk, 'email', i.clients)}>
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" title="QR Code" onClick={() => setQrUrl(publicSurveyUrl(tk))}>
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {i.status !== 'responded' && i.status !== 'revoked' && i.channel === 'email' && (
                        <Button size="sm" variant="ghost" title="Reenviar" onClick={() => resendMutate(i.id)} disabled={resendPending}>
                          <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                      )}
                      {i.status !== 'responded' && i.status !== 'revoked' && (
                        <Button size="sm" variant="ghost" title="Revogar" onClick={() => confirmRevokeOne(i.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageInvites.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                {campaignId ? 'Nenhum convite com esses filtros.' : 'Selecione uma campanha para começar.'}
              </td></tr>
            )}
          </tbody>
        </table>

        {filteredInvites.length > pageSize && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
            <span>Página {currentPage} de {totalPages} · {filteredInvites.length} registros</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
