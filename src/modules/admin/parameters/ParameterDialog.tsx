import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Switch } from '@/ui/base/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Save, Loader2 } from 'lucide-react';
import { useSystemParameters } from '@/hooks/system/useSystemParameters';

interface ParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameter: any | null;
}

export const ParameterDialog = ({ open, onOpenChange, parameter }: ParameterDialogProps) => {
  const { updateParameter, isUpdating } = useSystemParameters();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parameter) return;
    
    const formData = new FormData(e.currentTarget);
    const newValue = formData.get('value') as string;
    
    await updateParameter({ code: parameter.code, value: newValue });
    onOpenChange(false);
  };

  const renderInput = () => {
    if (!parameter) return null;

    switch (parameter.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch 
              id="value-switch"
              defaultChecked={parameter.value === 'true'}
              onCheckedChange={(checked) => {
                const input = document.querySelector('input[name="value"]') as HTMLInputElement;
                if (input) input.value = String(checked);
              }}
            />
            <input type="hidden" name="value" defaultValue={parameter.value} />
          </div>
        );
      case 'select':
        return (
          <Select name="value" defaultValue={parameter.value}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {parameter.options?.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input 
            id="value" 
            name="value" 
            type={parameter.sensitive ? 'password' : 'text'}
            defaultValue={parameter.sensitive ? '' : parameter.value}
            required={parameter.required}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Editar Parâmetro</DialogTitle></DialogHeader>
        {parameter && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase font-bold">Parâmetro</Label>
              <p className="font-bold">{parameter.name}</p>
              <p className="text-sm text-muted-foreground">{parameter.description}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              {renderInput()}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
