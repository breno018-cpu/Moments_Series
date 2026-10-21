import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useCurrentUser() {
  return { id: 'guest-user', email: 'user@moments.com' };
}

export function useWishlist(itemType?: string, itemId?: string) {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('moments_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const isInWishlist = itemId ? wishlist.includes(itemId) : false;

  return {
    wishlist,
    isInWishlist,
    isLoading: false,
  };
}

export function useToggleWishlist() {
  return {
    mutate: ({ itemId, itemType }: { itemId: string; itemType?: string }) => {
      try {
        const saved = localStorage.getItem('moments_wishlist');
        let current: string[] = saved ? JSON.parse(saved) : [];
        if (current.includes(itemId)) {
          current = current.filter((id) => id !== itemId);
          toast.info('Removido dos favoritos');
        } else {
          current.push(itemId);
          toast.success('Adicionado aos favoritos');
        }
        localStorage.setItem('moments_wishlist', JSON.stringify(current));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        toast.error('Erro ao atualizar favoritos');
      }
    },
  };
}
