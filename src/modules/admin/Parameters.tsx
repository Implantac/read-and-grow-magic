import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Search, Loader2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { parameterCategoryConfig } from '@/config/administration';
import { ParameterCategory, ParameterFilter } from '@/types/administration';
import { useSystemParameters } from '@/hooks/system/useSystemParameters';
import { ParametersTable } from './parameters/ParametersTable';
import { ParameterDialog } from './parameters/ParameterDialog';

const Parameters = () => {
  const { parameters, isLoading } = useSystemParameters();
  const [filter, setFilter] = useState<ParameterFilter>({ category: 'all' });
  const [activeCategory, setActiveCategory] = useState<ParameterCategory | 'all'>('all');
  const [editingParameter, setEditingParameter] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredParameters = useMemo(() => {
    let filtered = parameters;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => (p.category as string) === activeCategory || ((p.category as string) === 'system' && activeCategory === 'general'));
    }
    
    if (filter.search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filter.search!.toLowerCase()) ||
        p.code.toLowerCase().includes(filter.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(filter.search!.toLowerCase())
      );
    }
    
    return filtered;
  }, [parameters, activeCategory, filter.search]);

  const handleEdit = (param: any) => {
    setEditingParameter(param);
    setIsDialogOpen(true);
  };

  if (isLoading) {
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
        title="Parâmetros do Sistema" 
        description="Configure os parâmetros e comportamentos do sistema"
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parâmetros..."
              className="pl-10"
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ParameterCategory | 'all')}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
          {(Object.keys(parameterCategoryConfig) as ParameterCategory[]).map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
              {parameterCategoryConfig[cat].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <ParametersTable parameters={filteredParameters} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Dica</p>
              <p className="text-sm text-blue-700">Parâmetros modificados podem ser restaurados ao padrão.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Atenção</p>
              <p className="text-sm text-yellow-700">Dados sensíveis são ocultados por padrão.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Ambiente</p>
              <p className="text-sm text-green-700">Valide as configurações antes de operações críticas.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ParameterDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        parameter={editingParameter} 
      />
    </PageContainer>
  );
};

import { useMemo } from 'react';
export default Parameters;
