import { useEffect, useState } from 'react';
import { Loader2, Search, MapPin, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { clientSegments, brazilianStates } from '@/config/commercial';
import { maskCNPJ, maskCPF, maskPhone, maskCEP, validateCNPJ, validateCPF, validateEmail, lookupCEP } from '@/lib/maskUtils';
import { useCreateClient, useUpdateClient, type DbClient } from '@/hooks/commercial/useClients';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: DbClient | null;
  totalClients: number;
}

const defaultForm = {
  name: '', trade_name: '', document: '', document_type: 'cnpj' as string,
  email: '', phone: '', cellphone: '',
  address_street: '', address_number: '', address_complement: '',
  address_neighborhood: '', address_city: '', address_state: '', address_zip_code: '',
  status: 'active', credit_limit: '', segment: '', sales_rep_id: '',
  state_registration: '', municipal_registration: '',
  region: '', micro_region: '', default_payment_condition: 'À vista',
  price_table: 'default', abc_classification: 'C', client_score: 'medium',
  commercial_notes: '', estimated_potential: '',
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
      setFormData({
        name: client.name, trade_name: client.trade_name || '', document: client.document,
        document_type: client.document_type, email: client.email, phone: client.phone,
        cellphone: client.cellphone || '',
        address_street: client.address_street, address_number: client.address_number,
        address_complement: client.address_complement || '', address_neighborhood: client.address_neighborhood,
        address_city: client.address_city, address_state: client.address_state,
        address_zip_code: client.address_zip_code,
        status: client.status, credit_limit: String(client.credit_limit), segment: client.segment || '',
        sales_rep_id: client.sales_rep_id || '',
        state_registration: client.state_registration || '', municipal_registration: client.municipal_registration || '',
        region: client.region || '', micro_region: client.micro_region || '',
        default_payment_condition: client.default_payment_condition || 'À vista',
        price_table: client.price_table || 'default', abc_classification: client.abc_classification || 'C',
        client_score: client.client_score || 'medium',
        commercial_notes: client.commercial_notes || '', estimated_potential: String(client.estimated_potential || ''),
      });
    } else {
      setFormData({ ...defaultForm });
    }
  }, [open, client]);

  const update = (patch: Partial<typeof formData>) => setFormData(p => ({ ...p, ...patch }));

  const handleCnpjLookup = async () => {
    if (formData.document_type !== 'cnpj') return;
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
      // Switch to first tab containing the error
      if (e.name || e.document || e.email || e.phone) setTab('identification');
      else if (e.address_zip_code || e.address_city || e.address_state) setTab('address');
      toastError('Há campos obrigatórios pendentes.', undefined, 'Verifique os campos');
      return;
    }

    const payload: any = {
      name: formData.name, trade_name: formData.trade_name || null, document: formData.document,
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
      state_registration: formData.state_registration || null,
      municipal_registration: formData.municipal_registration || null,
      region: formData.region || null, micro_region: formData.micro_region || null,
      default_payment_condition: formData.default_payment_condition || 'À vista',
      price_table: formData.price_table || 'default',
      abc_classification: formData.abc_classification || 'C',
      commercial_notes: formData.commercial_notes || null,
      estimated_potential: Number(formData.estimated_potential) || 0,
    };

    if (client) {
      updateClient.mutate({ id: client.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      const code = `CLI${String(totalClients + 1).padStart(3, '0')}`;
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
