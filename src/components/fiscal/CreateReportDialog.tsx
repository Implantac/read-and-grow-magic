import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/base/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { reportTypeLabels } from '@/config/fiscal';

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    type: string;
    name: string;
    period: string;
    startDate: string;
    endDate: string;
  }) => Promise<boolean>;
}

export function CreateReportDialog({ open, onOpenChange, onCreate }: CreateReportDialogProps) {
  const [type, setType] = useState('monthly_summary');
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!type || !name.trim() || !startDate || !endDate) return;
    setSaving(true);
    const result = await onCreate({ type, name, period: period || `${startDate} a ${endDate}`, startDate, endDate });
    setSaving(false);
    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setType('monthly_summary');
    setName('');
    setPeriod('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Relatório Fiscal</DialogTitle>
          <DialogDescription>Gere um relatório fiscal para o período selecionado</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo do Relatório</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              placeholder="Ex: SPED Fiscal - Março 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Período (rótulo)</Label>
            <Input
              placeholder="Ex: Março/2026"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !name.trim() || !startDate || !endDate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {saving ? 'Criando...' : 'Criar Relatório'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
