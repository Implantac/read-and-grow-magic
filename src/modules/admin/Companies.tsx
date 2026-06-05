import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { useCompanies } from '@/hooks/system/useCompanies';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/ui/base/table';
import { 
  Plus, Edit2, Building2, Loader2,
  Settings2, CheckCircle
} from 'lucide-react';
import { Company, CompanyStatus } from '@/types/administration';
import { CompanyDialog } from './companies/CompanyDialog';

const Companies = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { companies, loading } = useCompanies();

  const stats = useMemo(() => ({
    headquarters: companies.find(c => c.isHeadquarters),
    activeBranches: companies.filter(c => !c.isHeadquarters && c.status === 'active').length,
    total: companies.length
  }), [companies]);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Gestão de Empresas" 
        description="Configuração adaptativa e automação fiscal"
      >
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nova Filial
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl"><Building2 className="text-primary h-6 w-6" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Matriz</p>
              <p className="font-bold">{stats.headquarters?.tradeName || 'Matriz não configurada'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl"><CheckCircle className="text-green-600 h-6 w-6" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Filiais Ativas</p>
              <p className="text-2xl font-black">{stats.activeBranches}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><Settings2 className="text-blue-600 h-6 w-6" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total de Unidades</p>
              <p className="text-2xl font-black">{stats.total}</p>
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
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{company.tradeName}</span>
                      {company.isHeadquarters && <Badge variant="secondary" className="w-fit text-[10px]">MATRIZ</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{company.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                      {company.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {company.address.city} - {company.address.state}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CompanyDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        editingCompany={editingCompany}
      />
    </PageContainer>
  );
};

export default Companies;
