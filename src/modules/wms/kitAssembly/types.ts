export type Product = { id: string; code: string; name: string };

export type KitComponent = {
  id: string;
  component_product_id: string;
  quantity: number;
  product?: Product | null;
};

export type KitRow = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  parent_product_id: string;
  parent?: Product | null;
  components?: KitComponent[];
};

export type Assembly = {
  id: string;
  kit_id: string;
  quantity: number;
  status: string;
  created_at: string;
  kit?: { code: string; name: string } | null;
};

export type ComponentDraft = { product_id: string; quantity: number };
