import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import type { ClientForm, Update } from './formState';

interface Props {
  formData: ClientForm;
  update: Update;
}

export function FiscalTab({ formData, update }: Props) {
  return (
    <TabsContent value="fiscal" className="mt-0 space-y-4">
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
        Dados fiscais usados para emissão de NF-e, NFC-e e cálculos tributários.
      </div>

      {formData.person_type === 'PJ' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Inscrição Estadual</Label>
            <Input value={formData.state_registration} onChange={(e) => update({ state_registration: e.target.value })} placeholder="ISENTO ou número" />
          </div>
          <div className="space-y-2">
            <Label>Inscrição Municipal</Label>
            <Input value={formData.municipal_registration} onChange={(e) => update({ municipal_registration: e.target.value })} />
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground text-center">
          Pessoa Física não possui Inscrição Estadual/Municipal. Para NFC-e ao consumidor final apenas o CPF é necessário.
        </div>
      )}
    </TabsContent>
  );
}
