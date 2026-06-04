import { useState, useEffect } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { useCompanies } from '@/hooks/system/useCompanies';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/ui/base/table';
import { 
  Search, Plus, Edit2, Building2, Loader2,
  Settings2, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Company, CompanyStatus, Address } from '@/types/administration';
import { supabase } from '@/integrations/supabase/client';

const Companies = () => {
  const [cnpjValue, setCnpjValue] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [segment, setSegment] = useState('general');
  const [taxRegime, setTaxRegime] = useState('Simples Nacional');

  const { companies: dbCompanies, loading } = useCompanies();

  const handleFetchCNPJ = async () => {
    if (!cnpjValue || cnpjValue.replace(/\D/g, '').length !== 14) {
      toast.error('Informe um CNPJ válido');
      return;
    }

    setIsFetchingCNPJ(true);
    setIsValidated(false);
    setValidationError(null);
    try {
      const cleanCnpj = cnpjValue.replace(/\D/g, '');
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          setValidationError('Muitas consultas em pouco tempo. Aguarde 1 minuto.');
        } else {
          setValidationError('CNPJ não encontrado ou serviço indisponível.');
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.estabelecimento.situacao_cadastral !== 'Ativa') {
        setValidationError(`Situação "${data.estabelecimento.situacao_cadastral}". Apenas empresas "Ativas" podem ser cadastradas.`);
        return;
      }

      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        (form.elements.namedItem('name') as HTMLInputElement).value = data.razao_social || '';
        (form.elements.namedItem('tradeName') as HTMLInputElement).value = data.estabelecimento.nome_fantasia || data.razao_social || '';
        (form.elements.namedItem('email') as HTMLInputElement).value = data.estabelecimento.email || '';
        (form.elements.namedItem('phone') as HTMLInputElement).value = `${data.estabelecimento.ddd1}${data.estabelecimento.telefone1}` || '';
        (form.elements.namedItem('zipCode') as HTMLInputElement).value = data.estabelecimento.cep || '';
        (form.elements.namedItem('street') as HTMLInputElement).value = data.estabelecimento.logradouro || '';
        (form.elements.namedItem('number') as HTMLInputElement).value = data.estabelecimento.numero || '';
        (form.elements.namedItem('complement') as HTMLInputElement).value = data.estabelecimento.complemento || '';
        (form.elements.namedItem('neighborhood') as HTMLInputElement).value = data.estabelecimento.bairro || '';
        (form.elements.namedItem('city') as HTMLInputElement).value = data.estabelecimento.cidade.nome || '';
      }
      
      setIsValidated(true);
      toast.success('CNPJ validado! Regras de operação serão criadas automaticamente.');
    } catch (error) {
      setValidationError('Erro ao validar CNPJ.');
    } finally {
      setIsFetchingCNPJ(false);
    }
  };

  const generateOperations = (segment: string) => {
    const baseOperations = [
      { cfop: '5102', description: 'Venda de mercadoria adquirida de terceiros', type: 'Saída' },
      { cfop: '1102', description: 'Compra para comercialização', type: 'Entrada' },
    ];

    if (['textile', 'food_factory', 'pharma'].includes(segment)) {
      baseOperations.push(
        { cfop: '5101', description: 'Venda de produção do estabelecimento', type: 'Saída' },
        { cfop: '1101', description: 'Compra de matéria-prima para industrialização', type: 'Entrada' }
      );
    }

    if (segment === 'distribution') {
      baseOperations.push(
        { cfop: '5405', description: 'Venda de mercadoria adquirida (ST)', type: 'Saída' }
      );
    }

    return baseOperations;
  };

  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidated && !editingCompany) {
      toast.error('Valide o CNPJ primeiro.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const operations = generateOperations(segment);

    const address: Address = {
      street: formData.get('street') as string,
      number: formData.get('number') as string,
      complement: formData.get('complement') as string,
      neighborhood: formData.get('neighborhood') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
      country: 'Brasil',
    };

    const companyData = {
      name: formData.get('name') as string,
      trade_name: formData.get('tradeName') as string,
      cnpj: cnpjValue,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address,
      segment,
      tax_regime: taxRegime,
      operation_types: operations,
      status: 'active' as CompanyStatus,
    };

    try {
      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update(companyData as any)
          .eq('id', editingCompany.id);
        if (error) throw error;
        toast.success('Empresa atualizada!');
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([{ ...companyData, is_headquarters: false }] as any);
        if (error) throw error;
        toast.success(`Filial "${companyData.trade_name}" cadastrada com sucesso!`);
      }
      setIsDialogOpen(false);
      window.location.reload(); 
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Gestão de Empresas" 
        description="Configuração adaptativa e automação fiscal"
      >
        <Button onClick={() => { setEditingCompany(null); setCnpjValue(''); setIsValidated(false); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Filial
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl"><Building2 className="text-primary h-6 w-6" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Matriz</p>
                  <p className="font-bold">{dbCompanies.find(c => c.is_headquarters)?.trade_name || 'Matriz não configurada'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl"><CheckCircle className="text-green-600 h-6 w-6" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Filiais Ativas</p>
                  <p className="text-2xl font-black">{dbCompanies.filter(c => !c.is_headquarters && c.status === 'active').length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl"><Settings2 className="text-blue-600 h-6 w-6" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Segmentação</p>
                  <p className="text-sm font-semibold">Adaptativa Híbrida</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Operações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbCompanies.map((company: any) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{company.trade_name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{company.cnpj}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{company.segment || 'Geral'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{company.tax_regime || 'Simples'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {company.operation_types?.slice(0, 3).map((op: any) => (
                            <Badge key={op.cfop} variant="secondary" className="text-[10px]">{op.cfop}</Badge>
                          ))}
                          {company.operation_types?.length > 3 && <span className="text-[10px]">+ {company.operation_types.length - 3}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCompany(company); setCnpjValue(company.cnpj); setIsValidated(true); setIsDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Configuração Adaptativa de Empresa
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveCompany} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
              <div className="space-y-2">
                <Label className="text-primary font-bold">Segmento do Negócio</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral / Comércio</SelectItem>
                    <SelectItem value="textile">Indústria Têxtil</SelectItem>
                    <SelectItem value="food_factory">Indústria de Alimentos</SelectItem>
                    <SelectItem value="pharma">Farmacêutico</SelectItem>
                    <SelectItem value="distribution">Distribuidora / Atacadista</SelectItem>
                    <SelectItem value="services">Prestação de Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-bold">Regime Tributário</Label>
                <Select value={taxRegime} onValueChange={setTaxRegime}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Dados Fiscais</TabsTrigger>
                <TabsTrigger value="address">Localização</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="cnpj" 
                        placeholder="00.000.000/0000-00"
                        value={cnpjValue}
                        onChange={(e) => setCnpjValue(e.target.value)}
                      />
                      <Button type="button" onClick={handleFetchCNPJ} disabled={isFetchingCNPJ}>
                        {isFetchingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Validar
                      </Button>
                    </div>
                    {validationError && <p className="text-xs text-destructive">{validationError}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Razão Social</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <Input id="tradeName" name="tradeName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>CEP</Label><Input name="zipCode" id="zipCode" required /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Logradouro</Label><Input name="street" id="street" required /></div>
                  <div className="space-y-2"><Label>Número</Label><Input name="number" id="number" required /></div>
                  <div className="space-y-2"><Label>Bairro</Label><Input name="neighborhood" id="neighborhood" required /></div>
                  <div className="space-y-2"><Label>Cidade</Label><Input name="city" id="city" required /></div>
                  <div className="space-y-2"><Label>UF</Label><Input name="state" id="state" required /></div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Empresa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Companies;
