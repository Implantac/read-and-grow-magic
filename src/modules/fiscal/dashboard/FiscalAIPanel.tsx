import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Zap } from "lucide-react";

export function FiscalAIPanel() {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Automação Fiscal IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 border rounded-lg bg-primary/5">
          <p className="text-sm font-semibold mb-1">Sugestão de CFOP</p>
          <p className="text-xs text-muted-foreground">
            Baseado no destino (RS) e regime (Simples), o CFOP ideal para o produto "Tecido Algodão" é 6.102.
          </p>
        </div>
        <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Monitor de NCM</p>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Detectamos que o NCM 5208.11.00 teve alteração de alíquota IPI publicada hoje no DOU.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
