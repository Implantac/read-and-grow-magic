import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Package, FileWarning, BarChart3 } from 'lucide-react';

const painItems = [
  { icon: Clock, text: 'Produção atrasada e sem visibilidade do que está acontecendo no chão de fábrica.' },
  { icon: Package, text: 'Estoque que não fecha — falta material quando precisa, sobra o que ninguém pediu.' },
  { icon: FileWarning, text: 'Pedidos que se perdem entre setores, exigindo conferência manual e retrabalho.' },
  { icon: BarChart3, text: 'Falta de controle real sobre custos, margem e lucratividade por produto.' },
];

export default function IdentificationSection() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="destructive" className="mb-4 font-medium px-4 py-1">Identificação</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Se você vive isso no dia a dia,{' '}
            <span className="text-destructive">você não está sozinho.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            A maioria das empresas em crescimento enfrenta exatamente esses cenários — e continua tentando resolver com planilha e boa vontade.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {painItems.map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-destructive/20 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="h-11 w-11 rounded-xl bg-destructive/8 flex items-center justify-center shrink-0 group-hover:bg-destructive/12 transition-colors duration-300">
                <item.icon className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed pt-1">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-destructive/5 border border-destructive/15 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="font-bold text-foreground">Quanto mais a empresa cresce, pior fica.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Sem integração, cada novo pedido multiplica o problema — e o custo do erro cresce junto com o faturamento.
          </p>
        </div>
      </div>
    </section>
  );
}
