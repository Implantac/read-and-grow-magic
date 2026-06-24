import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { AlertOctagon, CheckCircle2, FileText, Percent, Scale } from "lucide-react";

export function FiscalKPIs() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Documentos (Mês)</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4.850</div>
          <p className="text-xs text-muted-foreground mt-1">NFe, NFCe, CTe e MDFe</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Tributos Apurados</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ 1.2M</div>
          <p className="text-xs text-green-500 mt-1 flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1" /> 100% conciliado
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">98/100</div>
          <p className="text-xs text-muted-foreground mt-1">2 alertas de baixo risco</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-destructive">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Alerta Tributário</CardTitle>
          <AlertOctagon className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-red-500 mt-1">Inconsistência NCM detectada</p>
        </CardContent>
      </Card>
    </div>
  );
}
