import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Obter a sessão ativa inicial do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setCurrentSession(session);
        setIsSessionLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsSessionLoading(false);
    });

    // 2. Escutar alterações em tempo real do estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setCurrentSession(session);
        setIsSessionLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = currentSession?.user?.id;

  const query = useQuery({
    queryKey: ['admin-status', userId],
    enabled: !isSessionLoading && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!currentSession) {
        sessionStorage.removeItem('moments_admin_session');
        return { isAdmin: false, email: '' };
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentSession.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar status de admin:', error);
        const wasAdmin = typeof window !== 'undefined' && sessionStorage.getItem('moments_admin_session') === 'true';
        return { isAdmin: wasAdmin, email: currentSession.user.email || '' };
      }

      const isAdmin = !!data;
      if (isAdmin) {
        sessionStorage.setItem('moments_admin_session', 'true');
      } else {
        sessionStorage.removeItem('moments_admin_session');
      }

      return { isAdmin, email: currentSession.user.email || '' };
    },
  });

  const wasAdmin = typeof window !== 'undefined' && sessionStorage.getItem('moments_admin_session') === 'true';
  const isAdmin = query.data?.isAdmin ?? (currentSession ? wasAdmin : false);
  const isLoading = isSessionLoading || (query.isLoading && !wasAdmin);

  return {
    ...query,
    isLoading,
    isPending: isLoading,
    data: query.data ?? { isAdmin, email: query.data?.email || '' },
    isAdmin,
    email: query.data?.email || (currentSession?.user?.email || ''),
  };
};
