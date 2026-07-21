import type { DbProduct, ProductNature } from '@/hooks/inventory/useProducts';
import { normalizeNcm, type ItemKind } from '@/lib/validators/product';

export const emptyForm = {
  code: '', barcode: '', gtin: '', name: '', description: '',
  type: 'finished', category_id: '', unit: 'UN',
  cost_price: '', sale_price: '', status: 'active',
  product_nature: 'commerce' as ProductNature,
  item_kind: 'revenda' as ItemKind,
  min_stock: '0', max_stock: '0', reorder_point: '0', lead_time_days: '0',
  location: '', supplier: '',
  weight: '', width: '', height: '', depth: '',
  ncm: '', cest: '', cfop_default: '', origin: '0',
  icms_cst: '', ipi_cst: '', pis_cst: '', cofins_cst: '',
  standard_batch_size: '', technical_sheet_url: '',
  brand: '', model: '', warranty_months: '',
  service_code_lc116: '', iss_rate: '', service_duration_minutes: '', is_recurring: false,
  requires_lot_tracking: false,
  shelf_life_days: '', storage_conditions: '',
  multi_ean: [] as string[],
  new_ean: '',
};

export type ProductForm = typeof emptyForm;
export type Update = (patch: Partial<ProductForm>) => void;

export function productToForm(product: DbProduct): ProductForm {
  return {
    ...emptyForm,
    code: product.code ?? '', barcode: product.barcode ?? '', gtin: product.gtin ?? '',
    name: product.name ?? '', description: product.description ?? '',
    type: product.type ?? 'finished', category_id: product.category_id ?? '',
    unit: product.unit ?? 'UN',
    cost_price: String(product.cost_price ?? ''), sale_price: String(product.sale_price ?? ''),
    status: product.status ?? 'active',
    product_nature: (product.product_nature as ProductNature) ?? 'commerce',
    item_kind: (((product as any).item_kind as ItemKind) ?? 'revenda'),
    min_stock: String(product.min_stock ?? 0), max_stock: String(product.max_stock ?? 0),
    reorder_point: String(product.reorder_point ?? 0), lead_time_days: String(product.lead_time_days ?? 0),
    location: product.location ?? '', supplier: product.supplier ?? '',
    weight: product.weight != null ? String(product.weight) : '',
    width: product.width != null ? String(product.width) : '',
    height: product.height != null ? String(product.height) : '',
    depth: product.depth != null ? String(product.depth) : '',
    ncm: product.ncm ?? '', cest: product.cest ?? '',
    cfop_default: product.cfop_default ?? '', origin: product.origin ?? '0',
    icms_cst: product.icms_cst ?? '', ipi_cst: product.ipi_cst ?? '',
    pis_cst: product.pis_cst ?? '', cofins_cst: product.cofins_cst ?? '',
    standard_batch_size: product.standard_batch_size != null ? String(product.standard_batch_size) : '',
    technical_sheet_url: product.technical_sheet_url ?? '',
    brand: product.brand ?? '', model: product.model ?? '',
    warranty_months: product.warranty_months != null ? String(product.warranty_months) : '',
    service_code_lc116: product.service_code_lc116 ?? '',
    iss_rate: product.iss_rate != null ? String(product.iss_rate) : '',
    service_duration_minutes: product.service_duration_minutes != null ? String(product.service_duration_minutes) : '',
    is_recurring: !!product.is_recurring,
    requires_lot_tracking: !!(product as any).requires_lot_tracking,
    shelf_life_days: (product as any).shelf_life_days != null ? String((product as any).shelf_life_days) : '',
    storage_conditions: (product as any).storage_conditions ?? '',
    multi_ean: Array.isArray((product as any).multi_ean) ? (product as any).multi_ean : [],
    new_ean: '',
  };
}

export function buildPayload(form: ProductForm): Partial<DbProduct> {
  const num = (v: string) => (v === '' ? null : Number(v));
  const isService = form.product_nature === 'service';
  const isIndustry = form.product_nature === 'industry';
  const isCommerce = form.product_nature === 'commerce';

  const base: Partial<DbProduct> = {
    code: form.code, barcode: form.barcode || null, gtin: form.gtin || null,
    name: form.name, description: form.description || null,
    type: form.type, category_id: form.category_id || null, unit: form.unit,
    cost_price: Number(form.cost_price) || 0, sale_price: Number(form.sale_price) || 0,
    status: form.status, product_nature: form.product_nature,
    item_kind: form.item_kind,
    ncm: form.ncm ? normalizeNcm(form.ncm) : null, cest: form.cest || null,
    cfop_default: form.cfop_default || null, origin: form.origin || null,
    icms_cst: form.icms_cst || null, ipi_cst: form.ipi_cst || null,
    pis_cst: form.pis_cst || null, cofins_cst: form.cofins_cst || null,
    requires_lot_tracking: form.requires_lot_tracking,
    shelf_life_days: form.shelf_life_days ? Number(form.shelf_life_days) : null,
    storage_conditions: form.storage_conditions || null,
    multi_ean: isCommerce ? form.multi_ean : [],
  } as any;

  if (isService) {
    return {
      ...base,
      min_stock: 0, max_stock: 0, reorder_point: 0, lead_time_days: 0,
      location: null, supplier: null,
      weight: null, width: null, height: null, depth: null,
      service_code_lc116: form.service_code_lc116 || null,
      iss_rate: num(form.iss_rate),
      service_duration_minutes: form.service_duration_minutes ? Number(form.service_duration_minutes) : null,
      is_recurring: form.is_recurring,
      standard_batch_size: null, technical_sheet_url: null,
      brand: null, model: null, warranty_months: null,
    };
  }

  const stockAndDims = {
    min_stock: Number(form.min_stock) || 0, max_stock: Number(form.max_stock) || 0,
    reorder_point: Number(form.reorder_point) || 0,
    lead_time_days: Number(form.lead_time_days) || 0,
    location: form.location || null, supplier: form.supplier || null,
    weight: num(form.weight), width: num(form.width),
    height: num(form.height), depth: num(form.depth),
  };

  if (isIndustry) {
    return {
      ...base, ...stockAndDims,
      standard_batch_size: num(form.standard_batch_size),
      technical_sheet_url: form.technical_sheet_url || null,
      brand: null, model: null, warranty_months: null,
      service_code_lc116: null, iss_rate: null, service_duration_minutes: null, is_recurring: false,
    };
  }
  return {
    ...base, ...stockAndDims,
    brand: form.brand || null, model: form.model || null,
    warranty_months: form.warranty_months ? Number(form.warranty_months) : null,
    standard_batch_size: null, technical_sheet_url: null,
    service_code_lc116: null, iss_rate: null, service_duration_minutes: null, is_recurring: false,
  };
}
