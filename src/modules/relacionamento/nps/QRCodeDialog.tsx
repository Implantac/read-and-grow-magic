import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Copy, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title?: string;
  subtitle?: string;
}

/**
 * QR Code para impressão em balcão, embalagem, NF ou papelaria.
 * Permite copiar link, imprimir e baixar SVG.
 */
export function QRCodeDialog({ open, onOpenChange, url, title = 'Responda nossa pesquisa', subtitle }: Props) {
  const copyLink = () => { navigator.clipboard.writeText(url); toast.success('Link copiado'); };
  const download = () => {
    const svg = document.getElementById('nps-qr-svg')?.outerHTML;
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nps-qrcode.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const print = () => {
    const svg = document.getElementById('nps-qr-svg')?.outerHTML ?? '';
    const win = window.open('', '_blank', 'width=600,height=800');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;text-align:center;padding:40px;color:#0F172A}
      h1{margin:0 0 8px;font-size:24px}p{margin:0 0 24px;color:#64748B}
      .qr{display:inline-block;padding:16px;background:#fff;border-radius:12px;border:1px solid #E2E8F0}
      .url{margin-top:16px;font-size:12px;color:#94A3B8;word-break:break-all}
      </style></head><body>
      <h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}
      <div class="qr">${svg}</div>
      <div class="url">${url}</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>QR Code da pesquisa</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG id="nps-qr-svg" value={url} size={220} level="M" includeMargin />
          </div>
          <p className="text-xs text-muted-foreground text-center break-all">{url}</p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}><Copy className="mr-1 h-3.5 w-3.5" />Copiar</Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={download}><Download className="mr-1 h-3.5 w-3.5" />SVG</Button>
            <Button size="sm" className="flex-1" onClick={print}><Printer className="mr-1 h-3.5 w-3.5" />Imprimir</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
