// RFID Types

export type ReaderStatus = 'active' | 'inactive' | 'maintenance' | 'error';
export type TagType = 'product' | 'pallet' | 'location' | 'asset';
export type TagStatus = 'active' | 'inactive' | 'lost' | 'damaged';
export type RFIDEventType = 'read' | 'entry' | 'exit' | 'transfer' | 'inventory';

export interface RFIDReader {
  id: string;
  code: string;
  name: string;
  location?: string;
  zone?: string;
  ipAddress?: string;
  port?: number;
  model?: string;
  manufacturer?: string;
  antennaCount: number;
  status: ReaderStatus;
  lastHeartbeat?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFIDTag {
  id: string;
  epc: string;
  tagType: TagType;
  productId?: string;
  productCode?: string;
  productName?: string;
  batch?: string;
  palletId?: string;
  location?: string;
  status: TagStatus;
  registeredAt: string;
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFIDEvent {
  id: string;
  readerId?: string;
  readerCode: string;
  tagEpc: string;
  tagId?: string;
  eventType: RFIDEventType;
  rssi?: number;
  antenna: number;
  location?: string;
  zone?: string;
  processed: boolean;
  processedAt?: string;
  actionTaken?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface RFIDSummary {
  totalReaders: number;
  activeReaders: number;
  totalTags: number;
  activeTags: number;
  eventsToday: number;
  unprocessedEvents: number;
}
