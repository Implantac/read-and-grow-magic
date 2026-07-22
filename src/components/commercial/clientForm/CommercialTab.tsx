import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { clientSegments } from '@/config/commercial';
import type { ClientForm, Update } from './formState';

interface Props {
  formData: ClientForm;
  update: Update;
  salesReps: Array<{ id: string; name: string; code: string; status: string }>;
}

export function CommercialTab({ formData, update, salesReps }: Props) {
  return (
    <TabsContent value="commercial" className="mt-0 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Segmento</Label>
          <Select value={formData.segment} onValueChange={(v) => update({ segment: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {clientSegments.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Representante Responsável</Label>
          <Select value={formData.sales_rep_id || '_none'} onValueChange={(v) => update({ sales_rep_id: v === '_none' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nenhum</SelectItem>
              {salesReps.filter(r => r.status === 'active').map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Limite de Crédito (R$)</Label>
          <Input type="number" min="0" step="0.01" value={formData.credit_limit} onChange={(e) => update({ credit_limit: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Potencial Estimado (R$)</Label>
          <Input type="number" min="0" step="0.01" value={formData.estimated_potential} onChange={(e) => update({ estimated_potential: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Condição de Pagamento</Label>
          <Select value={formData.default_payment_condition} onValueChange={(v) => update({ default_payment_condition: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="À vista">À Vista</SelectItem>
              <SelectItem value="30 dias">30 Dias</SelectItem>
              <SelectItem value="30/60 dias">30/60 Dias</SelectItem>
              <SelectItem value="30/60/90 dias">30/60/90 Dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tabela de Preço</Label>
          <Select value={formData.price_table} onValueChange={(v) => update({ price_table: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="wholesale">Atacado</SelectItem>
              <SelectItem value="special">Especial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Classificação ABC</Label>
          <Select value={formData.abc_classification} onValueChange={(v) => update({ abc_classification: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A - Alta</SelectItem>
              <SelectItem value="B">B - Média</SelectItem>
              <SelectItem value="C">C - Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Score / Potencial</Label>
          <Select value={formData.client_score} onValueChange={(v) => update({ client_score: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alto Potencial</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações Comerciais</Label>
        <Textarea
          value={formData.commercial_notes}
          onChange={(e) => update({ commercial_notes: e.target.value })}
          placeholder="Notas internas sobre o cliente, preferências, histórico de relacionamento..."
          rows={3}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">{formData.commercial_notes.length}/1000</p>
      </div>
    </TabsContent>
  );
}
