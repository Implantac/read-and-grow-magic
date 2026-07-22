import { Receipt } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { DiagnosticSheet } from './DiagnosticSheet';

interface Props {
  allIssues: any;
  validationByStep: any;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  diagnosisFilter: 'all' | 'errors' | 'warnings';
  setDiagnosisFilter: (v: 'all' | 'errors' | 'warnings') => void;
  diagnosisSearch: string;
  hasFilteredErrors: boolean;
  hasFilteredWarnings: boolean;
  nothingFoundInView: boolean;
  onStepClick: (s: number) => void;
}

export function CreateNFeHeader(props: Props) {
  return (
    <DialogHeader className="px-6 py-4 border-b bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            Emissão de NF-e Profissional
          </DialogTitle>
          <DialogDescription>Fluxo automatizado com cálculo de impostos em tempo real</DialogDescription>
        </div>
        <div className="flex items-center gap-3">
          <DiagnosticSheet {...props} />
          <Badge variant="outline" className="bg-background">Série: 001</Badge>
          <Badge variant="outline" className="bg-background">Ambiente: Homologação</Badge>
        </div>
      </div>
    </DialogHeader>
  );
}
