// WMS Types

export type ReceivingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type StorageType = 'rack' | 'floor' | 'shelf' | 'cold' | 'hazardous';
export type PickingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type PackingStatus = 'pending' | 'packing' | 'packed' | 'shipped';
export type InventoryStatus = 'available' | 'reserved' | 'damaged' | 'expired' | 'quarantine';
export type MovementType = 'inbound' | 'outbound' | 'transfer' | 'adjustment';

export interface ReceivingOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  expectedDate: string;
  receivedDate?: string;
  status: ReceivingStatus;
  items: ReceivingItem[];
  dock: string;
  operator?: string;
  notes?: string;
  createdAt: string;
}

export interface ReceivingItem {
  id: string;
  productCode: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  unit: string;
  batch?: string;
  expirationDate?: string;
}

export interface StorageLocation {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  position: string;
  type: StorageType;
  capacity: number;
  occupied: number;
  active: boolean;
  products: StoredProduct[];
}

export interface StoredProduct {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  batch?: string;
  expirationDate?: string;
  storedAt: string;
}

export interface PickingOrder {
  id: string;
  orderNumber: string;
  salesOrderId: string;
  customerName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: PickingStatus;
  items: PickingItem[];
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PickingItem {
  id: string;
  productCode: string;
  productName: string;
  location: string;
  requestedQty: number;
  pickedQty: number;
  unit: string;
  picked: boolean;
}

export interface PackingOrder {
  id: string;
  pickingOrderId: string;
  orderNumber: string;
  customerName: string;
  status: PackingStatus;
  packages: Package[];
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  shippedAt?: string;
  carrier?: string;
  trackingNumber?: string;
  createdAt: string;
}

export interface Package {
  id: string;
  packageNumber: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  items: PackageItem[];
}

export interface PackageItem {
  productCode: string;
  productName: string;
  quantity: number;
}

export interface InventoryItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  location: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  minStock: number;
  maxStock: number;
  unit: string;
  batch?: string;
  expirationDate?: string;
  status: InventoryStatus;
  lastMovement: string;
  value: number;
}

export interface InventoryMovement {
  id: string;
  productCode: string;
  productName: string;
  type: MovementType;
  fromLocation?: string;
  toLocation?: string;
  quantity: number;
  reason: string;
  operator: string;
  createdAt: string;
}

export interface InventoryCount {
  id: string;
  countNumber: string;
  zone?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  itemsCount: number;
  discrepancies: number;
  operator?: string;
}

export interface WMSSummary {
  pendingReceiving: number;
  activePickings: number;
  pendingPacking: number;
  lowStockItems: number;
  occupancyRate: number;
  todayMovements: number;
}
