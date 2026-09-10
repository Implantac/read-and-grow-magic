import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilePlus, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Badge } from '@/ui/base/badge';
import { formatBRL } from '@/lib/formatters';
import { useCreateNfseDraft, useEnqueueFiscalEmission } from '@/hooks/fiscal/useFiscalEmission';

const initialForm = {
  provider_name: '',
  provider_document: '',
  customer_name: '',
  customer_document: '',
  service_code: '',
  service_description: '',
  city_code: '',
  service_value: '0',
  deductions: '0',
  iss_rate: '0',
};

export default function NFSePage() {
  const [form, setForm] = useState(initialForm);
  const createDraft = useCreateNfseDraft();
  const enqueue = useEnqueueFiscalEmission();
  const nfseQuery = useQuery({
    queryKey: ['nfse'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('nfse')
        .select('id, number, customer_name, service_value, status, issue_date')
        .order('issue_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; number: string; customer_name: string; service_value: number; status: string; issue_date: string }>;
    },
  });

  const update = (field: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const saving = createDraft.isPending || enqueue.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const draft = await createDraft.mutateAsync({
      ...form,
      service_value: Number(form.service_value),
      deductions: Number(form.deductions),
      iss_rate: Number(form.iss_rate),
    }) as { id?: string };
    if (!draft.id) return;
    await enqueue.mutateAsync({ documentType: 'nfse', documentId: draft.id });
    setForm(initialForm);
    await nfseQuery.refetch();
  };

  return (
    <PageContainer>
      <PageHeader
        title="NFS-e - Nota Fiscal de Servico"
        description="Crie o documento, valide os dados municipais e enfileire a transmissao no provedor."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FilePlus className="h-5 w-5 text-primary" />Novo documento</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <div className="space-y-2"><Label>Prestador</Label><Input required value={form.provider_name} onChange={(e) => update('provider_name', e.target.value)} /></div>
              <div className="space-y-2"><Label>CNPJ/CPF do prestador</Label><Input required value={form.provider_document} onChange={(e) => update('provider_document', e.target.value)} /></div>
              <div className="space-y-2"><Label>Tomador</Label><Input required value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} /></div>
              <div className="space-y-2"><Label>CNPJ/CPF do tomador</Label><Input value={form.customer_document} onChange={(e) => update('customer_document', e.target.value)} /></div>
              <div className="space-y-2"><Label>Codigo do servico</Label><Input required value={form.service_code} onChange={(e) => update('service_code', e.target.value)} /></div>
              <div className="space-y-2"><Label>Codigo do municipio</Label><Input required value={form.city_code} onChange={(e) => update('city_code', e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Descricao do servico</Label><Textarea required value={form.service_description} onChange={(e) => update('service_description', e.target.value)} /></div>
              <div className="space-y-2"><Label>Valor do servico</Label><Input required type="number" min="0" step="0.01" value={form.service_value} onChange={(e) => update('service_value', e.target.value)} /></div>
              <div className="space-y-2"><Label>Deducoes</Label><Input type="number" min="0" step="0.01" value={form.deductions} onChange={(e) => update('deductions', e.target.value)} /></div>
              <div className="space-y-2"><Label>Aliquota ISS (%)</Label><Input type="number" min="0" step="0.01" value={form.iss_rate} onChange={(e) => update('iss_rate', e.target.value)} /></div>
              <div className="flex items-end md:col-span-2"><Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Salvar e enfileirar transmissao
              </Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Documentos recentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(nfseQuery.data ?? []).map((document) => (
              <div key={document.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div><p className="font-medium">{document.number}</p><p className="text-sm text-muted-foreground">{document.customer_name} - {formatBRL(Number(document.service_value))}</p></div>
                <Badge variant="outline">{document.status}</Badge>
              </div>
            ))}
            {!nfseQuery.isLoading && (nfseQuery.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma NFS-e registrada nesta filial.</p>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
