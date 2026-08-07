import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { ShoppingBag, Puzzle, Zap, Star, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';

export default function PluginMarketplace() {
  const plugins = [
    {
      id: 'whatsapp-pro',
      name: 'WhatsApp Business API',
      category: 'Comunicação',
      rating: 4.9,
      installs: '1.2k',
      price: 'Free',
      description: 'Envio automático de NF-e, boletos e alertas de entrega via WhatsApp.',
      verified: true
    },
    {
      id: 'stripe-connect',
      name: 'Stripe Payments',
      category: 'Financeiro',
      rating: 5.0,
      installs: '850',
      price: 'Free',
      description: 'Integração nativa para pagamentos recorrentes e checkout transparente.',
      verified: true
    },
    {
      id: 'iot-tracker',
      name: 'IoT Fleet Tracker',
      category: 'Logística',
      rating: 4.7,
      installs: '420',
      price: 'Premium',
      description: 'Telemetria em tempo real para frotas e temperatura de armazém.',
      verified: true
    },
    {
      id: 'nfe-global',
      name: 'Fiscal Pro (Multi-moeda)',
      category: 'Fiscal',
      rating: 4.8,
      installs: '310',
      price: 'Premium',
      description: 'Suporte a emissão de faturas internacionais e conversão automática.',
      verified: true
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Marketplace de Aplicações"
        description="Expanda os horizontes do seu ERP com plugins e integrações oficiais."
        icon={Puzzle}
        actions={<Button className="gap-2"><ShoppingBag className="h-4 w-4" /> Ver Meus Apps</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plugins.map((plugin) => (
          <Card key={plugin.id} className="flex flex-col h-full transition-all hover:border-primary/50 group">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Puzzle className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="text-[10px]">{plugin.category}</Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-1">
                {plugin.name}
                {plugin.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">
                {plugin.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <div className="flex items-center justify-between text-xs mb-4">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {plugin.rating}
                </div>
                <div className="text-muted-foreground">
                  {plugin.installs} instalações
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" className="flex-1 text-xs gap-1">
                  <Download className="h-3 w-3" /> Instalar
                </Button>
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-primary/5 rounded-2xl p-8 border border-primary/10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">DEVELOPER PROGRAM</Badge>
            <h3 className="text-2xl font-black tracking-tighter uppercase">Crie seu próprio plugin</h3>
            <p className="text-muted-foreground text-sm">
              Use nossa SDK oficial e GraphQL API para construir extensões que resolvem problemas específicos do seu nicho.
            </p>
            <Button variant="outline" className="gap-2">
              <Zap className="h-4 w-4" /> Acessar SDK Documentation
            </Button>
          </div>
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-16 h-16 bg-background rounded-xl border border-primary/20 flex items-center justify-center shadow-lg transform rotate-6 first:-rotate-6">
                  <Puzzle className="h-8 w-8 text-primary/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
