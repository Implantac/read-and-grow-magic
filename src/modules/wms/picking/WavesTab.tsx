import { Layers, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';

export function WavesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ondas de Separação (Simulação)</CardTitle>
        <CardDescription>Agrupamento de pedidos por zona para otimização de rota</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-bold text-lg mb-2 text-foreground">Gerar Ondas de Picking</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Agrupe pedidos pendentes para que o operador colete múltiplos itens em uma única rota, reduzindo o tempo de deslocamento.
          </p>
          <Button className="gap-2">
            <Zap className="h-4 w-4" /> Agrupar Pendentes em Onda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
