import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Blocks access to the app shell until the authenticated user is linked to
 * a tenant (profiles.company_id). Otherwise redirects to /onboarding.
 */
export function OnboardingGuard() {
  const { user, isAuthenticated } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setChecked(true);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      if (!data?.company_id && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      }
      setChecked(true);
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, navigate, location.pathname]);

  if (!checked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
