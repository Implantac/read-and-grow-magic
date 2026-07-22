import { useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, Clock, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';

interface Props {
  openCount: number;
  overdueCount: number;
  stockCount: number;
  bankCount: number;
}

export function DivergenceKPIs({ openCount, overdueCount, stockCount, bankCount }: Props) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Alertas abertos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-amber-500">{openCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Não resolvidos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> Vencidos (SLA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">{overdueCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Prazo estourado</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> Faturamento × Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stockCount}</p>
          <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => navigate('/comercial/reconciliacao-faturamento-estoque')}>
            Abrir reconciliação <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Banknote className="h-4 w-4" /> Conciliação Bancária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{bankCount}</p>
          <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => navigate('/financeiro/conciliacao-canal')}>
            Abrir conciliação <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
