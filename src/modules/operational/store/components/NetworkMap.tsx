import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Package, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreCentral } from "@/hooks/operational/store/useStoreCentral";

export function NetworkMap({ sku }: { sku?: string }) {
  const { kpis, health } = useStoreCentral();
  
  // Dados simulados baseados no KPI real para manter a consistência visual
  const stockValue = kpis?.stockValue || 0;
  const healthScore = health?.score || 0;

  return (
    <Card className="bg-accent/20 border-dashed overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Mapa de Estoque da Rede
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative py-8 flex flex-col items-center gap-8">
          {/* CD Central */}
          <div className="z-10 bg-background border-2 border-primary p-4 rounded-lg shadow-xl text-center min-w-[160px]">
            <p className="text-[10px] font-black uppercase text-primary">CD Central</p>
            <p className="text-lg font-bold">480 un</p>
            <p className="text-[9px] text-muted-foreground">Estoque Disponível</p>
          </div>
          
          {/* Linhas de conexão */}
          <div className="absolute top-[80px] w-full h-px bg-border flex justify-around">
            <div className="h-4 w-px bg-border -mt-4" />
            <div className="h-4 w-px bg-border -mt-4" />
            <div className="h-4 w-px bg-border -mt-4" />
          </div>

          {/* Lojas da Rede */}
          <div className="grid grid-cols-3 gap-4 w-full pt-4">
            <div className={cn(
              "bg-background border p-2 rounded text-center transition-all",
              healthScore > 90 ? "ring-1 ring-success/30" : ""
            )}>
              <p className="text-[9px] font-bold">Loja 01</p>
              <p className="text-sm font-bold text-success">42 🟢</p>
            </div>
            <div className="bg-background border p-2 rounded text-center ring-1 ring-destructive ring-offset-2 ring-offset-background">
              <p className="text-[9px] font-bold">Minha Loja</p>
              <p className="text-sm font-bold text-destructive">{kpis?.ruptures || 2} 🔴</p>
            </div>
            <div className="bg-background border p-2 rounded text-center">
              <p className="text-[9px] font-bold">Loja 03</p>
              <p className="text-sm font-bold text-warning">18 🟡</p>
            </div>
          </div>

          <div className="w-full mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-[10px] font-bold">Sugestão de Transferência</p>
                <p className="text-[11px]">Equilibrar ruptura via CD Central</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
