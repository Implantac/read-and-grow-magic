import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, exportToExcel, type ExportColumn } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps<T>) {
  const { toast } = useToast();

  const handleExport = (format: 'csv' | 'excel') => {
    if (data.length === 0) {
      toastError('Não há dados para exportar.', undefined, 'Sem dados');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}`;

    if (format === 'csv') {
      exportToCSV(data, columns, fullFilename);
    } else {
      exportToExcel(data, columns, fullFilename);
    }

    toastSuccess('Exportação concluída', `${data.length} registros exportados em formato ${format === 'csv' ? 'CSV' : 'Excel'}.`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
