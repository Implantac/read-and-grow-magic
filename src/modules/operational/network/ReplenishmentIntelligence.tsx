import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Brain, TrendingUp, AlertCircle, ShoppingCart, Truck, Factory, Search, RefreshCw, BarChart2 } from 'lucide-react';
import { useReplenishmentPolicies } from '@/hooks/operational/network/useNetworkArchitecture';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/ui/base/input';
import { SmartReplenishment } from '@/modules/wms/components/SmartReplenishment';

export default function ReplenishmentIntelligencePage() {
  const { data: policies, isLoading, error, refetch } = useReplenishmentPolicies();

  return (
    <PageContainer loading={isLoading}>
      <PageHeader 
        title="Inteligência de Reposição" 
        description="Motores de cálculo preditivo e políticas de estoque da malha operacional"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Recalcular Malha
          </Button>
          <Button>
            <Brain className="mr-2 h-4 w-4" /> IA: Simular Cenários
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="suggestions" className="gap-2">
            <Brain className="h-4 w-4" /> Sugestões de IA
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Políticas de Estoque
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart2 className="h-4 w-4" /> Indicadores de Ruptura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <SmartReplenishment />
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-4 mb-8 mt-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Itens em Ruptura</CardDescription>
                <CardTitle className="text-2xl text-red-500">
                  {policies?.filter((p: any) => p.is_active && (p.current_stock || 0) < p.min_stock).length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Políticas Ativas</CardDescription>
                <CardTitle className="text-2xl text-amber-500">
                  {policies?.filter((p: any) => p.is_active).length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Cobertura Média</CardDescription>
                <CardTitle className="text-2xl text-blue-500">14 dias</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Acuracidade Sugestão</CardDescription>
                <CardTitle className="text-2xl text-green-500">92%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Políticas Ativas por Produto
              </h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar política..." className="pl-9" />
              </div>
            </div>
            
            {error ? (
              <EmptyState 
                icon={AlertCircle}
                title="Erro ao carregar políticas"
                description="Não foi possível recuperar as políticas de estoque no momento. Verifique sua permissão de acesso."
                action={{ label: "Tentar Novamente", onClick: () => refetch() }}
              />
            ) : policies && policies.length > 0 ? (
              <div className="grid gap-4">
                {policies.map((policy: any) => (
                  <Card key={policy.id} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{policy.product?.name}</span>
                          <Badge variant="outline" className="text-[10px]">{policy.product?.code}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Mínimo</p>
                            <p className="text-sm font-medium">{policy.min_stock}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Máximo</p>
                            <p className="text-sm font-medium">{policy.max_stock}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Ponto Pedido</p>
                            <p className="text-sm font-medium">{policy.reorder_point}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Lead Time</p>
                            <p className="text-sm font-medium">{policy.lead_time_days} dias</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button size="sm" variant="ghost">Ajustar</Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          {policy.preferred_source_type === 'CD' ? <Truck className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
                          Origem: {policy.preferred_source_type}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Brain}
                title={isLoading ? "Buscando políticas..." : "Nenhuma política definida"}
                description={isLoading ? "Consultando base de dados operacional..." : "Defina níveis críticos de estoque para que a IA possa sugerir reabastecimentos automáticos."}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Painel de Ruptura e Saúde de Estoque</CardTitle>
              <CardDescription>Visão consolidada da malha logística por canal</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center border-t">
              <div className="text-center text-muted-foreground">
                <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Gráficos de tendência de estoque e ruptura serão carregados aqui.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
