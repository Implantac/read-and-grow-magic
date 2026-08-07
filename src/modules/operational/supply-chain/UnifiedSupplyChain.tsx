import { PageContainer } from '@/shared/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { 
  Package, 
  Truck, 
  Factory, 
  Store, 
  ArrowRightLeft, 
  Download, 
  Upload, 
  AlertTriangle,
  ClipboardList,
  Search,
  Plus
} from 'lucide-react';
import { useSupplyChain } from '@/hooks/operational/supply-chain/useSupplyChain';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { cn } from '@/lib/utils';

export default function UnifiedSupplyChain() {
  const { currentBranch } = useEnterprise();
  const { movements, isLoading } = useSupplyChain();

  // Determine UI based on branch type
  const unitType = (currentBranch as any)?.type || 'store';

  return (
    <PageContainer loading={isLoading}>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              {unitType === 'factory' && <Factory className="h-8 w-8 text-primary" />}
              {unitType === 'warehouse' && <Package className="h-8 w-8 text-primary" />}
              {unitType === 'store' && <Store className="h-8 w-8 text-primary" />}
              Central de Abastecimento
            </h1>
            <p className="text-muted-foreground font-medium">
              Gestão Unificada de Fluxos: {currentBranch?.name || '---'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 font-bold uppercase text-xs">
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Button>
            <Button variant="outline" className="gap-2 font-bold uppercase text-xs">
              <Search className="h-4 w-4" /> Consultar Rede
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Solicitações" value={movements.filter(m => m.status === 'requested').length} icon={ClipboardList} color="blue" />
          <StatCard title="Em Trânsito" value={movements.filter(m => m.status === 'in_transit').length} icon={Truck} color="purple" />
          <StatCard title="Recebimentos" value={movements.filter(m => m.status === 'shipped').length} icon={Download} color="emerald" />
          <StatCard title="Divergências" value={movements.filter(m => m.status === 'divergent').length} icon={AlertTriangle} color="red" />
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="inbox" className="font-bold uppercase text-[10px]">Caixa de Entrada</TabsTrigger>
            <TabsTrigger value="outbox" className="font-bold uppercase text-[10px]">Minhas Saídas</TabsTrigger>
            <TabsTrigger value="history" className="font-bold uppercase text-[10px]">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" /> O que chega para mim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {movements.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">Nenhuma movimentação pendente.</div>
                  ) : (
                    movements.map(m => (
                      <MovementRow key={m.id} movement={m} type="inbound" />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outbox" className="mt-6">
             <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> O que estou enviando
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y border rounded-lg overflow-hidden">
                  <div className="p-10 text-center text-muted-foreground">Em breve: fluxo de saída unificado.</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <Card className={cn("border", colors[color])}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase opacity-70 mb-1">{title}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
        <Icon className="h-6 w-6 opacity-50" />
      </CardContent>
    </Card>
  );
}

function MovementRow({ movement, type }: any) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div>
          <p className="font-bold text-xs uppercase">{movement.origin_type} → {movement.destination_type}</p>
          <p className="text-[10px] text-muted-foreground">{movement.items_count} SKUs • Criado em {new Date(movement.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-[9px] font-black uppercase">
          {movement.status}
        </Badge>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 group-hover:translate-x-1 transition-transform">
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
