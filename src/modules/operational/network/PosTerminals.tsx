import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Monitor, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { usePosTerminals } from '@/hooks/operational/network/useNetworkArchitecture';
import { EmptyState } from '@/shared/components/EmptyState';

export default function PosTerminalsPage() {
  const { data: terminals, isLoading } = usePosTerminals();

  return (
    <PageContainer loading={isLoading}>
      <PageHeader 
        title="Terminais PDV" 
        description="Gestão de identidades únicas para pontos de venda"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Terminal
        </Button>
      </PageHeader>

      {terminals && terminals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <Card key={terminal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {terminal.name}
                </CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Código:</span>
                    <span className="text-xs font-mono font-bold">{terminal.code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Badge variant={terminal.status === 'active' ? "default" : "secondary"}>
                      {terminal.status === 'active' ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-[10px] text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    Autenticação Blindada Ativa
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Monitor}
          title="Nenhum terminal encontrado"
          description="Cadastre terminais para permitir operações de venda nesta unidade."
        />
      )}
    </PageContainer>
  );
}
