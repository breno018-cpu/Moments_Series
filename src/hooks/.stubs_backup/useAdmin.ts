import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdmin() {
  return useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        isAdmin: !!session?.user,
        user: session?.user || null,
        loading: false,
      };
    },
  });
}
