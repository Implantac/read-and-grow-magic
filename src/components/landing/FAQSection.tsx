import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Quanto tempo leva para implantar a plataforma?',
    a: 'A implantação assistida leva em média 7 dias úteis. Isso inclui configuração, migração de dados, treinamento da equipe e acompanhamento dedicado até a operação estar rodando com segurança.',
  },
  {
    q: 'Preciso trocar todos os meus sistemas atuais?',
    a: 'Não necessariamente. A USE SISTEMAS é modular — você pode começar pelos módulos mais críticos e expandir conforme sua operação evolui. Também oferecemos integrações com ferramentas que você já usa.',
  },
  {
    q: 'O sistema funciona para empresas de qualquer tamanho?',
    a: 'Sim. Temos planos desde pequenas operações até grandes indústrias com múltiplas filiais. A plataforma escala com seu negócio sem necessidade de troca de sistema.',
  },
  {
    q: 'Como funciona a inteligência artificial integrada?',
    a: 'A IA da USE SISTEMAS analisa dados em tempo real para prever gargalos na produção, sugerir ações comerciais, otimizar picking no estoque e gerar alertas preditivos — tudo automaticamente, sem configuração complexa.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Absolutamente. Utilizamos criptografia SSL/TLS, backup automático diário, infraestrutura em nuvem com 99.9% de disponibilidade e estamos em conformidade com a LGPD.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Não há fidelidade ou multa de cancelamento. Você pode cancelar quando quiser e seus dados ficam disponíveis para exportação por 30 dias.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 font-medium px-4 py-1">Dúvidas frequentes</Badge>
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
      </div>
    </section>
  );
}
