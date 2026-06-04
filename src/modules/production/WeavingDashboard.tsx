import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Columns, Scissors, Timer, CheckCircle2 } from "lucide-react";

export default function WeavingDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tecelagem Industrial</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Vertical Industrial EEE</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Teares</CardTitle>
            <Columns className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91.2%</div>
            <p className="text-xs text-muted-foreground">32 teares ativos</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metros/Hora</CardTitle>
            <Scissors className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.240m</div>
            <p className="text-xs text-muted-foreground">Lote atual: Sarja 3x1</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Troca de Artigo</CardTitle>
            <Timer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 min</div>
            <p className="text-xs text-muted-foreground">Setup médio semanal</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-sidebar">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade (1ª Escolha)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Monitoramento Visão Computacional</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
