import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import { Copy, ThumbsUp } from 'lucide-react';
import { objectionCategories } from './constants';

interface Props {
  objections: any[];
  loading: boolean;
  onCopy: (text: string) => void;
  onMarkUsed: (id: string) => void;
}

export function ObjectionsTab({ objections, loading, onCopy, onMarkUsed }: Props) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {objectionCategories.map((cat) => {
        const catObj = objections.filter((o) => o.category === cat.value);
        if (catObj.length === 0) return null;
        return (
          <AccordionItem key={cat.value} value={cat.value} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="font-semibold">{cat.label}</span>
                <Badge variant="secondary" className="ml-2">{catObj.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {catObj.map((obj) => (
                  <Card key={obj.id} className="border-l-4 border-l-destructive/50">
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <p className="font-medium text-destructive">🗣️ "{obj.objection}"</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">✅ Resposta:</p>
                        <p className="text-sm">{obj.response}</p>
                      </div>
                      {obj.strategy && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">🎯 Estratégia:</p>
                          <p className="text-sm">{obj.strategy}</p>
                        </div>
                      )}
                      {obj.context && (
                        <p className="text-xs text-muted-foreground">📌 {obj.context}</p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onCopy(obj.response)}>
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onMarkUsed(obj.id)}>
                          <ThumbsUp className="h-3 w-3 mr-1" /> Usei
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
