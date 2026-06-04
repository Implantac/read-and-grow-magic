import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Segment = 'textile' | 'food_factory' | 'pharma' | 'distribution' | 'services' | 'general';

interface EnterpriseContextType {
  currentCompany: any;
  currentBranch: any;
  segment: Segment;
  taxRegime: string;
  operationTypes: any[];
  isLoading: boolean;
  setCompany: (id: string) => Promise<void>;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<any>(null);
  const [segment, setSegment] = useState<Segment>('general');
  const [taxRegime, setTaxRegime] = useState<string>('Simples Nacional');
  const [operationTypes, setOperationTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveTenant();
  }, []);

  const loadActiveTenant = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .limit(1)
          .single();
        
        if (company) {
          setCurrentCompany(company);
          setSegment((company.segment as any) || 'general');
          setTaxRegime((company.tax_regime as string) || 'Simples Nacional');
          setOperationTypes((company.operation_types as any[]) || []);
        }
      }
    } catch (error) {
      console.error('Error loading enterprise context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCompany = async (id: string) => {
    const { data } = await supabase.from('companies').select('*').eq('id', id).single();
    if (data) {
      setCurrentCompany(data);
      setSegment((data.segment as any) || 'general');
      setTaxRegime((data.tax_regime as string) || 'Simples Nacional');
      setOperationTypes((data.operation_types as any[]) || []);
    }
  };

  return (
    <EnterpriseContext.Provider value={{ 
      currentCompany, 
      currentBranch, 
      segment, 
      taxRegime,
      operationTypes,
      isLoading, 
      setCompany 
    }}>
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) throw new Error('useEnterprise must be used within EnterpriseProvider');
  return context;
};
