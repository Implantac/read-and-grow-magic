import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';

export function TroubleshootingTab({ manual }: { manual: any }) {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Solução de problemas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {manual.troubleshooting.map((t: any, i: number) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{t.problem}</p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {t.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
