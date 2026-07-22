import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { GENERAL_FAQ } from '../glossary';

export function FAQCard() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-5 w-5 text-primary" /> Perguntas frequentes do implantador
        </CardTitle>
        <CardDescription>
          Dúvidas reais que aparecem em toda implantação. Se a sua não estiver aqui, veja o FAQ do módulo específico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {GENERAL_FAQ.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm text-left hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
