import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Brain, TrendingUp, AlertCircle, ShoppingCart, Truck, Factory, Search } from 'lucide-react';
import { useReplenishmentPolicies } from '@/hooks/operational/network/useNetworkArchitecture';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/ui/base/input';
import { Progress } from '@/ui/base/progress';

export default function ReplenishmentIntelligencePage() {
  const { data: policies, isLoading } = useReplenishmentPolicies();

  return (
    <PageContainer loading={isLoading}>
      <PageHeader 
        title="Inteligência de Reposição" 
        description="Motores de cálculo preditivo e políticas de estoque"
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" /> Analisar Rupturas
          </Button>
          <Button>
            <Brain className="mr-2 h-4 w-4" /> Rodar Sugestões (IA)
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Itens em Ruptura</CardDescription>
            <CardTitle className="text-2xl text-red-500">12</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Sugestões Pendentes</CardDescription>
            <CardTitle className="text-2xl text-amber-500">45</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Em Trânsito</CardDescription>
            <CardTitle className="text-2xl text-blue-500">R$ 142k</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Acuracidade Sugestão</CardDescription>
            <CardTitle className="text-2xl text-green-500">94.2%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Políticas Ativas por Produto
        </h3>
        
        {policies && policies.length > 0 ? (
          <div className="grid gap-4">
            {policies.map((policy: any) => (
              <Card key={policy.id}>
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
                    <Button size="sm" variant="outline">
                      {policy.preferred_source_type === 'CD' ? <Truck className="h-3 w-3 mr-1" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
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
            title="Nenhuma política definida"
            description="Defina níveis críticos de estoque para que a IA possa sugerir reabastecimentos automáticos."
          />
        )}
      </div>
    </PageContainer>
  );
}
