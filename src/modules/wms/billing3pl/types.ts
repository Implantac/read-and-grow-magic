export interface Contract {
  id: string;
  client_name: string;
  status: string;
  storage_rate_per_pallet_day: number;
  inbound_rate_per_unit: number;
  outbound_rate_per_unit: number;
  picking_rate_per_line: number;
  packing_rate_per_order: number;
  minimum_monthly_fee: number;
  currency: string;
}

export interface Invoice {
  id: string;
  contract_id: string;
  period_start: string;
  period_end: string;
  storage_amount: number;
  inbound_amount: number;
  outbound_amount: number;
  picking_amount: number;
  packing_amount: number;
  minimum_adjustment: number;
  total_amount: number;
  status: string;
  generated_at: string;
}

export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export const today = () => new Date().toISOString().slice(0, 10);
export const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export const emptyContractForm: Partial<Contract> = {
  client_name: "",
  status: "active",
  storage_rate_per_pallet_day: 0,
  inbound_rate_per_unit: 0,
  outbound_rate_per_unit: 0,
  picking_rate_per_line: 0,
  packing_rate_per_order: 0,
  minimum_monthly_fee: 0,
  currency: "BRL",
};
