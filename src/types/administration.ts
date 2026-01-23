// User Management Types
export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'blocked';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  department?: string;
  branchId?: string;
  branchName?: string;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilter {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  branchId?: string;
}

// Company/Branch Types
export type CompanyStatus = 'active' | 'inactive';

export interface Company {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  email: string;
  phone: string;
  address: Address;
  logo?: string;
  status: CompanyStatus;
  isHeadquarters: boolean;
  parentCompanyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CompanyFilter {
  search?: string;
  status?: CompanyStatus | 'all';
  isHeadquarters?: boolean | 'all';
}

// System Parameters Types
export type ParameterCategory = 
  | 'general' 
  | 'fiscal' 
  | 'commercial' 
  | 'financial' 
  | 'production' 
  | 'wms' 
  | 'purchasing'
  | 'integration';

export type ParameterType = 'text' | 'number' | 'boolean' | 'select' | 'date' | 'json';

export interface SystemParameter {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ParameterCategory;
  type: ParameterType;
  value: string;
  defaultValue: string;
  options?: string[]; // For select type
  required: boolean;
  sensitive: boolean; // For passwords/keys
  updatedAt: string;
  updatedBy: string;
}

export interface ParameterFilter {
  search?: string;
  category?: ParameterCategory | 'all';
}

// Permission Types
export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
}

// Status configurations
export interface StatusConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}
