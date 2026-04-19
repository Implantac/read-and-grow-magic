import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSpedFiles } from '@/hooks/useSpedFiles';
import { Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function SpedFiles() {
  const { files, loading, generating, generate, download, remove } = useSpedFiles();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [type, setType] = useState<'sped_fiscal' | 'sped_contribuicoes'>('sped_fiscal');

  return (
    <PageContainer>
      <PageHeader
        title="SPED Fiscal e Contribuições"
        description="Geração de arquivos SPED para envio ao Fisco (formato TXT padrão SEFAZ/Receita Federal)"
      />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Gerar Arquivo SPED</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            <TabsList>
              <TabsTrigger value="sped_fiscal">SPED Fiscal (ICMS/IPI)</TabsTrigger>
              <TabsTrigger value="sped_contribuicoes">SPED Contribuições (PIS/COFINS)</TabsTrigger>
            </TabsList>
            <TabsContent value="sped_fiscal" className="text-sm text-muted-foreground pt-2">
              Apura ICMS e IPI a partir das NF-e autorizadas no período. Gera blocos 0, C e 9.
            </TabsContent>
            <TabsContent value="sped_contribuicoes" className="text-sm text-muted-foreground pt-2">
              Apura PIS e COFINS a partir das NF-e de saída autorizadas. Gera blocos 0, A e 9.
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data Inicial</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Data Final</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => generate(type, startDate, endDate)} disabled={generating} className="w-full">
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : 'Gerar SPED'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
