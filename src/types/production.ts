// Production Order Status
export type ProductionOrderStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';

// Production Order Priority
export type ProductionPriority = 'low' | 'medium' | 'high' | 'urgent';

// Production Order
export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  producedQuantity: number;
  unit: string;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  workCenter: string;
  operator?: string;
  notes?: string;
  bomId: string;
  routeId: string;
  createdAt: string;
}

// Bill of Materials (BOM) Item
export interface BOMItem {
  id: string;
  componentCode: string;
  componentName: string;
  quantity: number;
  unit: string;
  wastePercentage: number;
  isOptional: boolean;
}

// Bill of Materials (BOM)
export interface BillOfMaterials {
  id: string;
  code: string;
  productCode: string;
  productName: string;
  version: string;
  isActive: boolean;
  items: BOMItem[];
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

// Route Operation
export interface RouteOperation {
  id: string;
  sequence: number;
  operationName: string;
  workCenter: string;
  setupTime: number; // minutes
  operationTime: number; // minutes per unit
  description?: string;
}

// Production Route
export interface ProductionRoute {
  id: string;
  code: string;
  productCode: string;
  productName: string;
  version: string;
  isActive: boolean;
  operations: RouteOperation[];
  totalTime: number; // minutes
  createdAt: string;
}

// Time Entry Status
export type TimeEntryStatus = 'started' | 'paused' | 'completed';

// Time Entry (Apontamento)
export interface TimeEntry {
  id: string;
  productionOrderId: string;
  orderNumber: string;
  operationId: string;
  operationName: string;
  operator: string;
  startTime: string;
  endTime?: string;
  pausedTime?: number; // minutes
  producedQuantity: number;
  rejectedQuantity: number;
  status: TimeEntryStatus;
  notes?: string;
  workCenter: string;
}

// Raw Material Consumption
export interface MaterialConsumption {
  id: string;
  productionOrderId: string;
  orderNumber: string;
  componentCode: string;
  componentName: string;
  expectedQuantity: number;
  consumedQuantity: number;
  unit: string;
  consumedAt: string;
  consumedBy: string;
  batch?: string;
  location?: string;
}

// Work Center
export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  capacity: number; // units per hour
  isActive: boolean;
  currentLoad: number; // percentage
}

// Production Summary
export interface ProductionSummary {
  totalOrders: number;
  plannedOrders: number;
  inProgressOrders: number;
  completedToday: number;
  efficiency: number;
  onTimeDelivery: number;
  totalProduced: number;
  totalRejected: number;
}
