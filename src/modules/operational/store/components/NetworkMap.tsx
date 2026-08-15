import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Package, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkMap({ sku }: { sku?: string }) {
  return (
    <Card className="bg-accent/20 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Mapa de Estoque da Rede
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative py-8 flex flex-col items-center gap-8">
          <div className="z-10 bg-background border-2 border-primary p-4 rounded-lg shadow-xl text-center min-w-[160px]">
            <p className="text-[10px] font-black uppercase text-primary">CD Central</p>
            <p className="text-lg font-bold">480 un</p>
            <p className="text-[9px] text-muted-foreground">Disponível</p>
          </div>
          
          <div className="absolute top-[80px] w-full h-px bg-border flex justify-around">
            <div className="h-4 w-px bg-border -mt-4" />
            <div className="h-4 w-px bg-border -mt-4" />
            <div className="h-4 w-px bg-border -mt-4" />
          </div>

          <div className="grid grid-cols-3 gap-4 w-full pt-4">
            <div className="bg-background border p-2 rounded text-center">
              <p className="text-[9px] font-bold">Loja 01</p>
              <p className="text-sm font-bold text-success">42 🟢</p>
            </div>
            <div className="bg-background border p-2 rounded text-center ring-1 ring-destructive ring-offset-2 ring-offset-background">
              <p className="text-[9px] font-bold">Loja 02</p>
              <p className="text-sm font-bold text-destructive">2 🔴</p>
            </div>
            <div className="bg-background border p-2 rounded text-center">
              <p className="text-[9px] font-bold">Loja 03</p>
              <p className="text-sm font-bold text-warning">18 🟡</p>
            </div>
          </div>

          <div className="w-full mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-[10px] font-bold">Ação Recomendada</p>
                <p className="text-[11px]">Abastecer Loja 02 (Origem: CD)</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
