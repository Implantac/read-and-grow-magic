// ERP Inventory Types

export type ProductStatus = 'active' | 'inactive' | 'discontinued';
export type ProductType = 'finished' | 'raw_material' | 'component' | 'packaging' | 'consumable';
export type MovementType = 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'production_in' | 'production_out' | 'return' | 'loss';
export type MovementDirection = 'in' | 'out';
export type StockLevelStatus = 'normal' | 'low' | 'critical' | 'excess';

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  type: ProductType;
  category: string;
  subcategory?: string;
  unit: string;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  costPrice: number;
  salePrice: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  supplier?: string;
  location?: string;
  status: ProductStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  productsCount: number;
  active: boolean;
}

export interface StockMovement {
  id: string;
  documentNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  type: MovementType;
  direction: MovementDirection;
  quantity: number;
  unitCost: number;
  totalCost: number;
  batch?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  reference?: string;
  notes?: string;
  operator: string;
  createdAt: string;
}

export interface KardexEntry {
  id: string;
  date: string;
  documentNumber: string;
  type: MovementType;
  description: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  unitCost: number;
  averageCost: number;
  totalValue: number;
}

export interface ProductKardex {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  currentBalance: number;
  currentAverageCost: number;
  currentTotalValue: number;
  entries: KardexEntry[];
}

export interface StockLevel {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  status: StockLevelStatus;
  daysOfStock: number;
  averageDailyConsumption: number;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  costPrice: number;
  totalValue: number;
}

export interface StockSummary {
  totalProducts: number;
  activeProducts: number;
  totalValue: number;
  lowStockItems: number;
  criticalStockItems: number;
  excessStockItems: number;
  movementsToday: number;
  categoriesCount: number;
}

export interface ProductFilters {
  search: string;
  type: ProductType | 'all';
  category: string;
  status: ProductStatus | 'all';
}

export interface MovementFilters {
  search: string;
  type: MovementType | 'all';
  direction: MovementDirection | 'all';
  dateFrom: string;
  dateTo: string;
}

export interface StockLevelFilters {
  search: string;
  category: string;
  status: StockLevelStatus | 'all';
}

export interface StatusConfig {
  value: string;
  label: string;
  color: string;
}
