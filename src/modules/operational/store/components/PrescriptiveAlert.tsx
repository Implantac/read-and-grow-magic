import { Card, CardContent } from "@/ui/base/card";
import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/ui/base/button";

export function PrescriptiveAlert() {
  return (
    <Card className="border-l-4 border-l-destructive bg-destructive/5 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-destructive">Ruptura Prevista: Camisa Preta M</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Demanda 27% acima da previsão. O estoque atual (4) acabará em 1.2 dias.
              </p>
            </div>
            
            <div className="bg-background/50 p-3 rounded border border-destructive/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Lightbulb className="h-3 w-3 text-amber-500" /> Recomendação ERP Prescritivo
              </div>
              <p className="text-[11px]">
                Transferir <strong>24 unidades</strong> da Loja 04 (Excedente: 42). 
                Impacto: Cobertura → 8 dias. Custo Logístico: R$ 12,40.
              </p>
              <Button size="sm" className="w-full h-8 gap-2 bg-destructive hover:bg-destructive/90 text-white border-none">
                <CheckCircle2 className="h-3 w-3" /> Aprovar Ação
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
