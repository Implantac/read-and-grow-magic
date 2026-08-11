import { useState, useEffect } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Label } from "@/ui/base/label";
import { Switch } from "@/ui/base/switch";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { 
  Building2, 
  Store, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  Factory,
  Package,
  FileText,
  UserCheck,
  Zap,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEnterprise } from "@/core/auth/EnterpriseContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import { Badge } from "@/ui/base/badge";
import { Separator } from "@/ui/base/separator";

export default function EnterpriseConfig() {
  const { currentCompany: company, isLoading: loadingCompany } = useEnterprise();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    business_model: 'hybrid',
    tax_regime: 'simples',
    allow_negative_stock: false,
    auto_billing: false,
    use_multi_branch: true,
    default_markup: 30,
    modules: {
      commercial: true,
      logistics: true,
      production: false,
      financial: true,
      fiscal: true,
      governance: true,
      audit: true
    },
    approvals: {
      discount_threshold: 10,
      order_min_value: 0,
      require_manager_for_cancellation: true
    }
  });

  useEffect(() => {
    if (company?.settings) {
      setSettings(prev => ({ ...prev, ...(company.settings as any) }));
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ settings: settings as any })
        .eq('id', company.id);

      if (error) throw error;
      toast.success("Configuração empresarial atualizada com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configuração empresarial");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCompany) return (
    <div className="flex items-center justify-center h-screen">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <PageContainer>
      <PageHeader 
        title="Configuração da Empresa" 
        description="Gestão centralizada de parâmetros, permissões e fluxos operacionais."
        icon={Building2}
      >
        <div className="flex gap-2">
           <Button variant="outline" size="sm">Histórico de Alterações</Button>
           <Button onClick={handleSave} disabled={loading} size="sm" className="gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Tudo
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general">Geral & Modelo</TabsTrigger>
          <TabsTrigger value="modules">Módulos Habilitados</TabsTrigger>
          <TabsTrigger value="processes">Regras & Aprovações</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal & Contábil</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5 text-primary" />
                  Perfil Operacional
                </CardTitle>
                <CardDescription>Determine o DNA da sua operação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Segmento / Modelo</Label>
                  <Select 
                    value={settings.business_model} 
                    onValueChange={(v) => setSettings({...settings, business_model: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wholesale">Indústria / Atacado</SelectItem>
                      <SelectItem value="retail">Varejo / PDV</SelectItem>
                      <SelectItem value="hybrid">Híbrido (Multicanal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Multi-Filiais</Label>
                    <p className="text-xs text-muted-foreground italic">Habilita gestão de rede e transferências.</p>
                  </div>
                  <Switch 
                    checked={settings.use_multi_branch}
                    onCheckedChange={(v) => setSettings({...settings, use_multi_branch: v})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Políticas de Estoque
                </CardTitle>
                <CardDescription>Controle de movimentação e inventário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-destructive">Permitir Saldo Negativo</Label>
                    <p className="text-xs text-muted-foreground italic">Venda de produtos sem confirmação de estoque físico.</p>
                  </div>
                  <Switch 
                    checked={settings.allow_negative_stock}
                    onCheckedChange={(v) => setSettings({...settings, allow_negative_stock: v})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Markup de Sugestão (%)</Label>
                  <Input 
                    type="number" 
                    value={settings.default_markup}
                    onChange={(e) => setSettings({...settings, default_markup: Number(e.target.value)})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Ativos</CardTitle>
              <CardDescription>Selecione quais áreas do ERP estarão disponíveis para os usuários.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'commercial', label: 'Comercial & CRM', icon: ShoppingCart },
                { id: 'logistics', label: 'Logística & WMS', icon: Store },
                { id: 'production', label: 'Indústria & PCP', icon: Factory },
                { id: 'financial', label: 'Financeiro', icon: Wallet },
                { id: 'fiscal', label: 'Fiscal & NFe', icon: ShieldCheck },
              ].map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <mod.icon className="h-5 w-5" />
                    </div>
                    <Label className="cursor-pointer">{mod.label}</Label>
                  </div>
                  <Switch 
                    checked={(settings.modules as any)[mod.id]}
                    onCheckedChange={(v) => setSettings({
                      ...settings, 
                      modules: { ...settings.modules, [mod.id]: v }
                    })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Regras de Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Limite de Desconto sem Aprovação (%)</Label>
                  <Input 
                    type="number" 
                    value={settings.approvals.discount_threshold}
                    onChange={(e) => setSettings({
                      ...settings, 
                      approvals: { ...settings.approvals, discount_threshold: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <Label>Exigir Aprovação para Cancelar Pedido Faturado</Label>
                  <Switch 
                    checked={settings.approvals.require_manager_for_cancellation}
                    onCheckedChange={(v) => setSettings({
                      ...settings, 
                      approvals: { ...settings.approvals, require_manager_for_cancellation: v }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Ciclo de Vida de Operações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">O sistema aplicará os seguintes estados padrão para novos processos:</p>
                <div className="space-y-2">
                  {['Rascunho', 'Aguardando Aprovação', 'Reservado', 'Em Separação', 'Faturado', 'Concluído'].map((status, idx) => (
                    <div key={status} className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">{idx + 1}</Badge>
                      <span className="font-medium">{status}</span>
                      {idx < 5 && <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
