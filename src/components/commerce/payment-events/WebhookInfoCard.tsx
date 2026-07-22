import { Webhook } from "lucide-react";
import { Card, CardContent } from "@/ui/base/card";

export function WebhookInfoCard({ webhookUrl }: { webhookUrl: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-sm">Endpoint de webhook</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure esta URL no painel do seu PSP (Mercado Pago, Asaas, Efí, Stripe, Pagar.me):
        </p>
        <code className="block break-all rounded bg-muted p-2 text-xs">{webhookUrl}</code>
        <p className="text-xs text-muted-foreground">Headers exigidos:</p>
        <code className="block rounded bg-muted p-2 text-xs">
          X-Webhook-Secret: &lt;PSP_WEBHOOK_SECRET&gt;
          <br />
          X-Provider: mercadopago | asaas | efi | stripe | generic
        </code>
        <p className="text-[10px] text-muted-foreground">
          O segredo já foi gerado e está armazenado como variável do backend. Cole-o no painel do PSP.
        </p>
      </CardContent>
    </Card>
  );
}
