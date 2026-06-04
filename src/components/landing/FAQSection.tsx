import { Badge } from '@/ui/base/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/ui/base/button';

const faqs = [
  {
    q: 'Quanto tempo leva para implantar a plataforma?',
    a: 'A implantação assistida leva em média 7 dias úteis. Isso inclui configuração completa, migração de dados, treinamento da equipe e acompanhamento dedicado até a operação estar rodando com segurança.',
  },
  {
    q: 'Preciso trocar todos os meus sistemas atuais?',
    a: 'Não necessariamente. A USE SISTEMAS é modular — você pode começar pelos módulos mais críticos e expandir conforme evolui. Também oferecemos integrações com ferramentas que você já usa.',
  },
  {
    q: 'Funciona para empresas de qualquer tamanho?',
    a: 'Sim. Temos planos desde pequenas operações até grandes indústrias com múltiplas filiais. A plataforma escala com seu negócio sem necessidade de troca de sistema.',
  },
  {
    q: 'Como funciona a inteligência artificial integrada?',
    a: 'A IA analisa dados em tempo real para prever gargalos na produção, sugerir ações comerciais, otimizar picking no estoque e gerar alertas preditivos — tudo automaticamente, sem configuração complexa.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Absolutamente. Criptografia SSL/TLS, backup automático diário, infraestrutura em nuvem com 99.9% de disponibilidade e conformidade total com a LGPD.',
  },
  {
    q: 'E se eu não gostar? Posso cancelar?',
    a: 'Sim. Não há fidelidade ou multa. Você testa por 14 dias grátis e pode cancelar quando quiser. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.',
  },
  {
    q: 'Vocês oferecem suporte em português?',
    a: 'Sim, 100%. Suporte humano com especialistas brasileiros que entendem de gestão industrial e operacional. Nada de chatbot genérico.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-5 font-medium px-4 py-1.5 text-xs">Dúvidas frequentes</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
            Perguntas que empresários{' '}
            <span className="text-gradient-primary">como você</span> fazem
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Respostas diretas para ajudar na sua decisão.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border/50 rounded-xl px-5 data-[state=open]:border-primary/20 data-[state=open]:shadow-md transition-all duration-300"
            >
              <AccordionTrigger className="text-sm font-bold text-foreground hover:text-primary hover:no-underline py-5 text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">Ainda tem dúvidas? Fale direto com um especialista.</p>
        </div>
      </div>
    </section>
  );
}
