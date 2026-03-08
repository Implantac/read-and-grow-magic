
-- ============================================
-- ACCOUNTING MODULE
-- ============================================

-- Chart of Accounts
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'asset',
  nature TEXT NOT NULL DEFAULT 'debit',
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  level INTEGER NOT NULL DEFAULT 1,
  is_analytical BOOLEAN NOT NULL DEFAULT false,
  balance NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read chart_of_accounts" ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert chart_of_accounts" ON public.chart_of_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update chart_of_accounts" ON public.chart_of_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete chart_of_accounts" ON public.chart_of_accounts FOR DELETE TO authenticated USING (true);

-- Journal Entries
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read journal_entries" ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert journal_entries" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update journal_entries" ON public.journal_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete journal_entries" ON public.journal_entries FOR DELETE TO authenticated USING (true);

-- Journal Entry Lines
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  description TEXT
);
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read journal_entry_lines" ON public.journal_entry_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert journal_entry_lines" ON public.journal_entry_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update journal_entry_lines" ON public.journal_entry_lines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete journal_entry_lines" ON public.journal_entry_lines FOR DELETE TO authenticated USING (true);

-- ============================================
-- FISCAL MODULE
-- ============================================

-- NF-e
CREATE TABLE public.nfe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  series TEXT NOT NULL DEFAULT '1',
  access_key TEXT,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  operation_type TEXT NOT NULL DEFAULT 'saida',
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT NOT NULL,
  client_document TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  shipping NUMERIC NOT NULL DEFAULT 0,
  icms NUMERIC NOT NULL DEFAULT 0,
  ipi NUMERIC NOT NULL DEFAULT 0,
  pis NUMERIC NOT NULL DEFAULT 0,
  cofins NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  protocol TEXT,
  authorization_date TIMESTAMP WITH TIME ZONE,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.nfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read nfe" ON public.nfe FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert nfe" ON public.nfe FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update nfe" ON public.nfe FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete nfe" ON public.nfe FOR DELETE TO authenticated USING (true);

-- NF-e Items
CREATE TABLE public.nfe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nfe_id UUID NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  ncm TEXT,
  cfop TEXT,
  unit TEXT NOT NULL DEFAULT 'UN',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  icms_base NUMERIC NOT NULL DEFAULT 0,
  icms_rate NUMERIC NOT NULL DEFAULT 0,
  icms_value NUMERIC NOT NULL DEFAULT 0,
  ipi_rate NUMERIC NOT NULL DEFAULT 0,
  ipi_value NUMERIC NOT NULL DEFAULT 0,
  pis_rate NUMERIC NOT NULL DEFAULT 0,
  pis_value NUMERIC NOT NULL DEFAULT 0,
  cofins_rate NUMERIC NOT NULL DEFAULT 0,
  cofins_value NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.nfe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read nfe_items" ON public.nfe_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert nfe_items" ON public.nfe_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update nfe_items" ON public.nfe_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete nfe_items" ON public.nfe_items FOR DELETE TO authenticated USING (true);

