import { Award, Printer } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';

export function CertificateCard({ total }: { total: number }) {
  return (
    <Card className="mt-6 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
      <CardContent className="pt-6 text-center">
        <Award className="h-16 w-16 text-amber-500 mx-auto mb-3 drop-shadow-lg" />
        <h3 className="text-xl font-bold mb-2">🎉 Treinamento completo!</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
          Você percorreu os {total} módulos do manual. Está pronto para operar o ERP com autonomia,
          treinar sua equipe e liderar a implantação nas suas empresas.
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir certificado
        </Button>
      </CardContent>
    </Card>
  );
}
