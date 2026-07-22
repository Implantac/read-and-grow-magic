import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';

export function FaqTab({ manual }: { manual: any }) {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" /> Perguntas frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {manual.faq.map((f: any, i: number) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
