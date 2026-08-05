import { useState, useMemo } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Alert, AlertDescription, AlertTitle } from "@/ui/base/alert";
import { Badge } from "@/ui/base/badge";
import { RadioGroup, RadioGroupItem } from "@/ui/base/radio-group";
import { Progress } from "@/ui/base/progress";
import { 
  ShieldCheck, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  Calendar, 
  Lock, 
  Clock, 
  CheckCircle2, 
  FileKey,
  Database
} from "lucide-react";
import {
  useNfeCertificates,
  useUploadNfeCertificate,
  useSefazStatus,
  useRefreshSefazStatus,
} from "@/hooks/fiscal/useNfeCertificate";
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export default function NFeCertificate() {
  const { data: certs, isLoading } = useNfeCertificates();
  const upload = useUploadNfeCertificate();
  const { data: status } = useSefazStatus(2);
  const refresh = useRefreshSefazStatus();

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [environment, setEnvironment] = useState<"1" | "2">("2");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !password) return;
    await upload.mutateAsync({ file, password, environment: Number(environment) as 1 | 2 });
    setFile(null); 
    setPassword("");
  };

  const active = useMemo(() => (certs ?? []).find((c) => c.active), [certs]);

  const certHealth = useMemo(() => {
    if (!active?.not_after) return null;
    const expiry = new Date(active.not_after);
    const daysLeft = differenceInDays(expiry, new Date());
    const isExpired = isPast(expiry);
    
    // Assuming 1 year validity for A1 (365 days)
    const progress = Math.max(0, Math.min(100, (daysLeft / 365) * 100));
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    if (daysLeft < 30) variant = "destructive";
    else if (daysLeft < 60) variant = "outline";

    return { daysLeft, isExpired, progress, variant, expiry };
  }, [active]);

  return (
    <PageContainer>
      <PageHeader
        title="Fiscal A1 Vault"
        description="Gestão de certificados digitais e monitoramento de conectividade SEFAZ."
        icon={Lock}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Certificate Health Card */}
        <Card className={cn(
          "md:col-span-2 border-2",
          certHealth?.daysLeft && certHealth.daysLeft < 30 ? "border-destructive/50" : "border-primary/10"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  Certificado A1 Ativo
                </CardTitle>
                <CardDescription>Status de validade e criptografia do emissor</CardDescription>
              </div>
              {active && (
                <Badge variant={active.environment === 1 ? "destructive" : "secondary"}>
                  {active.environment === 1 ? "PRODUÇÃO (Real)" : "HOMOLOGAÇÃO (Teste)"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Carregando vault...
              </div>
            ) : !active ? (
              <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg bg-muted/30">
                <FileKey className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">Nenhum certificado A1 configurado</p>
                <Button variant="link" size="sm" onClick={() => document.getElementById('pfx')?.focus()}>
                  Realizar Upload agora
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <Database className="h-3 w-3 mr-1" /> Identificação do Titular
                    </div>
                    <p className="text-sm font-bold truncate">{active.subject}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{active.filename}</Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">ID: {active.id.split('-')[0]}</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <Calendar className="h-3 w-3 mr-1" /> Ciclo de Vida do Certificado
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Vencimento</span>
                      <span className="font-bold">{format(certHealth!.expiry, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold">
                        <span>Saúde da Validade</span>
                        <span>{certHealth!.daysLeft} dias restantes</span>
                      </div>
                      <Progress value={certHealth!.progress} className="h-1.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-md bg-blue-500/5 border border-blue-500/20">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Criptografia RSA 2048-bit</p>
                    <p className="text-[10px] text-muted-foreground">Senha protegida no Secret Vault. ID: {active.password_secret_name}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Atualizar / Novo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="pfx" className="text-xs">Arquivo .pfx / .p12</Label>
                <Input id="pfx" type="file" accept=".pfx,application/x-pkcs12"
                  className="h-9 text-xs"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pwd" className="text-xs">Senha</Label>
                <Input id="pwd" type="password" value={password}
                  className="h-9"
                  onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ambiente de Destino</Label>
                <RadioGroup value={environment} onValueChange={(v) => setEnvironment(v as "1" | "2")} className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <RadioGroupItem value="2" /> Homologação
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <RadioGroupItem value="1" /> Produção
                  </label>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full" disabled={!file || !password || upload.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {upload.isPending ? "Processando..." : "Upload p/ Vault"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {!active?.environment || active.environment === 2 ? (
        <Alert className="mt-6 border-amber-500/50 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500 font-bold">Ambiente de Homologação Ativo</AlertTitle>
          <AlertDescription className="text-xs">
            As notas emitidas não possuem validade jurídica. Utilize para testes de integração e validação de impostos.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Status WebServices SEFAZ
            </CardTitle>
            <CardDescription className="text-xs">Disponibilidade em tempo real dos servidores da Receita</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => refresh.mutate(2)} disabled={refresh.isPending}>
            <RefreshCw className={cn("mr-2 h-3 w-3", refresh.isPending && "animate-spin")} />
            Ping Todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 lg:grid-cols-12 gap-2">
            {(status ?? []).map((s: any) => (
              <div key={s.uf} className="rounded border bg-muted/20 p-2 text-center transition-all hover:bg-muted/40">
                <div className="font-bold text-[10px]">{s.uf}</div>
                <div className={cn(
                  "w-2 h-2 rounded-full mx-auto my-1.5",
                  s.status === "online" ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : 
                  s.status === "offline" ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-muted"
                )} />
                <div className="text-[9px] text-muted-foreground font-mono">{s.avg_response_ms ?? "-"}ms</div>
              </div>
            ))}
            {(status ?? []).length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground italic text-xs">
                Nenhum dado de telemetria disponível. Inicie um Ping para verificar conectividade.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
