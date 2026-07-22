import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';

export function OverviewTab({ manual }: { manual: any }) {
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> O que é este módulo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          {manual.overview.map((p: string, i: number) => <p key={i}>{p}</p>)}
        </CardContent>
      </Card>

      {manual.sections.length > 0 && (
        <div className="space-y-4">
          {manual.sections.map((s: any, i: number) => (
            <Card key={i}>
              <CardHeader><CardTitle className="text-base">{s.heading}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                {s.paragraphs.map((p: string, j: number) => <p key={j}>{p}</p>)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
