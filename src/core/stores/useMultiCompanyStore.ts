import { create } from 'zustand';

interface Organization {
  id: string;
  name: string;
  type: 'holding' | 'company' | 'branch' | 'unit';
  parentId?: string;
  cnpj?: string;
}

interface MultiCompanyState {
  activeOrganization: Organization | null;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrganization: (org: Organization) => void;
}

export const useMultiCompanyStore = create<MultiCompanyState>((set) => ({
  activeOrganization: null,
  organizations: [],
  setOrganizations: (organizations) => set({ organizations }),
  setActiveOrganization: (activeOrganization) => set({ activeOrganization }),
}));
