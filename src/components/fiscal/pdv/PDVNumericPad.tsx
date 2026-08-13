import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/base/button';
import { Delete, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onClear: () => void;
}

export function PDVNumericPad({ value, onChange, onCommit, onClear }: Props) {
  const addDigit = (digit: string) => {
    if (digit === ',' && value.includes(',')) return;
    onChange(value + digit);
  };

  const removeLast = () => {
    onChange(value.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', ','];

  return (
    <div className="grid grid-cols-3 gap-1.5 mt-4">
      {keys.map((key) => (
        <Button
          key={key}
          variant="outline"
          className="h-12 text-lg font-bold"
          onClick={() => addDigit(key)}
        >
          {key}
        </Button>
      ))}
      <Button variant="outline" className="h-12 text-destructive" onClick={onClear}>
        <X className="h-5 w-5" />
      </Button>
      <Button variant="outline" className="h-12" onClick={removeLast}>
        <Delete className="h-5 w-5" />
      </Button>
      <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={onCommit}>
        OK
      </Button>
    </div>
  );
}
