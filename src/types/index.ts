// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'diretor' | 'financeiro' | 'fiscal' | 'contabil' | 'compras' | 'producao' | 'logistica' | 'comercial' | 'loja' | 'franquia';
  permissions: string[];
}

// Company Types
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  logo?: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  companyId: string;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

// Dashboard Types
export interface KPICard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  module: string;
  createdAt: string;
  read: boolean;
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  module: string;
}

// Chart Types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

// Form Types
export interface SelectOption {
  value: string;
  label: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
