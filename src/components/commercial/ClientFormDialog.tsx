import { useEffect, useState } from 'react';
import { Loader2, Search, MapPin, AlertCircle, Building2, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { useCnpjLookup } from '@/hooks/system/useCnpjLookup';
import { useClientDuplicateCheck } from '@/hooks/commercial/useClientDuplicateCheck';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { clientSegments, brazilianStates } from '@/config/commercial';
import { maskCNPJ, maskCPF, maskPhone, maskCEP, validateCNPJ, validateCPF, validateEmail, lookupCEP } from '@/lib/maskUtils';
import { useCreateClient, useUpdateClient, type DbClient } from '@/hooks/commercial/useClients';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: DbClient | null;
  totalClients: number;
}

const defaultForm = {
  person_type: 'PJ' as 'PF' | 'PJ',
  name: '', trade_name: '', document: '', document_type: 'cnpj' as string,
  email: '', phone: '', cellphone: '',
  address_street: '', address_number: '', address_complement: '',
  address_neighborhood: '', address_city: '', address_state: '', address_zip_code: '',
  status: 'active', credit_limit: '', segment: '', sales_rep_id: '',
  state_registration: '', municipal_registration: '',
  region: '', micro_region: '', default_payment_condition: 'À vista',
  price_table: 'default', abc_classification: 'C', client_score: 'medium',
  commercial_notes: '', estimated_potential: '',
  rg: '', birth_date: '', gender: '',
  cnae_primary: '', cnae_description: '', receita_status: '', receita_status_date: '',
};

