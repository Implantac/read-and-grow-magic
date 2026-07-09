import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { toast } from 'sonner';
import { LayoutTemplate } from 'lucide-react';

type Row = { id: string; name: string; metric: string; description: string; questions: any[]; is_public: boolean };

export default function SurveyTemplates() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('cx_survey_templates')
        .select('id, name, metric, description, questions, is_public')
        .order('metric');
      if (error) toast.error(error.message); else setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><LayoutTemplate className="h-5 w-5" /> Templates de Pesquisa</h2>
      <p className="text-sm text-muted-foreground">Modelos prontos para NPS, CSAT, CES 2.0, Likert, Emoji e Estrelas. Use como base para novas campanhas.</p>
      {loading && <div className="p-6 text-center text-muted-foreground">Carregando…</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs text-muted-foreground uppercase">{r.metric}</p>
              </div>
              {r.is_public && <Badge variant="outline">Público</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{r.description}</p>
            <div className="mt-3 text-xs">
              <span className="text-muted-foreground">Perguntas:</span>{' '}
              <span className="font-mono">{r.questions?.length ?? 0}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
