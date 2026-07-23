import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { ShieldCheck } from "lucide-react";
import { ApprovalRulesCard } from "@/modules/purchasing/approvals/ApprovalRulesCard";
import { PendingApprovalsCard } from "@/modules/purchasing/approvals/PendingApprovalsCard";
import { DecisionDialog } from "@/modules/purchasing/approvals/DecisionDialog";

export default function PurchaseApprovals() {
  const [decision, setDecision] = useState<null | { id: string; approve: boolean }>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Aprovação Hierárquica de Compras"
        description="Alçadas por valor e caixa de decisão dos aprovadores."
        icon={ShieldCheck}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ApprovalRulesCard />
        <PendingApprovalsCard onDecide={setDecision} />
      </div>

      <DecisionDialog decision={decision} onClose={() => setDecision(null)} />
    </PageContainer>
  );
}