export function ClientFormDialog({ open, onOpenChange, client, totalClients }: Props) {
  const { data: salesReps = [] } = useSalesReps();
  const cnpjLookup = useCnpjLookup();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const [tab, setTab] = useState('identification');
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ ...defaultForm });

  useEffect(() => {
    if (!open) return;
    setTab('identification');
    setErrors({});
    if (client) {
      const c = client as DbClient & Partial<{
        person_type: 'PF' | 'PJ'; rg: string; birth_date: string; gender: string;
        cnae_primary: string; cnae_description: string; receita_status: string; receita_status_date: string;
      }>;
      setFormData({
        person_type: c.person_type || (c.document_type === 'cpf' ? 'PF' : 'PJ'),
        name: c.name, trade_name: c.trade_name || '', document: c.document,
        document_type: c.document_type, email: c.email, phone: c.phone,
        cellphone: c.cellphone || '',
        address_street: c.address_street, address_number: c.address_number,
        address_complement: c.address_complement || '', address_neighborhood: c.address_neighborhood,
        address_city: c.address_city, address_state: c.address_state,
        address_zip_code: c.address_zip_code,
        status: c.status, credit_limit: String(c.credit_limit), segment: c.segment || '',
        sales_rep_id: c.sales_rep_id || '',
        state_registration: c.state_registration || '', municipal_registration: c.municipal_registration || '',
        region: c.region || '', micro_region: c.micro_region || '',
        default_payment_condition: c.default_payment_condition || 'À vista',
        price_table: c.price_table || 'default', abc_classification: c.abc_classification || 'C',
        client_score: c.client_score || 'medium',
        commercial_notes: c.commercial_notes || '', estimated_potential: String(c.estimated_potential || ''),
        rg: c.rg || '', birth_date: c.birth_date || '', gender: c.gender || '',
        cnae_primary: c.cnae_primary || '', cnae_description: c.cnae_description || '',
        receita_status: c.receita_status || '', receita_status_date: c.receita_status_date || '',
      });
    } else {
      setFormData({ ...defaultForm });
    }
  }, [open, client]);

  const update = (patch: Partial<typeof formData>) => setFormData(p => ({ ...p, ...patch }));

  const dup = useClientDuplicateCheck(formData.document, client?.id ?? null);

  const setPersonType = (pt: 'PF' | 'PJ') => {
    update({
      person_type: pt,
      document_type: pt === 'PF' ? 'cpf' : 'cnpj',
      document: '',
      // limpa fields exclusivos do outro tipo
      ...(pt === 'PF'
        ? { trade_name: '', state_registration: '', municipal_registration: '', cnae_primary: '', cnae_description: '', receita_status: '', receita_status_date: '' }
        : { rg: '', birth_date: '', gender: '' }),
    });
  };

  const handleCnpjLookup = async () => {
    if (formData.person_type !== 'PJ') return;
    const data = await cnpjLookup.lookup(formData.document);
    if (data) {
      update({
        name: data.razao_social,
        trade_name: data.nome_fantasia,
        email: data.email || formData.email,
        phone: data.telefone ? maskPhone(data.telefone) : formData.phone,
        address_street: data.logradouro,
        address_number: data.numero,
        address_complement: data.complemento,
        address_neighborhood: data.bairro,
        address_city: data.municipio,
        address_state: data.uf,
        address_zip_code: maskCEP(data.cep),
        cnae_primary: data.cnae_primary,
        cnae_description: data.cnae_description,
        receita_status: data.receita_status,
        receita_status_date: data.receita_status_date,
      });
    }
  };

  const handleCepLookup = async () => {
    setCepLoading(true);
    const data = await lookupCEP(formData.address_zip_code);
    setCepLoading(false);
    if (data) {
      update({
        address_street: data.street || formData.address_street,
        address_neighborhood: data.neighborhood || formData.address_neighborhood,
        address_city: data.city || formData.address_city,
        address_state: data.state || formData.address_state,
      });
      toastSuccess('Endereço encontrado', `${data.city}/${data.state}`);
    } else {
      toastError('CEP não encontrado');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Nome obrigatório';
    if (!formData.document.trim()) e.document = 'Documento obrigatório';
    else if (formData.document_type === 'cnpj' && !validateCNPJ(formData.document)) e.document = 'CNPJ inválido';
    else if (formData.document_type === 'cpf' && !validateCPF(formData.document)) e.document = 'CPF inválido';
    if (!formData.email.trim()) e.email = 'E-mail obrigatório';
    else if (!validateEmail(formData.email)) e.email = 'E-mail inválido';
    if (!formData.phone.trim()) e.phone = 'Telefone obrigatório';
    if (!formData.address_zip_code.trim()) e.address_zip_code = 'CEP obrigatório';
    if (!formData.address_city.trim()) e.address_city = 'Cidade obrigatória';
    if (!formData.address_state.trim()) e.address_state = 'UF obrigatório';
    setErrors(e);
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      if (e.name || e.document || e.email || e.phone) setTab('identification');
      else if (e.address_zip_code || e.address_city || e.address_state) setTab('address');
      toastError('Há campos obrigatórios pendentes.', undefined, 'Verifique os campos');
      return;
    }
    if (dup.data && dup.data.id !== client?.id) {
      toastError(`Já existe o cadastro "${dup.data.name}" (${dup.data.code}) com este documento.`, undefined, 'Documento duplicado');
      setTab('identification');
      return;
    }

    const isPJ = formData.person_type === 'PJ';
    const payload: any = {
      person_type: formData.person_type,
      name: formData.name, trade_name: isPJ ? (formData.trade_name || null) : null, document: formData.document,
      document_type: formData.document_type, email: formData.email, phone: formData.phone,
      cellphone: formData.cellphone || null,
      address_street: formData.address_street, address_number: formData.address_number,
      address_complement: formData.address_complement || null, address_neighborhood: formData.address_neighborhood,
      address_city: formData.address_city, address_state: formData.address_state,
      address_zip_code: formData.address_zip_code,
      status: formData.status, credit_limit: Number(formData.credit_limit) || 0,
      current_balance: 0, segment: formData.segment || null,
      sales_rep_id: formData.sales_rep_id || null,
      client_score: formData.client_score || 'medium',
      state_registration: isPJ ? (formData.state_registration || null) : null,
      municipal_registration: isPJ ? (formData.municipal_registration || null) : null,
      region: formData.region || null, micro_region: formData.micro_region || null,
      default_payment_condition: formData.default_payment_condition || 'À vista',
      price_table: formData.price_table || 'default',
      abc_classification: formData.abc_classification || 'C',
      commercial_notes: formData.commercial_notes || null,
      estimated_potential: Number(formData.estimated_potential) || 0,
      rg: !isPJ ? (formData.rg || null) : null,
      birth_date: !isPJ && formData.birth_date ? formData.birth_date : null,
      gender: !isPJ ? (formData.gender || null) : null,
      cnae_primary: isPJ ? (formData.cnae_primary || null) : null,
      cnae_description: isPJ ? (formData.cnae_description || null) : null,
      receita_status: isPJ ? (formData.receita_status || null) : null,
      receita_status_date: isPJ && formData.receita_status_date ? formData.receita_status_date : null,
    };

    if (client) {
      updateClient.mutate({ id: client.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      const code = `CLI${String(totalClients + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
      createClient.mutate({ ...payload, code }, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isSaving = createClient.isPending || updateClient.isPending;
  const hasTabError = (keys: string[]) => keys.some(k => errors[k]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {client ? `Atualize os dados de ${client.name}` : 'Preencha os dados em cada aba para cadastrar um novo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="identification" className="gap-1.5">
              {hasTabError(['name','document','email','phone']) && <AlertCircle className="h-3 w-3 text-destructive" />}
              Identificação
            </TabsTrigger>
            <TabsTrigger value="address" className="gap-1.5">
              {hasTabError(['address_zip_code','address_city','address_state']) && <AlertCircle className="h-3 w-3 text-destructive" />}
              Endereço
            </TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-1 py-4">
            {/* IDENTIFICAÇÃO */}
            <TabsContent value="identification" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento *</Label>
                  <Select value={formData.document_type} onValueChange={(v) => update({ document_type: v, document: '' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
                      <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{formData.document_type === 'cnpj' ? 'CNPJ' : 'CPF'} *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.document}
                      onChange={(e) => update({ document: formData.document_type === 'cnpj' ? maskCNPJ(e.target.value) : maskCPF(e.target.value) })}
                      placeholder={formData.document_type === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                      className={errors.document ? 'border-destructive' : ''}
                    />
                    {formData.document_type === 'cnpj' && (
                      <Button type="button" variant="outline" size="icon" onClick={handleCnpjLookup} disabled={cnpjLookup.loading} title="Buscar dados na Receita Federal">
                        {cnpjLookup.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{formData.document_type === 'cnpj' ? 'Razão Social' : 'Nome Completo'} *</Label>
                <Input value={formData.name} onChange={(e) => update({ name: e.target.value })} className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {formData.document_type === 'cnpj' && (
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={formData.trade_name} onChange={(e) => update({ trade_name: e.target.value })} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => update({ email: e.target.value })} className={errors.email ? 'border-destructive' : ''} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input value={formData.phone} onChange={(e) => update({ phone: maskPhone(e.target.value) })} placeholder="(00) 0000-0000" className={errors.phone ? 'border-destructive' : ''} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Celular / WhatsApp</Label>
                  <Input value={formData.cellphone} onChange={(e) => update({ cellphone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => update({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* ENDEREÇO */}
            <TabsContent value="address" className="mt-0 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.address_zip_code}
                      onChange={(e) => update({ address_zip_code: maskCEP(e.target.value) })}
                      placeholder="00000-000"
                      className={errors.address_zip_code ? 'border-destructive' : ''}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleCepLookup} disabled={cepLoading} title="Buscar endereço pelo CEP">
                      {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.address_zip_code && <p className="text-xs text-destructive">{errors.address_zip_code}</p>}
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Logradouro</Label>
                  <Input value={formData.address_street} onChange={(e) => update({ address_street: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={formData.address_number} onChange={(e) => update({ address_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={formData.address_complement} onChange={(e) => update({ address_complement: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={formData.address_neighborhood} onChange={(e) => update({ address_neighborhood: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Cidade *</Label>
                  <Input value={formData.address_city} onChange={(e) => update({ address_city: e.target.value })} className={errors.address_city ? 'border-destructive' : ''} />
                </div>
                <div className="space-y-2">
                  <Label>UF *</Label>
                  <Select value={formData.address_state} onValueChange={(v) => update({ address_state: v })}>
                    <SelectTrigger className={errors.address_state ? 'border-destructive' : ''}><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Região</Label>
                  <Input value={formData.region} onChange={(e) => update({ region: e.target.value })} placeholder="Ex: Sul, Sudeste..." />
                </div>
                <div className="space-y-2">
                  <Label>Micro-Região</Label>
                  <Input value={formData.micro_region} onChange={(e) => update({ micro_region: e.target.value })} placeholder="Ex: Grande SP..." />
                </div>
              </div>
            </TabsContent>

            {/* COMERCIAL */}
            <TabsContent value="commercial" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select value={formData.segment} onValueChange={(v) => update({ segment: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {clientSegments.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Representante Responsável</Label>
                  <Select value={formData.sales_rep_id || '_none'} onValueChange={(v) => update({ sales_rep_id: v === '_none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum</SelectItem>
                      {salesReps.filter(r => r.status === 'active').map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limite de Crédito (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={formData.credit_limit} onChange={(e) => update({ credit_limit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Potencial Estimado (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={formData.estimated_potential} onChange={(e) => update({ estimated_potential: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condição de Pagamento</Label>
                  <Select value={formData.default_payment_condition} onValueChange={(v) => update({ default_payment_condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À Vista</SelectItem>
                      <SelectItem value="30 dias">30 Dias</SelectItem>
                      <SelectItem value="30/60 dias">30/60 Dias</SelectItem>
                      <SelectItem value="30/60/90 dias">30/60/90 Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tabela de Preço</Label>
                  <Select value={formData.price_table} onValueChange={(v) => update({ price_table: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Padrão</SelectItem>
                      <SelectItem value="wholesale">Atacado</SelectItem>
                      <SelectItem value="special">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classificação ABC</Label>
                  <Select value={formData.abc_classification} onValueChange={(v) => update({ abc_classification: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Alta</SelectItem>
                      <SelectItem value="B">B - Média</SelectItem>
                      <SelectItem value="C">C - Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score / Potencial</Label>
                  <Select value={formData.client_score} onValueChange={(v) => update({ client_score: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alto Potencial</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="low">Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações Comerciais</Label>
                <Textarea
                  value={formData.commercial_notes}
                  onChange={(e) => update({ commercial_notes: e.target.value })}
                  placeholder="Notas internas sobre o cliente, preferências, histórico de relacionamento..."
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">{formData.commercial_notes.length}/1000</p>
              </div>
            </TabsContent>

            {/* FISCAL */}
            <TabsContent value="fiscal" className="mt-0 space-y-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                Dados fiscais usados para emissão de NF-e, NFC-e e cálculos tributários.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input value={formData.state_registration} onChange={(e) => update({ state_registration: e.target.value })} placeholder="ISENTO ou número" />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Municipal</Label>
                  <Input value={formData.municipal_registration} onChange={(e) => update({ municipal_registration: e.target.value })} />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
