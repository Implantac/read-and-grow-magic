import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { MapPin, Eraser, CheckCircle2, Loader2 } from 'lucide-react';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';

type Status = 'delivered' | 'refused' | 'partial';

/**
 * Mobile-first Proof of Delivery capture for drivers.
 * Captures GPS, receiver, signature (canvas) and status per stop/route.
 */
const PODCapturePage = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  const [receivedBy, setReceivedBy] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<Status>('delivered');
  const [refusalReason, setRefusalReason] = useState('');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada neste dispositivo');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  };
  const onUp = () => { drawing.current = false; };

  const clearSig = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
  };

  const submit = async () => {
    if (!receivedBy.trim() && status === 'delivered') {
      handleMutationError(new Error('Informe quem recebeu a entrega'));
      return;
    }
    setSubmitting(true);
    try {
      const signature_url = hasInk.current ? canvasRef.current!.toDataURL('image/png') : null;
      const { error } = await supabase.from('delivery_proof').insert({
        route_id: routeId ?? null,
        order_number: orderNumber || null,
        customer_name: customerName || null,
        received_by: receivedBy || null,
        delivered_at: new Date().toISOString(),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        status,
        refusal_reason: status === 'refused' ? refusalReason : null,
        notes: notes || null,
        signature_url,
      });
      if (error) throw error;
      toastSuccess('Comprovante registrado');
      navigate('/tms/comprovantes');
    } catch (e) {
      handleMutationError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Comprovante de Entrega" description="Registro mobile com GPS e assinatura" />

      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coords ? (
              <Badge variant="secondary" className="font-mono text-xs">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </Badge>
            ) : geoError ? (
              <p className="text-xs text-destructive">{geoError}</p>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Obtendo GPS...
              </span>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="refused">Recusada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Nº Pedido</Label>
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="opcional" />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="opcional" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Recebido por</Label>
          <Input
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Nome de quem recebeu"
          />
        </div>

        {status === 'refused' && (
          <div className="space-y-2">
            <Label>Motivo da recusa</Label>
            <Textarea value={refusalReason} onChange={(e) => setRefusalReason(e.target.value)} rows={2} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Assinatura</Label>
            <Button type="button" variant="ghost" size="sm" onClick={clearSig}>
              <Eraser className="h-3 w-3 mr-1" /> Limpar
            </Button>
          </div>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-40 border rounded-md bg-background touch-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          />
        </div>

        <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Confirmar entrega
        </Button>
      </div>
    </PageContainer>
  );
};

export default PODCapturePage;
