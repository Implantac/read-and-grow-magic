import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';

type Props = {
  activities: number;
  produced: number;
  rejected: number;
  piecesPerHour: string;
  qualityRate: string;
};

export function ShiftSummaryCard({ activities, produced, rejected, piecesPerHour, qualityRate }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" /> Resumo do Turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <Metric value={activities} label="Atividades" tone="muted" />
          <Metric value={produced} label="Peças Boas" tone="success" />
          <Metric value={rejected} label="Refugo" tone="destructive" />
          <Metric value={piecesPerHour} label="Peças/h" tone="primary" />
          <Metric value={`${qualityRate}%`} label="Qualidade" tone="info" />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ value, label, tone }: { value: React.ReactNode; label: string; tone: 'muted' | 'success' | 'destructive' | 'primary' | 'info' }) {
  const bg = {
    muted: 'bg-muted',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    primary: 'bg-primary/10',
    info: 'bg-info/10',
  }[tone];
  return (
    <div className={`p-3 rounded-xl ${bg}`}>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
