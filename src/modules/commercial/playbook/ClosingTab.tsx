import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Copy } from 'lucide-react';

interface Props {
  playbooks: any[];
  selectedStage: string;
  onSelectStage: (s: string) => void;
  onCopy: (text: string, playbookId?: string) => void;
}

export function ClosingTab({ playbooks, selectedStage, onSelectStage, onCopy }: Props) {
  const closingPBs = playbooks.filter((pb) => pb.closing_techniques.length > 0);

  if (closingPBs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {selectedStage !== 'all' ? (
            <>
              Selecione "Todas" para ver técnicas de fechamento.
              <Button variant="link" className="block mx-auto mt-2" onClick={() => onSelectStage('all')}>
                Ver todas as etapas
              </Button>
            </>
          ) : (
            'Nenhuma técnica de fechamento cadastrada.'
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {closingPBs.map((pb) => (
        <Card key={pb.id} className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">🎯 {pb.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pb.closing_techniques.map((t: string, i: number) => (
              <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 relative group">
                <p className="text-sm pr-8">{t}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-7"
                  onClick={() => onCopy(t, pb.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
