import { useState } from 'react';
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
  Search, Plus, Edit2, Trash2, Building2, MapPin, Phone, Mail,
  MoreVertical, CheckCircle2, XCircle, Building, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { companyStatusConfig } from '@/config/administration';
import { Company, CompanyStatus, CompanyFilter, Address } from '@/types/administration';

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<CompanyFilter>({ status: 'all', isHeadquarters: 'all' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);
  const [cnpjValue, setCnpjValue] = useState('');

  // Stats
  const headquarters = companies.find(c => c.isHeadquarters);
  const branches = companies.filter(c => !c.isHeadquarters);
  const activeBranches = branches.filter(c => c.status === 'active').length;
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !filter.search || 
      company.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      company.tradeName.toLowerCase().includes(filter.search.toLowerCase()) ||
      company.cnpj.includes(filter.search);
    const matchesStatus = filter.status === 'all' || company.status === filter.status;
    const matchesType = filter.isHeadquarters === 'all' || 
      (filter.isHeadquarters === true && company.isHeadquarters) ||
      (filter.isHeadquarters === false && !company.isHeadquarters);
    return matchesSearch && matchesStatus && matchesType;
  });

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
      if (cleanCnpj.length !== 14) {
        setValidationError('O CNPJ deve conter exatamente 14 números.');
        return;
      }

      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setValidationError('CNPJ não encontrado na base da Receita Federal. Verifique se os números digitados estão corretos.');
        } else if (response.status === 429) {
          setValidationError('Muitas consultas em pouco tempo. Aguarde 1 minuto e tente novamente.');
        } else {
          setValidationError('O serviço de consulta está temporariamente indisponível. Tente novamente mais tarde.');
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.estabelecimento.situacao_cadastral !== 'Ativa') {
        setValidationError(`Este CNPJ está com situação "${data.estabelecimento.situacao_cadastral}". Apenas empresas com situação "Ativa" podem ser cadastradas para emissão fiscal.`);
        return;
      }

      // Mapear dados para o formulário
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
      toast.success('CNPJ validado e dados carregados!');
    } catch (error) {
      console.error(error);
      setValidationError('Ocorreu um erro inesperado ao validar o CNPJ. Tente novamente.');
    } finally {
      setIsFetchingCNPJ(false);
    }
  };

  const handleCreateCompany = () => {
    setEditingCompany(null);
    setCnpjValue('');
    setIsValidated(false);
    setValidationError(null);
    setIsDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCnpjValue(company.cnpj);
    setIsValidated(true);
    setValidationError(null);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleToggleStatus = (company: Company) => {
    const newStatus: CompanyStatus = company.status === 'active' ? 'inactive' : 'active';
    setCompanies(prev => prev.map(c => 
      c.id === company.id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
    ));
    toast.success(`Empresa ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
  };

  const handleDeleteCompany = (company: Company) => {
    if (company.isHeadquarters) {
      toast.error('Não é possível excluir a matriz!');
      return;
    }
    setCompanies(prev => prev.filter(c => c.id !== company.id));
    toast.success('Filial excluída com sucesso!');
  };

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isValidated) {
      toast.error('É necessário validar o CNPJ antes de cadastrar a empresa.');
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

    const companyData: Partial<Company> = {
      name: formData.get('name') as string,
      tradeName: formData.get('tradeName') as string,
      cnpj: formData.get('cnpj') as string,
      stateRegistration: formData.get('stateRegistration') as string,
      municipalRegistration: formData.get('municipalRegistration') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address,
    };

    if (editingCompany) {
      setCompanies(prev => prev.map(c => 
        c.id === editingCompany.id 
          ? { ...c, ...companyData, updatedAt: new Date().toISOString() } 
          : c
      ));
      toast.success('Empresa atualizada com sucesso!');
    } else {
      const newCompany: Company = {
        id: `EMP${String(companies.length + 1).padStart(3, '0')}`,
        ...companyData as Company,
        status: 'active',
        isHeadquarters: false,
        parentCompanyId: headquarters?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCompanies(prev => [...prev, newCompany]);
      toast.success('Filial criada com sucesso!');
    }
    
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Empresas</h1>
          <p className="text-muted-foreground">Gerencie a matriz e filiais da empresa</p>
        </div>
        <Button onClick={handleCreateCompany}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Filial
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matriz</p>
                <p className="font-semibold">{headquarters?.tradeName || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Filiais Ativas</p>
                <p className="text-2xl font-bold text-green-600">{activeBranches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Building className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Filiais</p>
                <p className="text-2xl font-bold">{branches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, razão social ou CNPJ..."
                className="pl-10"
                value={filter.search || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select
              value={filter.status || 'all'}
              onValueChange={(value) => setFilter(prev => ({ ...prev, status: value as CompanyStatus | 'all' }))}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(companyStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow 
                      key={company.id}
                      className={`cursor-pointer ${selectedCompany?.id === company.id ? 'bg-muted/50' : ''}`}
                      onClick={() => handleViewDetails(company)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${company.isHeadquarters ? 'bg-primary/10' : 'bg-muted'}`}>
                            {company.isHeadquarters ? (
                              <Building2 className="h-4 w-4 text-primary" />
                            ) : (
                              <Building className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{company.tradeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {company.isHeadquarters ? 'Matriz' : 'Filial'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{company.cnpj}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{company.address.city}/{company.address.state}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${companyStatusConfig[company.status].bgColor} ${companyStatusConfig[company.status].color} border-0`}>
                          {companyStatusConfig[company.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditCompany(company); }}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(company); }}>
                              {company.status === 'active' ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            {!company.isHeadquarters && (
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company); }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Company Details Panel */}
        <div>
          <Card>
            <CardContent className="p-4">
              {selectedCompany ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${selectedCompany.isHeadquarters ? 'bg-primary/10' : 'bg-muted'}`}>
                      {selectedCompany.isHeadquarters ? (
                        <Building2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Building className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedCompany.tradeName}</h3>
                      <Badge className={`${companyStatusConfig[selectedCompany.status].bgColor} ${companyStatusConfig[selectedCompany.status].color} border-0`}>
                        {selectedCompany.isHeadquarters ? 'Matriz' : 'Filial'} - {companyStatusConfig[selectedCompany.status].label}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Razão Social</p>
                      <p className="text-sm font-medium">{selectedCompany.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="text-sm font-mono">{selectedCompany.cnpj}</p>
                    </div>
                    {selectedCompany.stateRegistration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Inscrição Estadual</p>
                        <p className="text-sm">{selectedCompany.stateRegistration}</p>
                      </div>
                    )}
                    {selectedCompany.municipalRegistration && (
                      <div>
                        <p className="text-xs text-muted-foreground">Inscrição Municipal</p>
                        <p className="text-sm">{selectedCompany.municipalRegistration}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">
                          {selectedCompany.address.street}, {selectedCompany.address.number}
                          {selectedCompany.address.complement && ` - ${selectedCompany.address.complement}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCompany.address.neighborhood} - {selectedCompany.address.city}/{selectedCompany.address.state}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CEP: {selectedCompany.address.zipCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedCompany.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedCompany.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t text-xs text-muted-foreground">
                    <p>Cadastrado em: {format(new Date(selectedCompany.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                    <p>Atualizado em: {format(new Date(selectedCompany.updatedAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma empresa para ver os detalhes</p>
                </div>
              )}
            </CardContent>
          </Card>
                    </div>
                    {validationError && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        {validationError}
                      </p>
                    )}
                  </div>

      {/* Create/Edit Company Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Filial'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Razão Social *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={editingCompany?.name}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">Nome Fantasia *</Label>
                    <Input 
                      id="tradeName" 
                      name="tradeName" 
                      defaultValue={editingCompany?.tradeName}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="cnpj" 
                        name="cnpj" 
                        placeholder="00.000.000/0000-00"
                        value={cnpjValue}
                        onChange={(e) => setCnpjValue(e.target.value)}
                        required 
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleFetchCNPJ}
                        disabled={isFetchingCNPJ}
                      >
                        {isFetchingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                    <Input 
                      id="stateRegistration" 
                      name="stateRegistration" 
                      defaultValue={editingCompany?.stateRegistration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipalRegistration">Inscrição Municipal</Label>
                    <Input 
                      id="municipalRegistration" 
                      name="municipalRegistration" 
                      defaultValue={editingCompany?.municipalRegistration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email"
                      defaultValue={editingCompany?.email}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      defaultValue={editingCompany?.phone}
                      required 
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input 
                      id="zipCode" 
                      name="zipCode" 
                      placeholder="00000-000"
                      defaultValue={editingCompany?.address.zipCode}
                      required 
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="street">Logradouro *</Label>
                    <Input 
                      id="street" 
                      name="street" 
                      defaultValue={editingCompany?.address.street}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número *</Label>
                    <Input 
                      id="number" 
                      name="number" 
                      defaultValue={editingCompany?.address.number}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input 
                      id="complement" 
                      name="complement" 
                      defaultValue={editingCompany?.address.complement}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input 
                      id="neighborhood" 
                      name="neighborhood" 
                      defaultValue={editingCompany?.address.neighborhood}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      defaultValue={editingCompany?.address.city}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">UF *</Label>
                    <Select name="state" defaultValue={editingCompany?.address.state || 'SP'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCompany ? 'Salvar' : 'Criar Filial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Companies;
