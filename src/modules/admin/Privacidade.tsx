import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Switch } from '@/ui/base/switch';
import { Label } from '@/ui/base/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ShieldCheck, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/errors';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

interface RequestRow {
  id: string;
  request_type: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  rejection_reason: string | null;
}

interface ConsentRow {
  id: string;
  consent_type: string;
  accepted: boolean;
  version: string;
  created_at: string;
}

const CONSENT_TYPES: { key: string; label: string; description: string }[] = [
  { key: 'terms', label: 'Termos de Uso', description: 'Aceite das condições contratuais da plataforma.' },
  { key: 'privacy_policy', label: 'Política de Privacidade', description: 'Tratamento de dados pessoais conforme LGPD.' },
  { key: 'marketing', label: 'Comunicações de marketing', description: 'Novidades, dicas e ofertas por e-mail ou WhatsApp.' },
  { key: 'analytics', label: 'Telemetria de uso', description: 'Métricas anônimas para melhoria do produto.' },
];

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Em análise', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  rejected: { label: 'Recusada', variant: 'destructive' },
};

const TYPE_LABEL: Record<string, string> = {
  export: 'Exportação de dados',
  delete: 'Exclusão / anonimização',
  rectify: 'Retificação',
};

export default function Privacidade() {
  const { currentCompany } = useEnterprise();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) { setLoading(false); return; }
    const [req, con] = await Promise.all([
      supabase.from('lgpd_data_requests')
        .select('id, request_type, status, requested_at, completed_at, rejection_reason')
        .eq('user_id', uid).order('requested_at', { ascending: false }).limit(100),
      supabase.from('lgpd_consents')
        .select('id, consent_type, accepted, version, created_at')
        .eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
    ]);
    setRequests((req.data ?? []) as RequestRow[]);
    setConsents((con.data ?? []) as ConsentRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const latestConsent = (type: string) => consents.find((c) => c.consent_type === type);

  const toggleConsent = async (type: string, accepted: boolean) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (!uid) return;
      const { error } = await supabase.from('lgpd_consents').insert({
        user_id: uid,
        company_id: currentCompany?.id ?? null,
        consent_type: type,
        accepted,
        version: '1.0',
        user_agent: navigator.userAgent,
      });
      if (error) throw error;
      toast.success(accepted ? 'Consentimento registrado' : 'Consentimento revogado');
      void load();
    } catch (e: unknown) {
      toast.error(errorMessage(e));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('lgpd-export');
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo gerado — o download foi iniciado.');
      void load();
    } catch (e: unknown) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('lgpd-delete', { body: { confirm: 'DELETE' } });
      if (error) throw error;
      const msg = (data as { message?: string } | null)?.message;
      toast.success(msg ?? 'Solicitação processada.');
      setConfirmOpen(false);
      setConfirmText('');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e: unknown) {
      toast.error(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Privacidade e Dados (LGPD)"
        description="Consulte, exporte ou solicite a exclusão dos seus dados pessoais, e gerencie consentimentos."
        icon={ShieldCheck}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" /> Exportar meus dados
            </CardTitle>
            <CardDescription>
              Direito de acesso e portabilidade (LGPD, art. 18, II e V). Gera um arquivo JSON com
              perfil, consentimentos, solicitações e trilha de auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Baixar arquivo
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4" /> Excluir minha conta
            </CardTitle>
            <CardDescription>
              Direito de eliminação (art. 18, VI). Seus dados pessoais são anonimizados de forma
              irreversível. Documentos fiscais já emitidos permanecem retidos pelo prazo legal de
              5 anos (art. 16, II).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Solicitar exclusão
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consentimentos</CardTitle>
          <CardDescription>Cada alteração é registrada com data, versão e dispositivo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_TYPES.map((c) => {
            const current = latestConsent(c.key);
            return (
              <div key={c.key} className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
                <div>
                  <Label htmlFor={`consent-${c.key}`} className="text-sm font-medium">{c.label}</Label>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  {current && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Última atualização: {format(new Date(current.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · v{current.version}
                    </p>
                  )}
                </div>
                <Switch
                  id={`consent-${c.key}`}
                  checked={!!current?.accepted}
                  onCheckedChange={(v) => toggleConsent(c.key, v)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de solicitações</CardTitle>
          <CardDescription>Trilha auditável exigida pela LGPD.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma solicitação registrada"
              description="Exportações e pedidos de exclusão aparecerão aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Concluído em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const st = STATUS_LABEL[r.status] ?? { label: r.status, variant: 'outline' as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{TYPE_LABEL[r.request_type] ?? r.request_type}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>{format(new Date(r.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell>
                        {r.completed_at ? format(new Date(r.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => { setConfirmOpen(v); if (!v) setConfirmText(''); }}
        title="Excluir permanentemente seus dados?"
        description="Esta ação anonimiza seu perfil, encerra todas as sessões e não pode ser desfeita. Digite EXCLUIR para confirmar."
        confirmLabel={deleting ? 'Processando…' : 'Confirmar exclusão'}
        variant="destructive"
        onConfirm={handleDelete}
        disabled={confirmText !== 'EXCLUIR' || deleting}
      >
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="EXCLUIR"
          aria-label="Confirmação de exclusão"
        />
      </ConfirmDialog>
    </PageContainer>
  );
}
