import {
  ReceivingOrder,
  StorageLocation,
  PickingOrder,
  PackingOrder,
  InventoryItem,
  InventoryMovement,
  InventoryCount,
  WMSSummary
} from '@/types/wms';

export const receivingOrders: ReceivingOrder[] = [
  {
    id: '1',
    orderNumber: 'REC-2024-001',
    supplier: 'Fornecedor ABC Ltda',
    expectedDate: '2024-01-15',
    receivedDate: '2024-01-15',
    status: 'completed',
    dock: 'Doca 01',
    operator: 'Carlos Silva',
    items: [
      { id: '1', productCode: 'PROD-001', productName: 'Produto A', expectedQty: 100, receivedQty: 100, unit: 'UN', batch: 'LOT-001', expirationDate: '2025-01-15' },
      { id: '2', productCode: 'PROD-002', productName: 'Produto B', expectedQty: 50, receivedQty: 48, unit: 'UN', batch: 'LOT-002' }
    ],
    createdAt: '2024-01-14T10:00:00Z'
  },
  {
    id: '2',
    orderNumber: 'REC-2024-002',
    supplier: 'Distribuidora XYZ',
    expectedDate: '2024-01-16',
    status: 'in_progress',
    dock: 'Doca 02',
    operator: 'Maria Santos',
    items: [
      { id: '3', productCode: 'PROD-003', productName: 'Produto C', expectedQty: 200, receivedQty: 150, unit: 'CX' },
      { id: '4', productCode: 'PROD-004', productName: 'Produto D', expectedQty: 75, receivedQty: 0, unit: 'UN' }
    ],
    createdAt: '2024-01-15T14:00:00Z'
  },
  {
    id: '3',
    orderNumber: 'REC-2024-003',
    supplier: 'Indústria Beta',
    expectedDate: '2024-01-17',
    status: 'pending',
    dock: 'Doca 01',
    items: [
      { id: '5', productCode: 'PROD-005', productName: 'Produto E', expectedQty: 300, receivedQty: 0, unit: 'UN' }
    ],
    createdAt: '2024-01-16T09:00:00Z'
  },
  {
    id: '4',
    orderNumber: 'REC-2024-004',
    supplier: 'Atacado Central',
    expectedDate: '2024-01-18',
    status: 'pending',
    dock: 'Doca 03',
    items: [
      { id: '6', productCode: 'PROD-006', productName: 'Produto F', expectedQty: 150, receivedQty: 0, unit: 'KG' },
      { id: '7', productCode: 'PROD-007', productName: 'Produto G', expectedQty: 80, receivedQty: 0, unit: 'UN' }
    ],
    createdAt: '2024-01-16T11:00:00Z'
  }
];

export const storageLocations: StorageLocation[] = [
  {
    id: '1',
    code: 'A-01-01-01',
    zone: 'A',
    aisle: '01',
    rack: '01',
    level: '01',
    position: '01',
    type: 'rack',
    capacity: 100,
    occupied: 75,
    active: true,
    products: [
      { id: '1', productCode: 'PROD-001', productName: 'Produto A', quantity: 50, batch: 'LOT-001', storedAt: '2024-01-15T10:00:00Z' },
      { id: '2', productCode: 'PROD-002', productName: 'Produto B', quantity: 25, storedAt: '2024-01-15T11:00:00Z' }
    ]
  },
  {
    id: '2',
    code: 'A-01-02-01',
    zone: 'A',
    aisle: '01',
    rack: '02',
    level: '01',
    position: '01',
    type: 'rack',
    capacity: 100,
    occupied: 100,
    active: true,
    products: [
      { id: '3', productCode: 'PROD-003', productName: 'Produto C', quantity: 100, storedAt: '2024-01-14T09:00:00Z' }
    ]
  },
  {
    id: '3',
    code: 'B-01-01-01',
    zone: 'B',
    aisle: '01',
    rack: '01',
    level: '01',
    position: '01',
    type: 'shelf',
    capacity: 50,
    occupied: 30,
    active: true,
    products: [
      { id: '4', productCode: 'PROD-004', productName: 'Produto D', quantity: 30, storedAt: '2024-01-13T14:00:00Z' }
    ]
  },
  {
    id: '4',
    code: 'C-01-01-01',
    zone: 'C',
    aisle: '01',
    rack: '01',
    level: '01',
    position: '01',
    type: 'cold',
    capacity: 200,
    occupied: 0,
    active: true,
    products: []
  },
  {
    id: '5',
    code: 'D-01-01-01',
    zone: 'D',
    aisle: '01',
    rack: '01',
    level: '01',
    position: '01',
    type: 'floor',
    capacity: 500,
    occupied: 200,
    active: true,
    products: [
      { id: '5', productCode: 'PROD-005', productName: 'Produto E', quantity: 200, storedAt: '2024-01-12T08:00:00Z' }
    ]
  }
];

