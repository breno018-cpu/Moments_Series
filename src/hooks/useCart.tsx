import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Series } from './useSeries';
import { Anime } from './useAnimes';

export type CartItem = (Series | Anime) & {
  itemType?: 'series' | 'anime';
  quantity?: number;
};

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity?: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (!item || !item.id) return;
        const current = get().items || [];
        const validPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
        const existingIndex = current.findIndex((i) => i?.id === item.id);
        
        if (existingIndex >= 0) {
          const updated = [...current];
          const currItem = updated[existingIndex];
          const currentQty = typeof currItem.quantity === 'number' && currItem.quantity > 0 ? currItem.quantity : 1;
          updated[existingIndex] = { ...currItem, price: validPrice, quantity: currentQty + 1 };
          set({ items: updated });
        } else {
          set({ items: [...current, { ...item, price: validPrice, quantity: 1 }] });
        }
      },
      removeItem: (id) => {
        set({ items: (get().items || []).filter((i) => i && i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: (get().items || []).filter((i) => i && i.id !== id) });
          return;
        }
        set({
          items: (get().items || []).map((i) =>
            i && i.id === id ? { ...i, quantity: Math.max(1, Math.floor(quantity)) } : i
          ),
        });
      },
      clearCart: () => {
        set({ items: [] });
      },
      getTotal: () => {
        const items = get().items || [];
        return items.reduce((acc, item) => {
          if (!item) return acc;
          const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
          const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
          return acc + price * qty;
        }, 0);
      },
      getTotalPrice: () => {
        const items = get().items || [];
        return items.reduce((acc, item) => {
          if (!item) return acc;
          const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
          const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
          return acc + price * qty;
        }, 0);
      },
    }),
    {
      name: 'moments-cart-storage',
    }
  )
);
