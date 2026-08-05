import { useWMSOperationalConsole } from "@/hooks/wms/useWMSOperationalConsole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Progress } from "@/ui/base/progress";
import { 
  Truck, 
  PackagePlus, 
  PackageSearch, 
  PackageCheck, 
  Move, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/ui/base/skeleton";

export default function WMSOperationalConsole() {
  const { receiving, putaway, picking, packing, shipments, inventory, loading } = useWMSOperationalConsole();

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="h-[300px]"><Skeleton className="h-full w-full" /></Card>
        ))}
      </div>
    );
  }

  const sections = [
    {
      title: "Recebimento & Docas",
      description: "Pedidos aguardando descarga ou em conferência",
      icon: Truck,
      data: receiving,
      link: "/wms/recebimento",
      renderItem: (item: any) => (
        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{item.order_number}</span>
            <span className="text-xs text-muted-foreground">{item.supplier}</span>
          </div>
          <Badge variant={item.status === 'in_progress' ? 'default' : 'outline'}>
            {item.status === 'in_progress' ? 'Em curso' : 'Pendente'}
          </Badge>
        </div>
      )
    },
    {
      title: "Putaway (Armazenagem)",
      description: "Tarefas de guarda pendentes",
      icon: PackagePlus,
      data: putaway,
      link: "/wms/putaway",
      renderItem: (item: any) => (
        <div key={item.id} className="flex flex-col p-2 rounded-lg border bg-muted/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.product_name}</span>
            <Badge className="bg-blue-500">{item.priority}</Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Move className="h-3 w-3 mr-1" />
            {item.source_location || 'Doca'} → {item.suggested_location_code}
          </div>
        </div>
      )
    },
    {
      title: "Ondas de Picking",
      description: "Separação de pedidos ativa",
      icon: PackageSearch,
      data: picking,
      link: "/wms/picking",
      renderItem: (item: any) => {
        const progress = item.items_count > 0 ? (item.picked_items / item.items_count) * 100 : 0;
        return (
          <div key={item.id} className="flex flex-col p-2 rounded-lg border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.order_number}</span>
              <span className="text-xs font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>{item.customer_name}</span>
              <Badge variant="outline" className="text-[10px] h-4">{item.status}</Badge>
            </div>
          </div>
        );
      }
    },
    {
      title: "Packing & Conferência",
      description: "Aguardando embalagem e checkout",
      icon: PackageCheck,
      data: packing,
      link: "/wms/packing",
      renderItem: (item: any) => (
        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
          <span className="text-sm font-medium">{item.order_number}</span>
          <Button size="sm" variant="ghost" asChild className="h-7 px-2">
            <Link to={`/wms/packing/${item.id}`}>Conferir <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      )
    },
    {
      title: "Expedição & Carga",
      description: "Manifestos e romaneios em carregamento",
      icon: CheckCircle2,
      data: shipments,
      link: "/wms/expedicao",
      renderItem: (item: any) => (
        <div key={item.id} className="flex flex-col p-2 rounded-lg border bg-muted/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.shipment_number}</span>
            <Badge variant="secondary">{item.status}</Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Truck className="h-3 w-3 mr-1" />
            {item.carrier || 'Transportadora Própria'}
          </div>
        </div>
      )
    },
    {
      title: "Alertas de Inventário",
      description: "Itens abaixo do estoque de segurança",
      icon: AlertTriangle,
      data: inventory,
      link: "/wms/inventory",
      renderItem: (item: any) => (
        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{item.product_name}</span>
            <span className="text-xs text-muted-foreground">Local: {item.location_code}</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-destructive">{item.quantity}</div>
            <div className="text-[10px] text-muted-foreground">un</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sections.map((section, idx) => (
        <Card key={idx} className="flex flex-col border-primary/10 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-1">{section.description}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono">{section.data.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
            {section.data.length > 0 ? (
              section.data.map(item => section.renderItem(item))
            ) : (
              <div className="flex flex-col items-center justify-center h-20 text-muted-foreground border-2 border-dashed rounded-lg">
                <Clock className="h-5 w-5 mb-1 opacity-20" />
                <span className="text-xs italic">Sem pendências</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-8 text-primary" asChild>
              <Link to={section.link}>Ver todos os registros</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
