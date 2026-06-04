import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { 
  ShieldCheck, 
  FileText, 
  Scale, 
  AlertOctagon,
  Percent,
  Download,
  Search,
  Zap,
  CheckCircle2
} from "lucide-react";

export default function FiscalDashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motor Fiscal Enterprise</h1>
          <p className="text-muted-foreground">Compliance, apuração automática e gestão de documentos eletrônicos.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Gerar SPED
          </Button>
          <Button className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Auditoria Fiscal
          </Button>
        </div>
      </div>

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Monitor de Mensageria (DFe)</CardTitle>
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-3 w-3" />
              Filtrar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'NFe', num: '12450', status: 'Autorizada', time: '2 min atrás' },
                { type: 'CTe', num: '8542', status: 'Autorizada', time: '5 min atrás' },
                { type: 'NFe', num: '12451', status: 'Processando', time: 'Justo agora' },
                { type: 'MDFe', num: '102', status: 'Erro SEFAZ', time: '12 min atrás' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold">{doc.type}</div>
                    <span className="text-sm font-medium">Nº {doc.num}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      doc.status === 'Autorizada' ? "bg-green-100 text-green-700" : 
                      doc.status === 'Processando' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                    )}>{doc.status}</span>
                    <span className="text-[10px] text-muted-foreground">{doc.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
