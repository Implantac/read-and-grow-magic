import { Badge } from '@/ui/base/badge';
import { AlertCircle, Clock, Package, FileWarning, BarChart3, Users, Truck } from 'lucide-react';

const painItems = [
  { icon: Clock, title: 'Produção atrasada', text: 'Sem visibilidade do chão de fábrica. Prazos estourados, clientes cobrando e ninguém sabe onde está o gargalo.' },
  { icon: Package, title: 'Estoque descontrolado', text: 'Falta material na hora de produzir, sobra o que ninguém pediu. Capital parado e compras por emergência.' },
  { icon: FileWarning, title: 'Pedidos que se perdem', text: 'Informação sai de um setor e não chega no outro. Conferência manual, retrabalho e erro humano constante.' },
  { icon: BarChart3, title: 'Lucro invisível', text: 'Vende muito, mas no fim do mês não sabe para onde foi o dinheiro. Sem custo real, sem margem real.' },
  { icon: Users, title: 'Equipe sem direção', text: 'Cada setor trabalha isolado. Sem prioridade clara, sem painel único, sem alinhamento operacional.' },
  { icon: Truck, title: 'Entregas com problema', text: 'Separação errada, nota fiscal atrasada, cliente reclamando. O operacional consome todo o tempo da gestão.' },
];

export default function IdentificationSection() {
  return (
    <section id="problemas" className="container mx-auto px-4 lg:px-8 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <Badge variant="destructive" className="mb-5 font-medium px-4 py-1.5 text-xs">Diagnóstico</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 tracking-tight text-foreground">
            Se você vive isso no dia a dia,{' '}
            <span className="text-primary">precisa agir agora.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Esses cenários são comuns em empresas que cresceram rápido demais para seus processos. A boa notícia: todos são resolvíveis.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {painItems.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border/50 hover:border-destructive/25 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/8 flex items-center justify-center shrink-0 group-hover:bg-destructive/12 transition-colors duration-300">
                  <item.icon className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 md:p-6 rounded-2xl bg-destructive/5 border border-destructive/15 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="font-bold text-foreground text-base">Quanto mais a empresa cresce, maior o custo da desorganização.</p>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Sem integração, cada novo pedido multiplica o problema — e o custo do erro cresce mais rápido que o faturamento.
          </p>
        </div>
      </div>
    </section>
  );
}
