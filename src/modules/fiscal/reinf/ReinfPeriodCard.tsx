import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Calendar, FileText, Lock, Send, Sparkles, Unlock } from 'lucide-react';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  aberto: 'secondary',
  fechado: 'default',
  reaberto: 'outline',
};

interface Props {
  competencia: string;
  setCompetencia: (v: string) => void;
  currentPeriod: any;
  busy: boolean;
  isClosed: boolean;
  eventsCount: number;
  transmitting: boolean;
  openPeriod: () => void;
  generateR2010: () => void;
  generateR2020: () => void;
  generateR4020: () => void;
  closePeriod: () => void;
  reopen: (id: string) => void;
  onTransmit: () => void;
}

export function ReinfPeriodCard({
  competencia, setCompetencia, currentPeriod, busy, isClosed, eventsCount, transmitting,
  openPeriod, generateR2010, generateR2020, generateR4020, closePeriod, reopen, onTransmit,
}: Props) {
  return (
    <Card className="lg:col-span-1 shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" /> Competência
        </CardTitle>
        <CardDescription>Selecione o mês de apuração</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mês</Label>
          <Input
            type="month"
            value={competencia.slice(0, 7)}
            onChange={(e) => setCompetencia(`${e.target.value}-01`)}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="text-sm">
            <div className="font-semibold">Status</div>
            <div className="text-xs text-muted-foreground">{currentPeriod?.competencia || competencia}</div>
          </div>
          <Badge variant={statusVariant[currentPeriod?.status || 'aberto']}>
            {currentPeriod?.status || 'não aberto'}
          </Badge>
        </div>

        <div className="grid gap-2">
          <Button onClick={openPeriod} disabled={busy} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" /> Abrir competência
          </Button>
          <Button onClick={generateR2010} disabled={busy || isClosed}>
            <FileText className="h-4 w-4 mr-2" /> Gerar R-2010 (INSS tomado)
          </Button>
          <Button onClick={generateR2020} disabled={busy || isClosed}>
            <FileText className="h-4 w-4 mr-2" /> Gerar R-2020 (INSS prestado)
          </Button>
          <Button onClick={generateR4020} disabled={busy || isClosed}>
            <FileText className="h-4 w-4 mr-2" /> Gerar R-4020 (IR/CSLL/PIS/COFINS)
          </Button>
          {!isClosed ? (
            <Button onClick={closePeriod} disabled={busy || !currentPeriod} variant="default">
              <Lock className="h-4 w-4 mr-2" /> Fechar competência
            </Button>
          ) : (
            <Button onClick={() => currentPeriod && reopen(currentPeriod.id)} disabled={busy} variant="secondary">
              <Unlock className="h-4 w-4 mr-2" /> Reabrir competência
            </Button>
          )}
          <Button
            onClick={onTransmit}
            disabled={transmitting || busy || !currentPeriod || eventsCount === 0}
            variant="outline"
            className="border-primary/40"
          >
            <Send className="h-4 w-4 mr-2" />
            {transmitting ? 'Transmitindo…' : 'Transmitir (homologação)'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
