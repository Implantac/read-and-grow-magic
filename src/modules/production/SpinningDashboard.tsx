import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Repeat, Zap, Activity, AlertTriangle } from "lucide-react";

export default function SpinningDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fiação & Fios</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Vertical Industrial EEE</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Cardas</CardTitle>
            <Repeat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.8%</div>
            <p className="text-xs text-muted-foreground">+0.5% vs meta</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Energia/kg</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.42 kWh</div>
            <p className="text-xs text-muted-foreground">-3% otimização IA</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rupturas/1000h</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4</div>
            <p className="text-xs text-muted-foreground">Estável</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neps (Contagem)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145</div>
            <p className="text-xs text-destructive">+15 desvio de qualidade</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
