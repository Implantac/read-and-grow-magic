import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

export default function DemoSection() {
  return (
    <section className="bg-muted/30 border-y py-20">
      <div className="container mx-auto px-4 text-center">
        <Badge variant="outline" className="mb-4">Veja na prática</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">O sistema funcionando de verdade</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
          Não acredite só na nossa palavra. Veja como o sistema organiza a operação na prática.
        </p>
        <div className="max-w-4xl mx-auto aspect-video rounded-2xl bg-card border-2 border-dashed border-primary/20 flex items-center justify-center group cursor-pointer hover:border-primary/40 transition-all duration-300">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Play className="h-10 w-10 text-primary ml-1" />
            </div>
            <p className="text-muted-foreground font-medium">Clique para assistir a demonstração</p>
            <p className="text-sm text-muted-foreground/60 mt-1">2 minutos que podem mudar sua operação</p>
          </div>
        </div>
      </div>
    </section>
  );
}
