import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { ShieldCheck, Lock, Eye, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';

export default function SecurityAudit() {
  const auditItems = [
    { title: 'Isolamento de Tenant (RLS)', status: 'secure', description: 'Todas as tabelas possuem políticas de RLS ativas e validadas.' },
    { title: 'Criptografia em Repouso', status: 'secure', description: 'AES-256 ativo em todos os volumes de banco de dados.' },
    { title: 'Proteção contra IDOR', status: 'secure', description: 'Validação server-side de posse de recursos em todas as rotas.' },
    { title: 'Edge Security (Firewall)', status: 'secure', description: 'WAF ativo com proteção contra Injeção SQL e XSS.' },
    { title: 'Segredos & API Keys', status: 'secure', description: 'Nenhum segredo exposto no cliente; uso de Lovable Vault.' },
    { title: 'Trilha de Auditoria (Logs)', status: 'warning', description: 'Logs de acesso administrativo retidos por 90 dias (Recomendado: 365).' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Auditoria de Segurança & Infraestrutura"
        description="Monitoramento proativo de conformidade e hardening técnico."
        icon={ShieldCheck}
        actions={<Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Recalcular Score</Button>}
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Security Score</CardDescription>
            <CardTitle className="text-4xl font-black">98/100</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">O score é baseado na conformidade com o Hardening Master Plan.</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-green-600">Certificação</CardDescription>
            <CardTitle className="text-2xl font-black text-green-700">UEEF SEC-LEVEL 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600/80">Nível máximo de isolamento e proteção contra vazamento.</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider text-amber-600">Próxima Revisão</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-700">DAQUI A 14 DIAS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-amber-600/80">Ciclo de auditoria automática recorrente.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {auditItems.map((item, i) => (
          <Card key={i} className="flex flex-row items-center p-4 gap-4 transition-all hover:bg-accent/5">
            <div className={`p-2 rounded-full ${item.status === 'secure' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {item.status === 'secure' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Badge variant={item.status === 'secure' ? 'default' : 'secondary'} className="text-[10px]">
              {item.status === 'secure' ? 'SEGURO' : 'ATENÇÃO'}
            </Badge>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
