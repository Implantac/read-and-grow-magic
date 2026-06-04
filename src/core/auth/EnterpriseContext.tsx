import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Segment = 'textile' | 'food_factory' | 'pharma' | 'distribution' | 'services' | 'general';

interface EnterpriseContextType {
  currentCompany: any;
  currentBranch: any;
  segment: Segment;
  isLoading: boolean;
  setCompany: (id: string) => Promise<void>;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<any>(null);
  const [segment, setSegment] = useState<Segment>('general');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveTenant();
  }, []);

  const loadActiveTenant = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();
      
      if (company) {
        setCurrentCompany(company);
        setSegment((company.segment as Segment) || 'general');
      }
    }
    setIsLoading(false);
  };

  const setCompany = async (id: string) => {
    const { data } = await supabase.from('companies').select('*').eq('id', id).single();
    if (data) {
      setCurrentCompany(data);
      setSegment((data.segment as Segment) || 'general');
    }
  };

  return (
    <EnterpriseContext.Provider value={{ currentCompany, currentBranch, segment, isLoading, setCompany }}>
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) throw new Error('useEnterprise must be used within EnterpriseProvider');
  return context;
};
