import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';

function TotalBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

export function ReinfTotalsCard({ totals }: { totals: any }) {
  return (
    <Card className="lg:col-span-2 shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-lg">Totais consolidados</CardTitle>
        <CardDescription>Bases para o fechamento mensal</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TotalBox label="R-2010 (qtd)" value={String(totals.r2010_qtd ?? 0)} />
          <TotalBox label="INSS tomado" value={formatBRL(Number(totals.r2010_inss ?? 0))} />
          <TotalBox label="R-2020 (qtd)" value={String(totals.r2020_qtd ?? 0)} />
          <TotalBox label="INSS prestado" value={formatBRL(Number(totals.r2020_inss ?? 0))} />
          <TotalBox label="R-4020 (qtd)" value={String(totals.r4020_qtd ?? 0)} />
          <TotalBox label="IR retido" value={formatBRL(Number(totals.r4020_ir ?? 0))} />
          <TotalBox label="CSLL retido" value={formatBRL(Number(totals.r4020_csll ?? 0))} />
          <TotalBox label="PIS retido" value={formatBRL(Number(totals.r4020_pis ?? 0))} />
          <TotalBox label="COFINS retido" value={formatBRL(Number(totals.r4020_cofins ?? 0))} />
          <TotalBox
            label="Total DARF (R-4099)"
            value={formatBRL(
              Number(totals.r4020_ir ?? 0) + Number(totals.r4020_csll ?? 0) +
              Number(totals.r4020_pis ?? 0) + Number(totals.r4020_cofins ?? 0),
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
