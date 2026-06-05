import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Building2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Company, CompanyStatus, Address } from '@/types/administration';
import { useCompanies } from '@/hooks/system/useCompanies';

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompany: Company | null;
}

export const CompanyDialog = ({ open, onOpenChange, editingCompany }: CompanyDialogProps) => {
  const [cnpjValue, setCnpjValue] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);
  const [segment, setSegment] = useState('general');
  const [taxRegime, setTaxRegime] = useState('Simples Nacional');
  
  const { createCompany, updateCompany, isCreating, isUpdating } = useCompanies();

  useEffect(() => {
    if (editingCompany) {
      setCnpjValue(editingCompany.cnpj);
      setIsValidated(true);
    } else {
      setCnpjValue('');
      setIsValidated(false);
    }
  }, [editingCompany]);

  const handleFetchCNPJ = async () => {
    if (!cnpjValue || cnpjValue.replace(/\D/g, '').length !== 14) {
      toast.error('Informe um CNPJ válido');
      return;
    }

    setIsFetchingCNPJ(true);
    setIsValidated(false);
    try {
      const cleanCnpj = cnpjValue.replace(/\D/g, '');
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);
      
      if (!response.ok) {
        toast.error('CNPJ não encontrado ou serviço indisponível.');
        return;
      }
      
      const data = await response.json();
      
      if (data.estabelecimento.situacao_cadastral !== 'Ativa') {
        toast.error(`Situação "${data.estabelecimento.situacao_cadastral}". Apenas empresas "Ativas" podem ser cadastradas.`);
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
        (form.elements.namedItem('state') as HTMLInputElement).value = data.estabelecimento.estado.sigla || '';
      }
      
      setIsValidated(true);
      toast.success('CNPJ validado!');
    } catch (error) {
      toast.error('Erro ao validar CNPJ.');
    } finally {
      setIsFetchingCNPJ(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidated && !editingCompany) {
      toast.error('Valide o CNPJ primeiro.');
      return;
    }

    const formData = new FormData(e.currentTarget);
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
      tradeName: formData.get('tradeName') as string,
      cnpj: cnpjValue,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address,
      status: 'active' as CompanyStatus,
      isHeadquarters: editingCompany?.isHeadquarters || false,
    };

    try {
      if (editingCompany) {
        await updateCompany({ id: editingCompany.id, company: companyData });
      } else {
        await createCompany(companyData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Unidade'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Dados Principais</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
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
                      disabled={!!editingCompany}
                    />
                    {!editingCompany && (
                      <Button type="button" onClick={handleFetchCNPJ} disabled={isFetchingCNPJ}>
                        {isFetchingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Validar
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Razão Social</Label>
                  <Input id="name" name="name" defaultValue={editingCompany?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input id="tradeName" name="tradeName" defaultValue={editingCompany?.tradeName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCompany?.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" defaultValue={editingCompany?.phone} required />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CEP</Label><Input name="zipCode" id="zipCode" defaultValue={editingCompany?.address.zipCode} required /></div>
                <div className="space-y-2 md:col-span-2"><Label>Logradouro</Label><Input name="street" id="street" defaultValue={editingCompany?.address.street} required /></div>
                <div className="space-y-2"><Label>Número</Label><Input name="number" id="number" defaultValue={editingCompany?.address.number} required /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input name="neighborhood" id="neighborhood" defaultValue={editingCompany?.address.neighborhood} required /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input name="city" id="city" defaultValue={editingCompany?.address.city} required /></div>
                <div className="space-y-2"><Label>UF</Label><Input name="state" id="state" defaultValue={editingCompany?.address.state} required /></div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
