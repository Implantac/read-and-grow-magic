import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  FileText
} from "lucide-react";

export default function FinancialDashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controladoria & Finanças</h1>
          <p className="text-muted-foreground">Visão consolidada e saúde financeira do grupo empresarial.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            DRE Consolidada
          </Button>
          <Button className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Conciliação IA
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.842.000,00</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +4.5% vs ontem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contas a Receber (7d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 642.500,00</div>
            <p className="text-xs text-muted-foreground mt-1">12 faturas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contas a Pagar (7d)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 312.400,00</div>
            <p className="text-xs text-muted-foreground mt-1">8 faturas próximas ao vencimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">EBITDA Gerencial</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -1.2% meta do mês
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Fluxo de Caixa Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-4 px-4">
              {[65, 45, 75, 55, 85, 95, 70].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40" style={{ height: `${val}%` }} />
                  <span className="text-[10px] text-muted-foreground">0{i+1}/06</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Alertas Financeiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">Risco de Inadimplência</h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">3 clientes do setor têxtil ultrapassaram o limite de crédito.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/20">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Oportunidade de Caixa</h4>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">Saldo ocioso detectado. IA sugere aplicação em CDI de liquidez diária.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