export const pickingOrders: PickingOrder[] = [
  {
    id: '1',
    orderNumber: 'PICK-2024-001',
    salesOrderId: 'PED-2024-001',
    customerName: 'Cliente Premium Ltda',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'João Oliveira',
    startedAt: '2024-01-16T08:00:00Z',
    items: [
      { id: '1', productCode: 'PROD-001', productName: 'Produto A', location: 'A-01-01-01', requestedQty: 10, pickedQty: 10, unit: 'UN', picked: true },
      { id: '2', productCode: 'PROD-002', productName: 'Produto B', location: 'A-01-01-01', requestedQty: 5, pickedQty: 0, unit: 'UN', picked: false }
    ],
    createdAt: '2024-01-16T07:30:00Z'
  },
  {
    id: '2',
    orderNumber: 'PICK-2024-002',
    salesOrderId: 'PED-2024-002',
    customerName: 'Loja Central',
    priority: 'urgent',
    status: 'pending',
    items: [
      { id: '3', productCode: 'PROD-003', productName: 'Produto C', location: 'A-01-02-01', requestedQty: 20, pickedQty: 0, unit: 'CX', picked: false }
    ],
    createdAt: '2024-01-16T09:00:00Z'
  },
  {
    id: '3',
    orderNumber: 'PICK-2024-003',
    salesOrderId: 'PED-2024-003',
    customerName: 'Distribuidora Norte',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'Ana Costa',
    startedAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T11:30:00Z',
    items: [
      { id: '4', productCode: 'PROD-004', productName: 'Produto D', location: 'B-01-01-01', requestedQty: 15, pickedQty: 15, unit: 'UN', picked: true }
    ],
    createdAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '4',
    orderNumber: 'PICK-2024-004',
    salesOrderId: 'PED-2024-004',
    customerName: 'Mercado Express',
    priority: 'low',
    status: 'assigned',
    assignedTo: 'Pedro Lima',
    items: [
      { id: '5', productCode: 'PROD-005', productName: 'Produto E', location: 'D-01-01-01', requestedQty: 50, pickedQty: 0, unit: 'UN', picked: false },
      { id: '6', productCode: 'PROD-001', productName: 'Produto A', location: 'A-01-01-01', requestedQty: 25, pickedQty: 0, unit: 'UN', picked: false }
    ],
    createdAt: '2024-01-16T10:00:00Z'
  }
];

export const packingOrders: PackingOrder[] = [
  {
    id: '1',
    pickingOrderId: '3',
    orderNumber: 'PACK-2024-001',
    customerName: 'Distribuidora Norte',
    status: 'shipped',
    operator: 'Fernanda Alves',
    startedAt: '2024-01-15T12:00:00Z',
    completedAt: '2024-01-15T12:45:00Z',
    shippedAt: '2024-01-15T14:00:00Z',
    carrier: 'Transportadora Rápida',
    trackingNumber: 'TR123456789BR',
    packages: [
      {
        id: '1',
        packageNumber: 'VOL-001',
        weight: 5.5,
        dimensions: { length: 40, width: 30, height: 20 },
        items: [{ productCode: 'PROD-004', productName: 'Produto D', quantity: 15 }]
      }
    ],
    createdAt: '2024-01-15T11:45:00Z'
  },
  {
    id: '2',
    pickingOrderId: '1',
    orderNumber: 'PACK-2024-002',
    customerName: 'Cliente Premium Ltda',
    status: 'packing',
    operator: 'Roberto Souza',
    startedAt: '2024-01-16T11:00:00Z',
    packages: [],
    createdAt: '2024-01-16T10:30:00Z'
  },
  {
    id: '3',
    pickingOrderId: '2',
    orderNumber: 'PACK-2024-003',
    customerName: 'Loja Central',
    status: 'pending',
    packages: [],
    createdAt: '2024-01-16T11:00:00Z'
  }
];