-- NFC-e
CREATE TABLE public.nfce (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  series TEXT NOT NULL DEFAULT '1',
  access_key TEXT,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  customer_document TEXT,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  protocol TEXT,
  authorization_date TIMESTAMP WITH TIME ZONE,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  operator_id TEXT,
  operator_name TEXT,
  terminal_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.nfce ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read nfce" ON public.nfce FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert nfce" ON public.nfce FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update nfce" ON public.nfce FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete nfce" ON public.nfce FOR DELETE TO authenticated USING (true);

-- NFC-e Items
CREATE TABLE public.nfce_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nfce_id UUID NOT NULL REFERENCES public.nfce(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  ncm TEXT,
  cfop TEXT,
  unit TEXT NOT NULL DEFAULT 'UN',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.nfce_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read nfce_items" ON public.nfce_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert nfce_items" ON public.nfce_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update nfce_items" ON public.nfce_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete nfce_items" ON public.nfce_items FOR DELETE TO authenticated USING (true);

-- Fiscal Reports
CREATE TABLE public.fiscal_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_nfe INTEGER NOT NULL DEFAULT 0,
  total_nfce INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  total_icms NUMERIC NOT NULL DEFAULT 0,
  total_ipi NUMERIC NOT NULL DEFAULT 0,
  total_pis NUMERIC NOT NULL DEFAULT 0,
  total_cofins NUMERIC NOT NULL DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fiscal_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read fiscal_reports" ON public.fiscal_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert fiscal_reports" ON public.fiscal_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update fiscal_reports" ON public.fiscal_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete fiscal_reports" ON public.fiscal_reports FOR DELETE TO authenticated USING (true);

-- ============================================
-- PRODUCTION MODULE
-- ============================================

-- Work Centers
CREATE TABLE public.work_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_load NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read work_centers" ON public.work_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert work_centers" ON public.work_centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update work_centers" ON public.work_centers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete work_centers" ON public.work_centers FOR DELETE TO authenticated USING (true);

-- Production Orders
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  produced_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  work_center TEXT,
  operator TEXT,
  notes TEXT,
  bom_id TEXT,
  route_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read production_orders" ON public.production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert production_orders" ON public.production_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update production_orders" ON public.production_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete production_orders" ON public.production_orders FOR DELETE TO authenticated USING (true);

-- Time Entries
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  operation_id TEXT,
  operation_name TEXT NOT NULL,
  operator TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  paused_time INTEGER NOT NULL DEFAULT 0,
  produced_quantity NUMERIC NOT NULL DEFAULT 0,
  rejected_quantity NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'started',
  work_center TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read time_entries" ON public.time_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert time_entries" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update time_entries" ON public.time_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete time_entries" ON public.time_entries FOR DELETE TO authenticated USING (true);

-- Material Consumptions
CREATE TABLE public.material_consumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  component_code TEXT NOT NULL,
  component_name TEXT NOT NULL,
  expected_quantity NUMERIC NOT NULL DEFAULT 0,
  consumed_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  consumed_at TIMESTAMP WITH TIME ZONE,
  consumed_by TEXT,
  batch TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.material_consumptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read material_consumptions" ON public.material_consumptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert material_consumptions" ON public.material_consumptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update material_consumptions" ON public.material_consumptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete material_consumptions" ON public.material_consumptions FOR DELETE TO authenticated USING (true);

-- ============================================
-- PURCHASING MODULE
-- ============================================

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'cnpj',
  email TEXT,
  phone TEXT,
  cellphone TEXT,
  address_street TEXT NOT NULL DEFAULT '',
  address_number TEXT NOT NULL DEFAULT '',
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL DEFAULT '',
  address_city TEXT NOT NULL DEFAULT '',
  address_state TEXT NOT NULL DEFAULT '',
  address_zip_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT,
  payment_terms TEXT,
  delivery_time INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_delivery TIMESTAMP WITH TIME ZONE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  shipping NUMERIC NOT NULL DEFAULT 0,
  taxes NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_terms TEXT,
  payment_condition TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'medium',
  buyer_id TEXT,
  buyer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert purchase_orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update purchase_orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete purchase_orders" ON public.purchase_orders FOR DELETE TO authenticated USING (true);

-- Purchase Order Items
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  received_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN'
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read purchase_order_items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert purchase_order_items" ON public.purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update purchase_order_items" ON public.purchase_order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete purchase_order_items" ON public.purchase_order_items FOR DELETE TO authenticated USING (true);

-- ============================================
-- WMS MODULE
-- ============================================

-- WMS Receiving Orders
CREATE TABLE public.wms_receiving_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  supplier TEXT NOT NULL,
  expected_date TIMESTAMP WITH TIME ZONE,
  received_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  dock TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_receiving_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_receiving_orders" ON public.wms_receiving_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_receiving_orders" ON public.wms_receiving_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_receiving_orders" ON public.wms_receiving_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_receiving_orders" ON public.wms_receiving_orders FOR DELETE TO authenticated USING (true);

-- WMS Receiving Items
CREATE TABLE public.wms_receiving_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receiving_order_id UUID NOT NULL REFERENCES public.wms_receiving_orders(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  expected_qty NUMERIC NOT NULL DEFAULT 0,
  received_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  batch TEXT,
  expiration_date DATE
);
ALTER TABLE public.wms_receiving_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_receiving_items" ON public.wms_receiving_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_receiving_items" ON public.wms_receiving_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_receiving_items" ON public.wms_receiving_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_receiving_items" ON public.wms_receiving_items FOR DELETE TO authenticated USING (true);

-- WMS Storage Locations
CREATE TABLE public.wms_storage_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  aisle TEXT NOT NULL,
  rack TEXT NOT NULL,
  level TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT '01',
  type TEXT NOT NULL DEFAULT 'rack',
  capacity INTEGER NOT NULL DEFAULT 100,
  occupied INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_storage_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_storage_locations" ON public.wms_storage_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_storage_locations" ON public.wms_storage_locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_storage_locations" ON public.wms_storage_locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_storage_locations" ON public.wms_storage_locations FOR DELETE TO authenticated USING (true);

-- WMS Picking Orders
CREATE TABLE public.wms_picking_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  sales_order_id TEXT,
  customer_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_picking_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_picking_orders" ON public.wms_picking_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_picking_orders" ON public.wms_picking_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_picking_orders" ON public.wms_picking_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_picking_orders" ON public.wms_picking_orders FOR DELETE TO authenticated USING (true);

-- WMS Picking Items
CREATE TABLE public.wms_picking_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  picking_order_id UUID NOT NULL REFERENCES public.wms_picking_orders(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  location TEXT NOT NULL,
  requested_qty NUMERIC NOT NULL DEFAULT 0,
  picked_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  picked BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.wms_picking_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_picking_items" ON public.wms_picking_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_picking_items" ON public.wms_picking_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_picking_items" ON public.wms_picking_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_picking_items" ON public.wms_picking_items FOR DELETE TO authenticated USING (true);

-- WMS Packing Orders
CREATE TABLE public.wms_packing_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  picking_order_id UUID REFERENCES public.wms_picking_orders(id),
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  operator TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  carrier TEXT,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_packing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_packing_orders" ON public.wms_packing_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_packing_orders" ON public.wms_packing_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_packing_orders" ON public.wms_packing_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_packing_orders" ON public.wms_packing_orders FOR DELETE TO authenticated USING (true);

-- WMS Inventory Items
CREATE TABLE public.wms_inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  reserved_qty NUMERIC NOT NULL DEFAULT 0,
  available_qty NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  max_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  batch TEXT,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'available',
  last_movement TIMESTAMP WITH TIME ZONE,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_inventory_items" ON public.wms_inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_inventory_items" ON public.wms_inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_inventory_items" ON public.wms_inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_inventory_items" ON public.wms_inventory_items FOR DELETE TO authenticated USING (true);

-- WMS Inventory Movements
CREATE TABLE public.wms_inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'inbound',
  from_location TEXT,
  to_location TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_inventory_movements" ON public.wms_inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_inventory_movements" ON public.wms_inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_inventory_movements" ON public.wms_inventory_movements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_inventory_movements" ON public.wms_inventory_movements FOR DELETE TO authenticated USING (true);

-- WMS Inventory Counts
CREATE TABLE public.wms_inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count_number TEXT NOT NULL,
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  items_count INTEGER NOT NULL DEFAULT 0,
  discrepancies INTEGER NOT NULL DEFAULT 0,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_inventory_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read wms_inventory_counts" ON public.wms_inventory_counts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_inventory_counts" ON public.wms_inventory_counts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_inventory_counts" ON public.wms_inventory_counts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete wms_inventory_counts" ON public.wms_inventory_counts FOR DELETE TO authenticated USING (true);

-- ============================================
-- ADMIN MODULE
-- ============================================

-- Companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT NOT NULL,
  state_registration TEXT,
  municipal_registration TEXT,
  email TEXT,
  phone TEXT,
  address_street TEXT NOT NULL DEFAULT '',
  address_number TEXT NOT NULL DEFAULT '',
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL DEFAULT '',
  address_city TEXT NOT NULL DEFAULT '',
  address_state TEXT NOT NULL DEFAULT '',
  address_zip_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  parent_company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update companies" ON public.companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete companies" ON public.companies FOR DELETE TO authenticated USING (true);

-- System Parameters
CREATE TABLE public.system_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  type TEXT NOT NULL DEFAULT 'text',
  value TEXT,
  default_value TEXT,
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  sensitive BOOLEAN NOT NULL DEFAULT false,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read system_parameters" ON public.system_parameters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert system_parameters" ON public.system_parameters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update system_parameters" ON public.system_parameters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete system_parameters" ON public.system_parameters FOR DELETE TO authenticated USING (true);
