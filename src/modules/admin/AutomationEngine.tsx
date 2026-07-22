import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/ui/base/button";
import { Plus, Zap } from "lucide-react";
import {
  useAutomationRules,
  useAutomationMutations,
  type AutomationAction,
  type AutomationCondition,
  type AutomationRule,
} from "@/hooks/useAutomationEngine";
import { useWorkflowDefinitions } from "@/hooks/useWorkflowEngine";
import { EMPTY_FORM, type FormState } from "./automation-engine/constants";
import { RulesList } from "./automation-engine/RulesList";
import { RuleEditorDialog } from "./automation-engine/RuleEditorDialog";
import { RunsDialog } from "./automation-engine/RunsDialog";

export default function AutomationEngine() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const { data: workflowDefs = [] } = useWorkflowDefinitions();
  const { save, remove, toggle } = useAutomationMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [historyRuleId, setHistoryRuleId] = useState<string | null>(null);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (r: AutomationRule) => {
    setForm({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      trigger_event: r.trigger_event,
      is_active: r.is_active,
      conditions: (r.conditions as AutomationCondition[]) ?? [],
      actions: (r.actions as AutomationAction[]) ?? [],
    });
    setOpen(true);
  };

  const submit = async () => {
    await save.mutateAsync({
      id: form.id,
      name: form.name,
      description: form.description,
      trigger_event: form.trigger_event,
      conditions: form.conditions,
      actions: form.actions,
      is_active: form.is_active,
    });
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Automation Engine"
        description="Crie gatilhos e ações automáticas declarativas"
        icon={Zap}
      />
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nova Regra
        </Button>
      </div>

      <RulesList
        rules={rules}
        isLoading={isLoading}
        onEdit={openEdit}
        onHistory={setHistoryRuleId}
        onToggle={(id, is_active) => toggle.mutate({ id, is_active })}
        onRemove={(id) => remove.mutate(id)}
      />

      <RuleEditorDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        setForm={setForm}
        workflowDefs={workflowDefs}
        onSubmit={submit}
      />

      <RunsDialog ruleId={historyRuleId} onClose={() => setHistoryRuleId(null)} />
    </PageContainer>
  );
}
