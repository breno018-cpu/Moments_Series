import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export interface WishlistItem {
  id: string;
  user_id: string;
  item_type: 'series' | 'anime';
  item_id: string;
  created_at: string;
}

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return userId;
};

// Local storage helper
const getLocalWishlist = (): WishlistItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('moments-wishlist');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalWishlist = (items: WishlistItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('moments-wishlist', JSON.stringify(items));
    window.dispatchEvent(new Event('wishlist-changed'));
  } catch (err) {
    console.error('Error saving wishlist to localStorage', err);
  }
};

export const useWishlist = () => {
  const userId = useCurrentUser();
  const [localWishlist, setLocalWishlistState] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setLocalWishlistState(getLocalWishlist());
    const handleLocalChange = () => setLocalWishlistState(getLocalWishlist());
    window.addEventListener('wishlist-changed', handleLocalChange);
    return () => window.removeEventListener('wishlist-changed', handleLocalChange);
  }, []);

  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      if (!userId) {
        return localWishlist;
      }
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WishlistItem[];
    },
    initialData: !userId ? localWishlist : undefined,
  });
};

export const useToggleWishlist = () => {
  const qc = useQueryClient();
  const userId = useCurrentUser();

  return useMutation({
    mutationFn: async ({
      item_type,
      item_id,
      isFavorite,
    }: {
      item_type: 'series' | 'anime';
      item_id: string;
      isFavorite: boolean;
    }) => {
      if (!userId) {
        const items = getLocalWishlist();
        if (isFavorite) {
          const filtered = items.filter(i => !(i.item_type === item_type && i.item_id === item_id));
          setLocalWishlist(filtered);
        } else {
          const newItem: WishlistItem = {
            id: Math.random().toString(36).substring(2, 9),
            user_id: 'guest',
            item_type,
            item_id,
            created_at: new Date().toISOString()
          };
          setLocalWishlist([newItem, ...items]);
        }
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('item_type', item_type)
          .eq('item_id', item_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: userId, item_type, item_id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      window.dispatchEvent(new Event('wishlist-changed'));
      toast.success(vars.isFavorite ? 'Removido dos favoritos' : '💜 Adicionado aos favoritos');
    },
    onError: (e: any) => toast.error(e.message),
  });
};
