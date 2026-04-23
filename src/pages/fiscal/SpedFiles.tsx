import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSpedFiles } from '@/hooks/useSpedFiles';
import { Download, Trash2, FileText, Loader2, Calendar, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function SpedFiles() {
  const { files, loading, generating, generate, download, remove } = useSpedFiles();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [type, setType] = useState<'sped_fiscal' | 'sped_contribuicoes'>('sped_fiscal');

  return (
    <PageContainer>
      <PageHeader
        title="Escrituração Fiscal Digital (SPED)"
        description="Geração de arquivos magnéticos em conformidade com o layout da Receita Federal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Parâmetros de Geração
            </CardTitle>
            <CardDescription>Defina o período e o tipo de arquivo</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Arquivo</Label>
              <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1">
                  <TabsTrigger value="sped_fiscal" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs px-2">FISCAL</TabsTrigger>
                  <TabsTrigger value="sped_contribuicoes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs px-2">CONTRIB.</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Período de Apuração
                </Label>
                <div className="grid gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">DE</span>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10 h-11" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">ATÉ</span>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10 h-11" />
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Automação Ativa</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  O sistema validará automaticamente inconsistências nos registros antes de consolidar o arquivo TXT.
                </p>
              </div>

              <Button 
                onClick={() => generate(type, startDate, endDate)} 
                disabled={generating} 
                className="w-full h-14 text-lg font-black shadow-xl shadow-primary/20"
              >
                {generating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> PROCESSANDO</> : 'GERAR ARQUIVO'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Histórico de Arquivos Gerados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Carregando histórico...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 opacity-10" />
                <p className="text-sm font-medium">Nenhum arquivo SPED gerado para este período.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Tipo / Identificação</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Valor Consolidado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

      <Card>
        <CardHeader><CardTitle>Arquivos Gerados</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum arquivo SPED gerado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Badge variant={f.type === 'sped_fiscal' ? 'default' : 'secondary'}>
                        {f.type === 'sped_fiscal' ? 'SPED Fiscal' : 'SPED Contribuições'}
                      </Badge>
                    </TableCell>
                    <TableCell>{f.startDate} → {f.endDate}</TableCell>
                    <TableCell>{f.totalRecords}</TableCell>
                    <TableCell>{f.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell>{format(new Date(f.generatedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => download(f.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
