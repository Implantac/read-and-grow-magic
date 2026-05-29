import { useState, useRef } from 'react';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseCSV, parseOFX, useImportBankStatement, useAutoMatch, type ParsedTx } from '@/hooks/useBankStatementImport';
import { useBankAccounts } from '@/hooks/useBankAccounts';

import { formatBRL, formatDate } from '@/lib/formatters';

export default function BankStatementImport() {
  const [parsed, setParsed] = useState<ParsedTx[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const importMut = useImportBankStatement();
  const autoMatch = useAutoMatch();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { toast } = useToast();

  async function handleFile(file: File) {
    setFilename(file.name);
    try {
      const text = await file.text();
      const isOFX = /<OFX|<STMTTRN/i.test(text);
      const txs = isOFX ? parseOFX(text) : parseCSV(text);
      if (txs.length === 0) {
        toastError('Verifique o formato do arquivo', undefined, 'Nenhuma transação encontrada');
        return;
      }
      setParsed(txs);
      toastSuccess(`${txs.length} transações lidas`, 'Selecione a conta bancária e importe.');
    } catch (e: any) {
      toastError(e.message, undefined, 'Erro ao ler arquivo');
    }
  }

  function handleImport() {
    if (!bankAccountId) {
      toastError('Selecione uma conta bancária');
      return;
    }
    importMut.mutate({ txs: parsed, bankAccountId }, {
      onSuccess: () => { setParsed([]); setFilename(null); }
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Open Finance — Importação de Extrato"
        description="CSV ou OFX com match automático contra o ledger financeiro"
        actions={
          <Button variant="outline" onClick={() => autoMatch.mutate(bankAccountId || undefined)} disabled={autoMatch.isPending} className="gap-2">
            <Zap className="h-4 w-4" /> Re-conciliar pendentes
          </Button>
        }
      />

      <Card>
        <CardHeader><CardTitle>1. Conta bancária de destino</CardTitle></CardHeader>
        <CardContent>
          <Label>Conta</Label>
          <Select value={bankAccountId} onValueChange={setBankAccountId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Selecione a conta..." /></SelectTrigger>
            <SelectContent>
              {(bankAccounts as any[]).map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.name} — {a.bank_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Selecione o arquivo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 transition"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm">Clique ou arraste um arquivo CSV/OFX</p>
            {filename && <Badge variant="outline" className="mt-3"><FileText className="h-3 w-3 mr-1" /> {filename}</Badge>}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.ofx,.txt" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p className="text-xs text-muted-foreground">
            <strong>CSV:</strong> cabeçalho com colunas <code>date, description, amount</code> (separador , ou ;).<br />
            <strong>OFX:</strong> qualquer extrato padrão de banco brasileiro.
          </p>
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>3. Pré-visualização ({parsed.length} transações)</CardTitle>
            <Button onClick={handleImport} disabled={importMut.isPending || !bankAccountId} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Importar e conciliar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Ref. Banco</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 100).map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{formatDate(t.date)}</TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell><Badge variant={t.type === 'credit' ? 'default' : 'destructive'}>{t.type}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatBRL(t.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.bank_reference ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsed.length > 100 && <p className="text-xs text-muted-foreground p-3 text-center">+ {parsed.length - 100} adicionais não exibidas</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
