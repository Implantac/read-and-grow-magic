import { Card, CardContent } from "@/ui/base/card";
import { AlertTriangle, Lightbulb, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/ui/base/button";
import { useStoreCentral } from "@/hooks/operational/store/useStoreCentral";
import { supabase } from "@/integrations/supabase/client";
import { toastSuccess, toastError } from "@/lib/toastHelpers";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PrescriptiveAlert() {
  const { alerts, refetch } = useStoreCentral();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const replenishmentAlerts = alerts?.filter(a => a.category === 'replenishment' && a.id) || [];

  const handleApprove = async (alertId: string, metadata: any) => {
    setIsProcessing(alertId);
    try {
      const recommendation = metadata?.recommendation;
      if (!recommendation) throw new Error("Dados da recomendação não encontrados.");

      // Criar a transferência sugerida
      const { data: transfer, error: transferError } = await (supabase as any)
        .from('stock_transfer_orders')
        .insert({
          company_id: recommendation.companyId || (await getCompanyId(recommendation.branchId)),
          origin_unit_id: recommendation.sourceBranchId,
          destination_unit_id: recommendation.branchId,
          current_status: 'SUGERIDA',
          correlation_id: crypto.randomUUID(),
          type: 'AUTOMATIC'
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Adicionar item
      await (supabase as any)
        .from('stock_transfer_items')
        .insert({
          transfer_id: transfer.id,
          product_id: recommendation.productId,
          requested_qty: recommendation.suggestedQty
        });

      // Fechar a tarefa
      await (supabase as any)
        .from('operational_tasks')
        .update({ status: 'completed' })
        .eq('id', alertId);

      toastSuccess("Ação aprovada", "Transferência de reabastecimento criada com sucesso.");
      refetch();
    } catch (error) {
      console.error(error);
      toastError(error, "Falha ao processar aprovação.");
    } finally {
      setIsProcessing(null);
    }
  };

  async function getCompanyId(branchId: string) {
    const { data } = await (supabase as any)
      .from('branches')
      .select('company_id')
      .eq('id', branchId)
      .single();
    return data?.company_id;
  }

  if (replenishmentAlerts.length === 0) return null;

  const alert = replenishmentAlerts[0]; // Mostra o mais prioritário
  // @ts-ignore
  const recommendation = alert.metadata?.recommendation;

  return (
    <Card className="border-l-4 border-l-destructive bg-destructive/5 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-destructive">{alert.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alert.description}
              </p>
            </div>
            
            <div className="bg-background/50 p-3 rounded border border-destructive/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Lightbulb className="h-3 w-3 text-amber-500" /> Recomendação ERP Prescritivo
              </div>
              <p className="text-[11px]">
                {recommendation?.reason || "Ação recomendada para evitar ruptura de estoque."}
              </p>
              <Button 
                size="sm" 
                disabled={!!isProcessing}
                onClick={() => handleApprove(alert.id, (alert as any).metadata)}
                className="w-full h-8 gap-2 bg-destructive hover:bg-destructive/90 text-white border-none"
              >
                {isProcessing === alert.id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Aprovar Ação
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
