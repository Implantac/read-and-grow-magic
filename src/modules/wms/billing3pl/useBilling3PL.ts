import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/ui/base/use-toast";
import { Contract, Invoice, emptyContractForm, firstOfMonth, today } from "./types";

export function useBilling3PL() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openContract, setOpenContract] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [period, setPeriod] = useState({ start: firstOfMonth(), end: today() });
  const [form, setForm] = useState<Partial<Contract>>(emptyContractForm);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, i] = await Promise.all([
      supabase.from("wms_3pl_contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("wms_3pl_invoices").select("*").order("generated_at", { ascending: false }).limit(50),
    ]);
    if (c.error) toast({ title: "Erro ao carregar contratos", description: c.error.message, variant: "destructive" });
    if (i.error) toast({ title: "Erro ao carregar faturas", description: i.error.message, variant: "destructive" });
    setContracts((c.data || []) as Contract[]);
    setInvoices((i.data || []) as Invoice[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveContract = async () => {
    if (!form.client_name) {
      toast({ title: "Informe o cliente", variant: "destructive" });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", u.user.id)
      .maybeSingle();
    if (!profile?.company_id) {
      toast({ title: "Empresa não encontrada", variant: "destructive" });
      return;
    }
    const payload = { ...form, company_id: profile.company_id };
    const { error } = await supabase.from("wms_3pl_contracts").insert(payload as never);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contrato criado" });
    setOpenContract(false);
    setForm(emptyContractForm);
    void load();
  };

  const generateInvoice = async () => {
    if (!selected) return;
    const { error } = await supabase.rpc("wms_generate_3pl_invoice", {
      p_contract_id: selected.id,
      p_period_start: period.start,
      p_period_end: period.end,
    });
    if (error) {
      toast({ title: "Erro ao gerar fatura", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fatura gerada com sucesso" });
    setOpenInvoice(false);
    void load();
  };

  const totalMTD = invoices
    .filter((i) => i.period_end >= firstOfMonth())
    .reduce((s, i) => s + Number(i.total_amount || 0), 0);

  return {
    contracts, invoices, loading,
    openContract, setOpenContract,
    openInvoice, setOpenInvoice,
    selected, setSelected,
    period, setPeriod,
    form, setForm,
    load, saveContract, generateInvoice, totalMTD,
  };
}
