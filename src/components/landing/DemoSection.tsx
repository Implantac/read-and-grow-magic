import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import dashboardMockup from '@/assets/dashboard-mockup.jpg';

export default function DemoSection() {
  return (
    <section className="bg-muted/20 border-y border-border/50 py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <Badge variant="outline" className="mb-4 font-medium px-4 py-1">Veja na prática</Badge>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          Veja a plataforma em <span className="text-gradient-primary">funcionamento</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-12">
          Assista como toda a operação se conecta — da venda à entrega — em poucos cliques.
        </p>
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500">
            <img
              src={dashboardMockup}
              alt="Demonstração da plataforma USE SISTEMAS"
              className="w-full h-full object-cover object-top opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/25 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary/15 group-hover:border-primary/40 group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.25)] transition-all duration-500">
                  <Play className="h-9 w-9 text-primary ml-1" />
                </div>
                <p className="text-foreground font-bold text-lg">Assistir demonstração</p>
                <p className="text-sm text-muted-foreground mt-1.5">2 minutos que vão mudar sua visão sobre gestão</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
