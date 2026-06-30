import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  PackagePlus, 
  ArrowDown, 
  MapPin, 
  PackageSearch, 
  Layers, 
  RefreshCw, 
  PackageCheck,
  ScanBarcode,
  Truck,
  Brain,
  BarChart3
} from "lucide-react";
import WMSKpiStrip from "./components/WMSKpiStrip";

export default function WMSDashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WMS Enterprise</h1>
          <p className="text-muted-foreground">Gestão inteligente de armazenagem, movimentação e logística interna.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/wms/twin">
              <BarChart3 className="h-4 w-4" />
              Digital Twin
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/wms/inteligencia">
              <Brain className="h-4 w-4" />
              Inteligência
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/wms/slotting">
              <Brain className="h-4 w-4" />
              Otimizar Slotting
            </Link>
          </Button>
        </div>
      </div>

      <WMSKpiStrip />


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Docas em Operação</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 / 15</div>
            <p className="text-xs text-muted-foreground mt-1">3 recebimentos agendados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ondas de Picking</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 Ativas</div>
            <p className="text-xs text-green-500 mt-1">42% concluídas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Acuracidade de Inv.</CardTitle>
            <ScanBarcode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground mt-1">Último inventário: Ontem</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sugestão Reabast.</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 Itens</div>
            <p className="text-xs text-purple-500 mt-1">Risco de ruptura iminente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Fluxo de Logística Interna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-secondary/10 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <PackagePlus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Recebimento</p>
                  <p className="text-xl font-bold">450 vol</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-secondary/10 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Expedição</p>
                  <p className="text-xl font-bold">620 vol</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-secondary/10 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Endereçados</p>
                  <p className="text-xl font-bold">92%</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-secondary/10 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <PackageSearch className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Picking Pendente</p>
                  <p className="text-xl font-bold">120 itens</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inteligência de Armazém</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                <p className="font-semibold text-primary mb-1 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Slotting Proativo
                </p>
                <p className="text-xs text-muted-foreground">
                  IA sugere mover 12 itens de alta rotatividade para posições de picking mais baixas (Nível 1).
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Onda de Picking #452
                </p>
                <p className="text-xs text-muted-foreground">
                  Otimizada para reduzir percurso em 15% (320 metros economizados).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
