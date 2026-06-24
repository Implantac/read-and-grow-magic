import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS = [
  { type: 'NFe', num: '12450', status: 'Autorizada', time: '2 min atrás' },
  { type: 'CTe', num: '8542', status: 'Autorizada', time: '5 min atrás' },
  { type: 'NFe', num: '12451', status: 'Processando', time: 'Justo agora' },
  { type: 'MDFe', num: '102', status: 'Erro SEFAZ', time: '12 min atrás' },
];

export function DFeMonitor() {
  return (
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
          {DOCS.map((doc, i) => (
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
  );
}
