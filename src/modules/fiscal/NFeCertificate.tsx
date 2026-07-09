import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Alert, AlertDescription, AlertTitle } from "@/ui/base/alert";
import { Badge } from "@/ui/base/badge";
import { RadioGroup, RadioGroupItem } from "@/ui/base/radio-group";
import { ShieldCheck, Upload, RefreshCw, AlertTriangle } from "lucide-react";
import {
  useNfeCertificates,
  useUploadNfeCertificate,
  useSefazStatus,
  useRefreshSefazStatus,
} from "@/hooks/fiscal/useNfeCertificate";

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
    setFile(null); setPassword("");
  };

  const active = (certs ?? []).find((c) => c.active);

  return (
    <PageContainer>
      <PageHeader
        title="Certificado A1 e SEFAZ"
        description="Configure o certificado digital da empresa e monitore a disponibilidade dos webservices SEFAZ."
        icon={ShieldCheck}
      />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Ambiente de homologação</AlertTitle>
        <AlertDescription>
          As NFes emitidas em homologação <strong>não têm valor fiscal</strong>. Após validar o fluxo,
          configure o proxy mTLS (variável <code>SEFAZ_MTLS_PROXY_URL</code>) e o certificado de produção
          para começar a emitir com valor fiscal.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Certificado ativo</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading && <p className="text-muted-foreground">Carregando…</p>}
            {!isLoading && !active && (
              <p className="text-muted-foreground">Nenhum certificado ativo. Faça upload do .pfx.</p>
            )}
            {active && (
              <>
                <div><strong>Arquivo:</strong> {active.filename}</div>
                <div><strong>Titular:</strong> {active.subject}</div>
                <div><strong>Validade:</strong> {active.not_after ? new Date(active.not_after).toLocaleDateString() : "-"}</div>
                <div>
                  <strong>Ambiente:</strong>{" "}
                  <Badge variant={active.environment === 1 ? "destructive" : "secondary"}>
                    {active.environment === 1 ? "Produção" : "Homologação"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  Nome do secret da senha: <code>{active.password_secret_name}</code>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upload de novo certificado A1</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="pfx">Arquivo .pfx</Label>
                <Input id="pfx" type="file" accept=".pfx,application/x-pkcs12"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <Label htmlFor="pwd">Senha do certificado</Label>
                <Input id="pwd" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label>Ambiente</Label>
                <RadioGroup value={environment} onValueChange={(v) => setEnvironment(v as "1" | "2")} className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="2" /> Homologação
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="1" /> Produção
                  </label>
                </RadioGroup>
              </div>
              <Button type="submit" disabled={!file || !password || upload.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {upload.isPending ? "Enviando…" : "Enviar certificado"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status SEFAZ por UF (homologação)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => refresh.mutate(2)} disabled={refresh.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
            {(status ?? []).map((s: any) => (
              <div key={s.uf} className="rounded border p-2 text-center">
                <div className="font-semibold">{s.uf}</div>
                <Badge variant={s.status === "online" ? "secondary" : s.status === "offline" ? "destructive" : "outline"}>
                  {s.status}
                </Badge>
                <div className="text-muted-foreground mt-1">{s.avg_response_ms ?? "-"}ms</div>
              </div>
            ))}
            {(status ?? []).length === 0 && (
              <p className="col-span-full text-muted-foreground">Ainda sem observações. Clique em Atualizar.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
