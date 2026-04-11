import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

export default function DemoSection() {
  return (
    <section className="bg-muted/20 border-y py-24">
      <div className="container mx-auto px-4 text-center">
        <Badge variant="outline" className="mb-4 font-medium">Veja na prática</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">O sistema funcionando de verdade</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-12">
          Assista como o sistema organiza toda a operação — da venda à entrega — em poucos cliques.
        </p>
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl bg-card border shadow-elevation-3 overflow-hidden group cursor-pointer hover:shadow-elevation-4 transition-all duration-500">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-primary/[0.03]" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/15 group-hover:shadow-glow transition-all duration-500">
                  <Play className="h-10 w-10 text-primary ml-1" />
                </div>
                <p className="text-foreground font-semibold text-lg">Assistir demonstração</p>
                <p className="text-sm text-muted-foreground mt-1">2 minutos que podem mudar sua operação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
