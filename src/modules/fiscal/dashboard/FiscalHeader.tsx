import { Button } from "@/ui/base/button";
import { Download, Loader2, UploadCloud } from "lucide-react";
import { validateFile, MB } from "@/lib/fileValidation";
import { toastError } from "@/lib/toastHelpers";

interface FiscalHeaderProps {
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FiscalHeader({ isUploading, onFileUpload }: FiscalHeaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const v = validateFile(file, {
        mime: ['application/xml', 'text/xml'],
        extensions: ['xml'],
        maxBytes: 5 * MB,
      });
      if (!v.ok) {
        toastError(v.error!, undefined, 'Arquivo rejeitado');
        e.target.value = '';
        return;
      }
    }
    onFileUpload(e);
  };
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Motor Fiscal Enterprise</h1>
        <p className="text-muted-foreground">Compliance, apuração automática e gestão de documentos eletrônicos.</p>
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".xml,application/xml,text/xml"
            onChange={handleChange}
            disabled={isUploading}
          />
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Importar XML (NFe)
          </Button>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Gerar SPED
        </Button>
      </div>
    </div>
  );
}
