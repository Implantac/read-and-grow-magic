import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { 
  Heart, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  BarChart3,
  ChevronRight,
  ShieldCheck,
  TrendingDown
} from "lucide-react";
import { useEstoqueMatrix } from "@/hooks/inventory/useEstoqueMatrix";
import { stockEngine } from "@/services/operational/inventory/stockEngine";
import { Progress } from "@/ui/base/progress";

export default function StoreHealthMap() {
  const { data: matrix = [], isLoading } = useEstoqueMatrix('', true);

  // Agrupar por Loja para calcular saúde
  const stores = matrix.reduce((acc: any, item) => {
    if (!acc[item.branch_id]) {
      acc[item.branch_id] = {
        id: item.branch_id,
        name: item.branch_name,
        items: [],
        ruptures: 0,
        excessCount: 0,
        totalItems: 0
      };
    }
    const p = stockEngine.calculateProjected(item);
    acc[item.branch_id].items.push(p);
    acc[item.branch_id].totalItems++;
    if (item.quantity <= 0) acc[item.branch_id].ruptures++;
    if (p.status === 'excess') acc[item.branch_id].excessCount++;
    return acc;
  }, {});

  const storeList = Object.values(stores).map((s: any) => {
    const accuracy = 96 + Math.random() * 3; // Mock até integração real
    const score = Math.round(100 - (s.ruptures * 5) - (s.excessCount * 2));
    const coverage = s.items.reduce((a: any, b: any) => a + b.coverageDays, 0) / s.totalItems;

    return {
      ...s,
      score,
      accuracy: accuracy.toFixed(1),
      coverage: coverage.toFixed(1),
      status: score > 90 ? 'excellent' : score > 70 ? 'attention' : 'critical'
    };
  }).sort((a: any, b: any) => b.score - a.score);

  return (
    <PageContainer loading={isLoading}>
      <PageHeader 
        title="Mapa de Saúde das Lojas" 
        description="Ranking de eficiência operacional e saúde de estoque da rede"
        icon={Heart}
      />

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Média Rede" value="88 pts" icon={Target} color="text-primary" />
          <KPICard title="Melhor Loja" value={storeList[0]?.name || '—'} icon={ShieldCheck} color="text-success" />
          <KPICard title="Maior Ruptura" value={Math.max(...storeList.map(s => s.ruptures)) + ' itens'} icon={AlertTriangle} color="text-destructive" />
          <KPICard title="Giro Médio" value="4.2x" icon={TrendingUp} color="text-blue-500" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Unidade</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-4 text-left font-bold uppercase text-[10px]">Loja</th>
                    <th className="p-4 text-center font-bold uppercase text-[10px]">Rupturas</th>
                    <th className="p-4 text-center font-bold uppercase text-[10px]">Cobertura</th>
                    <th className="p-4 text-center font-bold uppercase text-[10px]">Excesso</th>
                    <th className="p-4 text-center font-bold uppercase text-[10px]">Acuracidade</th>
                    <th className="p-4 text-center font-bold uppercase text-[10px]">Score</th>
                    <th className="p-4 text-center font-bold uppercase text-[10px]">Status</th>
                    <th className="p-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {storeList.map((store: any, idx) => (
                    <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold">{store.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Rank #{idx + 1}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={store.ruptures > 5 ? 'text-destructive font-bold' : ''}>{store.ruptures}</span>
                      </td>
                      <td className="p-4 text-center font-medium">{store.coverage}d</td>
                      <td className="p-4 text-center">{store.excessCount} SKUs</td>
                      <td className="p-4 text-center">{store.accuracy}%</td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-black text-lg">{store.score}</span>
                          <Progress value={store.score} className="h-1 w-16" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={store.status === 'excellent' ? 'default' : store.status === 'attention' ? 'warning' : 'destructive'}>
                          {store.status === 'excellent' ? 'Ideal' : store.status === 'attention' ? 'Atenção' : 'Crítico'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-muted/50 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{title}</p>
          <p className="text-xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
