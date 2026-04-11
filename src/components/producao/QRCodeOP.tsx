import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface QRCodeOPProps {
  orderNumber: string;
  orderId: string;
  productName?: string;
  batchCode?: string;
}

export function QRCodeOPButton({ orderNumber, orderId, productName, batchCode }: QRCodeOPProps) {
  const qrValue = JSON.stringify({
    type: 'production_order',
    id: orderId,
    number: orderNumber,
    batch: batchCode || '',
  });

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${orderId}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.download = `QR-${orderNumber}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-1" /> QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code — {orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <QRCodeSVG id={`qr-${orderId}`} value={qrValue} size={200} level="M" />
              <p className="text-sm font-semibold">{orderNumber}</p>
              {productName && <p className="text-xs text-muted-foreground">{productName}</p>}
              {batchCode && <p className="text-xs text-muted-foreground">Lote: {batchCode}</p>}
            </CardContent>
          </Card>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Baixar PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
