import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Search, Settings2, Edit2, Eye, EyeOff, Save, RefreshCw, 
  AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { parameterCategoryConfig } from '@/config/administration';
import { SystemParameter, ParameterCategory, ParameterFilter } from '@/types/administration';
import { useSystemParameters } from '@/hooks/useSystemParameters';
import { Skeleton } from '@/components/ui/skeleton';

const Parameters = () => {
  const { parameters: dbParameters, isLoading, updateParameter } = useSystemParameters();
  const [filter, setFilter] = useState<ParameterFilter>({ category: 'all' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<any | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<ParameterCategory | 'all'>('all');

  const parameters = (dbParameters || []).map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    category: p.category as ParameterCategory,
    type: p.type as any,
    value: p.value,
    defaultValue: p.default_value,
    updatedAt: p.updated_at,
    updatedBy: p.updated_by || 'Sistema',
    required: p.required,
    sensitive: p.sensitive,
    options: p.options as string[]
  }));

  // Group parameters by category
  const parametersByCategory = parameters.reduce((acc, param) => {
    if (!acc[param.category]) acc[param.category] = [];
    acc[param.category].push(param);
    return acc;
  }, {} as Record<ParameterCategory, any[]>);

  // Filter parameters
  const getFilteredParameters = (category: ParameterCategory | 'all') => {
    let filtered = parameters;
    
    if (category !== 'all') {
      filtered = filtered.filter(p => (p.category as string) === category || (p.category === 'system' && category === 'general'));
    }
    
    if (filter.search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filter.search!.toLowerCase()) ||
        p.code.toLowerCase().includes(filter.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(filter.search!.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleEditParameter = (param: any) => {
    setEditingParameter(param);
    setIsDialogOpen(true);
  };

  const handleResetToDefault = async (param: any) => {
    try {
      await updateParameter({ code: param.code, value: param.defaultValue });
      toast.success(`Parâmetro "${param.name}" restaurado para valor padrão!`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSaveParameter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!editingParameter) return;
    
    const newValue = formData.get('value') as string;
    
    try {
      await updateParameter({ code: editingParameter.code, value: newValue });
      toast.success(`Parâmetro "${editingParameter.name}" atualizado com sucesso!`);
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const toggleSensitive = (paramId: string) => {
    setShowSensitive(prev => ({ ...prev, [paramId]: !prev[paramId] }));
  };

  const renderValue = (param: any) => {
    if (param.sensitive && !showSensitive[param.id]) {
      return '********';
    }
    
    if (param.type === 'boolean') {
      return param.value === 'true' ? 'Sim' : 'Não';
    }
    
    return param.value;
  };

  const renderValueInput = (param: any) => {
    switch (param.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch 
              id="value"
              name="value"
              defaultChecked={param.value === 'true'}
              onCheckedChange={(checked) => {
                const input = document.querySelector('input[name="value"]') as HTMLInputElement;
                if (input) input.value = String(checked);
              }}
            />
            <input type="hidden" name="value" defaultValue={param.value} />
          </div>
        );
      
      case 'select':
        return (
          <Select name="value" defaultValue={param.value}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input 
            id="value" 
            name="value" 
            type="number"
            defaultValue={param.value}
            required={param.required}
          />
        );
      
      default:
        return (
          <Input 
            id="value" 
            name="value" 
            type={param.sensitive ? 'password' : 'text'}
            defaultValue={param.sensitive ? '' : param.value}
            placeholder={param.sensitive ? 'Digite o novo valor' : undefined}
            required={param.required}
          />
        );
    }
  };

  const categories = Object.keys(parameterCategoryConfig) as ParameterCategory[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">Configure os parâmetros e comportamentos do sistema</p>
        </div>
      </div>

      {/* Search */}
      <Card>
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

      {/* Parameters by Category */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ParameterCategory | 'all')}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todos
          </TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
              {parameterCategoryConfig[cat].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parâmetro</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : getFilteredParameters(activeCategory).map((param) => (
                    <TableRow key={param.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{param.name}</p>
                            {param.required && (
                              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                            )}
                            {param.sensitive && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Sensível
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                          <p className="text-xs font-mono text-muted-foreground">{param.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${parameterCategoryConfig[param.category].bgColor} ${parameterCategoryConfig[param.category].color} border-0`}>
                          {parameterCategoryConfig[param.category].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${param.value !== param.defaultValue ? 'font-medium' : ''}`}>
                            {renderValue(param)}
                          </span>
                          {param.sensitive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleSensitive(param.id)}
                            >
                              {showSensitive[param.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          {param.value !== param.defaultValue && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Modificado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          <p>{format(new Date(param.updatedAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p className="text-xs">por {param.updatedBy}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditParameter(param)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {param.value !== param.defaultValue && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetToDefault(param)}
                              title="Restaurar padrão"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && getFilteredParameters(activeCategory).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum parâmetro encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Dica</p>
              <p className="text-sm text-blue-700">
                Parâmetros marcados como "Modificado" foram alterados do valor padrão. 
                Use o botão de restaurar para voltar ao padrão.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Atenção</p>
              <p className="text-sm text-yellow-700">
                Parâmetros sensíveis (como senhas e chaves) são ocultados por segurança. 
                Clique no ícone de olho para visualizar.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Ambiente</p>
              <p className="text-sm text-green-700">
                Certifique-se de que o ambiente de NF-e está configurado corretamente 
                antes de emitir documentos fiscais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Parameter Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Parâmetro</DialogTitle>
          </DialogHeader>
          {editingParameter && (
            <form onSubmit={handleSaveParameter} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Parâmetro</Label>
                <p className="font-medium">{editingParameter.name}</p>
                <p className="text-sm text-muted-foreground">{editingParameter.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Código</Label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{editingParameter.code}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value">
                  Valor {editingParameter.required && <span className="text-destructive">*</span>}
                </Label>
                {renderValueInput(editingParameter)}
                <p className="text-xs text-muted-foreground">
                  Valor padrão: {editingParameter.defaultValue || '(vazio)'}
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Parameters;