export const inventoryItems: InventoryItem[] = [
  {
    id: '1',
    productCode: 'PROD-001',
    productName: 'Produto A',
    category: 'Eletrônicos',
    location: 'A-01-01-01',
    quantity: 150,
    reservedQty: 35,
    availableQty: 115,
    minStock: 50,
    maxStock: 300,
    unit: 'UN',
    batch: 'LOT-001',
    expirationDate: '2025-01-15',
    status: 'available',
    lastMovement: '2024-01-16T08:00:00Z',
    value: 45.90
  },
  {
    id: '2',
    productCode: 'PROD-002',
    productName: 'Produto B',
    category: 'Eletrônicos',
    location: 'A-01-01-01',
    quantity: 25,
    reservedQty: 5,
    availableQty: 20,
    minStock: 30,
    maxStock: 100,
    unit: 'UN',
    status: 'available',
    lastMovement: '2024-01-15T14:00:00Z',
    value: 89.90
  },
  {
    id: '3',
    productCode: 'PROD-003',
    productName: 'Produto C',
    category: 'Alimentos',
    location: 'A-01-02-01',
    quantity: 100,
    reservedQty: 20,
    availableQty: 80,
    minStock: 100,
    maxStock: 500,
    unit: 'CX',
    batch: 'LOT-003',
    expirationDate: '2024-06-30',
    status: 'available',
    lastMovement: '2024-01-14T09:00:00Z',
    value: 32.50
  },
  {
    id: '4',
    productCode: 'PROD-004',
    productName: 'Produto D',
    category: 'Vestuário',
    location: 'B-01-01-01',
    quantity: 15,
    reservedQty: 0,
    availableQty: 15,
    minStock: 20,
    maxStock: 80,
    unit: 'UN',
    status: 'available',
    lastMovement: '2024-01-15T11:30:00Z',
    value: 125.00
  },
  {
    id: '5',
    productCode: 'PROD-005',
    productName: 'Produto E',
    category: 'Materiais',
    location: 'D-01-01-01',
    quantity: 200,
    reservedQty: 50,
    availableQty: 150,
    minStock: 100,
    maxStock: 1000,
    unit: 'UN',
    status: 'available',
    lastMovement: '2024-01-12T08:00:00Z',
    value: 15.75
  },
  {
    id: '6',
    productCode: 'PROD-006',
    productName: 'Produto F',
    category: 'Químicos',
    location: 'C-01-01-01',
    quantity: 50,
    reservedQty: 0,
    availableQty: 50,
    minStock: 25,
    maxStock: 150,
    unit: 'KG',
    batch: 'LOT-006',
    expirationDate: '2024-03-15',
    status: 'quarantine',
    lastMovement: '2024-01-10T16:00:00Z',
    value: 78.00
  },
  {
    id: '7',
    productCode: 'PROD-007',
    productName: 'Produto G',
    category: 'Eletrônicos',
    location: 'A-02-01-01',
    quantity: 8,
    reservedQty: 0,
    availableQty: 8,
    minStock: 15,
    maxStock: 60,
    unit: 'UN',
    status: 'available',
    lastMovement: '2024-01-08T10:00:00Z',
    value: 299.90
  },
  {
    id: '8',
    productCode: 'PROD-008',
    productName: 'Produto H',
    category: 'Alimentos',
    location: 'A-01-03-01',
    quantity: 0,
    reservedQty: 0,
    availableQty: 0,
    minStock: 50,
    maxStock: 200,
    unit: 'UN',
    batch: 'LOT-008',
    expirationDate: '2024-01-10',
    status: 'expired',
    lastMovement: '2024-01-05T09:00:00Z',
    value: 18.50
  }
];

export const inventoryMovements: InventoryMovement[] = [
  {
    id: '1',
    productCode: 'PROD-001',
    productName: 'Produto A',
    type: 'inbound',
    toLocation: 'A-01-01-01',
    quantity: 100,
    reason: 'Recebimento REC-2024-001',
    operator: 'Carlos Silva',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    productCode: 'PROD-004',
    productName: 'Produto D',
    type: 'outbound',
    fromLocation: 'B-01-01-01',
    quantity: 15,
    reason: 'Picking PICK-2024-003',
    operator: 'Ana Costa',
    createdAt: '2024-01-15T11:30:00Z'
  },
  {
    id: '3',
    productCode: 'PROD-003',
    productName: 'Produto C',
    type: 'transfer',
    fromLocation: 'A-01-01-01',
    toLocation: 'A-01-02-01',
    quantity: 50,
    reason: 'Reorganização de estoque',
    operator: 'Maria Santos',
    createdAt: '2024-01-14T15:00:00Z'
  },
  {
    id: '4',
    productCode: 'PROD-002',
    productName: 'Produto B',
    type: 'adjustment',
    fromLocation: 'A-01-01-01',
    quantity: -2,
    reason: 'Divergência inventário',
    operator: 'João Oliveira',
    createdAt: '2024-01-13T16:00:00Z'
  }
];

export const inventoryCounts: InventoryCount[] = [
  {
    id: '1',
    countNumber: 'INV-2024-001',
    zone: 'A',
    status: 'completed',
    scheduledDate: '2024-01-14',
    startedAt: '2024-01-14T08:00:00Z',
    completedAt: '2024-01-14T12:00:00Z',
    itemsCount: 150,
    discrepancies: 3,
    operator: 'Equipe A'
  },
  {
    id: '2',
    countNumber: 'INV-2024-002',
    zone: 'B',
    status: 'in_progress',
    scheduledDate: '2024-01-16',
    startedAt: '2024-01-16T08:00:00Z',
    itemsCount: 80,
    discrepancies: 0,
    operator: 'Equipe B'
  },
  {
    id: '3',
    countNumber: 'INV-2024-003',
    zone: 'C',
    status: 'scheduled',
    scheduledDate: '2024-01-18',
    itemsCount: 0,
    discrepancies: 0
  }
];

export const wmsSummary: WMSSummary = {
  pendingReceiving: 2,
  activePickings: 3,
  pendingPacking: 2,
  lowStockItems: 3,
  occupancyRate: 68,
  todayMovements: 12
};
