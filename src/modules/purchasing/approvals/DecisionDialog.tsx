import { useState } from "react";
import { Button } from "@/ui/base/button";
import { Textarea } from "@/ui/base/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/base/dialog";
import { useDecidePOApproval } from "@/hooks/purchasing/usePurchaseApprovals";

interface Props {
  decision: { id: string; approve: boolean } | null;
  onClose: () => void;
}

export function DecisionDialog({ decision, onClose }: Props) {
  const [comment, setComment] = useState("");
  const decide = useDecidePOApproval();

  return (
    <Dialog
      open={!!decision}
      onOpenChange={(o) => {
        if (!o) {
          setComment("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {decision?.approve ? "Aprovar solicitação" : "Rejeitar solicitação"}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Comentário (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant={decision?.approve ? "default" : "destructive"}
            onClick={async () => {
              if (!decision) return;
              await decide.mutateAsync({
                approvalId: decision.id,
                approve: decision.approve,
                comment,
              });
              setComment("");
              onClose();
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
