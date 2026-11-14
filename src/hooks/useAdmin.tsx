import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const MASTER_ADMIN_EMAIL = 'momentsserie6@gmail.com';
export const MASTER_ADMIN_PASS = 'Admin@Moments2026!';
export const MASTER_ADMIN_PIN = '2026';

/**
 * Garante que o cliente Supabase possui uma sessão JWT ativa e válida com privilégios de administrador.
 * Se o token atual estiver expirado ou ausente, faz refresh ou autentica com as credenciais mestras.
 */
export async function ensureAdminAuth(forceReauth = false): Promise<boolean> {
  try {
    if (!forceReauth) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError && userData?.user) {
        const uid = userData.user.id;
        const email = (userData.user.email || '').toLowerCase();
        if (
          email === 'momentsserie6@gmail.com' ||
          email === 'laurentinobreno08@gmail.com' ||
          uid === '78b8af22-4484-469f-85c1-7f6259f8dc22' ||
          uid === '7f6efca7-d169-4baf-87c9-56fe6c28c8af'
        ) {
          return true;
        }
      }

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData?.session) {
        const email = (refreshData.session.user.email || '').toLowerCase();
        if (email === 'momentsserie6@gmail.com' || email === 'laurentinobreno08@gmail.com') {
          return true;
        }
      }
    }

    // Autentica diretamente com a conta mestre padrão com permissão total garantida no Supabase
    const { data: masterAuth, error: masterErr } = await supabase.auth.signInWithPassword({
      email: MASTER_ADMIN_EMAIL,
      password: MASTER_ADMIN_PASS,
    });

    if (!masterErr && masterAuth?.session) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('moments_admin_session', 'true');
        localStorage.setItem('moments_admin_email', MASTER_ADMIN_EMAIL);
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error('[ensureAdminAuth] Erro ao assegurar sessão admin:', err);
    return false;
  }
}

export const useAdmin = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Verifica persistência de sessão em localStorage ou sessionStorage
  const getPersistedAdmin = () => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('moments_admin_session') === 'true' ||
      sessionStorage.getItem('moments_admin_session') === 'true'
    );
  };

  const [hasCachedAdmin, setHasCachedAdmin] = useState<boolean>(getPersistedAdmin);

  useEffect(() => {
    let isMounted = true;

    // 1. Obter a sessão ativa inicial do Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        setCurrentSession(session);
        setIsSessionLoading(false);
      } else if (getPersistedAdmin()) {
        // Se há sessão administrativa ativa em cache mas a sessão Supabase expirou,
        // restaura silenciosamente para garantir permissões RLS (ex: leitura de pedidos e links)
        try {
          const emailToRestore = localStorage.getItem('moments_admin_email') || MASTER_ADMIN_EMAIL;
          const { data: authData } = await supabase.auth.signInWithPassword({
            email: emailToRestore,
            password: MASTER_ADMIN_PASS,
          });
          if (isMounted && authData?.session) {
            setCurrentSession(authData.session);
          }
        } catch (silentErr) {
          console.warn('[useAdmin] Restauração silenciosa de sessão:', silentErr);
        } finally {
          if (isMounted) setIsSessionLoading(false);
        }
      } else {
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
        if (!session && !getPersistedAdmin()) {
          setHasCachedAdmin(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = currentSession?.user?.id;

  const query = useQuery({
    queryKey: ['admin-status', userId, hasCachedAdmin],
    enabled: !isSessionLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const persisted = getPersistedAdmin();

      if (!currentSession) {
        if (persisted) {
          const cachedEmail = localStorage.getItem('moments_admin_email') || MASTER_ADMIN_EMAIL;
          return { isAdmin: true, email: cachedEmail };
        }
        return { isAdmin: false, email: '' };
      }

      // 1. Tentar ler diretamente da tabela user_roles
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentSession.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      let isAdmin = !!data;

      // 2. Fallback resiliente: RPC is_admin
      if (!isAdmin) {
        try {
          const { data: rpcIsAdmin } = await supabase.rpc('is_admin', {
            user_id: currentSession.user.id,
          });
          if (rpcIsAdmin === true) {
            isAdmin = true;
          }
        } catch (rpcErr) {
          console.warn('[useAdmin] RPC is_admin check fallback:', rpcErr);
        }
      }

      // 3. Fallback para administradores oficiais conhecidos
      const userEmail = (currentSession.user.email || '').toLowerCase();
      if (!isAdmin && (
        userEmail === 'momentsserie6@gmail.com' ||
        userEmail === 'laurentinobreno08@gmail.com' ||
        persisted
      )) {
        isAdmin = true;
      }

      if (isAdmin) {
        sessionStorage.setItem('moments_admin_session', 'true');
        localStorage.setItem('moments_admin_session', 'true');
        if (currentSession.user.email) {
          localStorage.setItem('moments_admin_email', currentSession.user.email);
        }
      } else if (!persisted) {
        sessionStorage.removeItem('moments_admin_session');
        localStorage.removeItem('moments_admin_session');
      }

      return {
        isAdmin: isAdmin || persisted,
        email: currentSession.user.email || localStorage.getItem('moments_admin_email') || MASTER_ADMIN_EMAIL,
      };
    },
  });

  const isPersisted = getPersistedAdmin();
  const isAdmin = query.data?.isAdmin ?? isPersisted;
  const isLoading = isSessionLoading && !isPersisted;

  return {
    ...query,
    isLoading,
    isPending: isLoading,
    data: query.data ?? { isAdmin, email: query.data?.email || '' },
    isAdmin,
    email: query.data?.email || (currentSession?.user?.email || (typeof window !== 'undefined' ? localStorage.getItem('moments_admin_email') : '') || MASTER_ADMIN_EMAIL),
  };
};
