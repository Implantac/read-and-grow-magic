import { FileText, Truck, MapPin, DollarSign, ClipboardCheck } from 'lucide-react';

export const STEPS = [
  { id: 'import', label: 'Importar NF-e', icon: FileText },
  { id: 'parts', label: 'Participantes', icon: Truck },
  { id: 'route', label: 'Rota', icon: MapPin },
  { id: 'freight', label: 'Valores', icon: DollarSign },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];

export interface CTeForm {
  carrier_name: string;
  carrier_document: string;
  sender_name: string;
  sender_document: string;
  sender_uf: string;
  recipient_name: string;
  recipient_document: string;
  recipient_uf: string;
  origin_city: string;
  destination_city: string;
  cargo_value: number;
  freight_value: number;
  icms_rate: number;
  modal: string;
}

export const INITIAL_FORM: CTeForm = {
  carrier_name: 'TRANSPORTADORA LOGISTICA LTDA',
  carrier_document: '12.345.678/0001-90',
  sender_name: '',
  sender_document: '',
  sender_uf: 'SP',
  recipient_name: '',
  recipient_document: '',
  recipient_uf: 'RJ',
  origin_city: '',
  destination_city: '',
  cargo_value: 0,
  freight_value: 0,
  icms_rate: 12,
  modal: 'rodoviario',
};

export type StepValidation = Record<number, { errors: string[]; warnings: string[] }>;
