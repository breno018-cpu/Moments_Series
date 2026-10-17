import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { trackAddToCart } from "@/lib/metaPixel";
import { Serie } from "@/data/series";

export interface CartItem {
  serie: Serie;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (serie: Serie) => void;
  removeFromCart: (serieId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (serieId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((serie: Serie) => {
    setItems((prev) => {
      if (prev.find((i) => i.serie.id === serie.id)) return prev;
      trackAddToCart({
        content_name: serie.titulo,
        content_ids: [serie.id],
        content_type: "product",
        value: serie.preco,
      });
      return [...prev, { serie, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((serieId: string) => {
    setItems((prev) => prev.filter((i) => i.serie.id !== serieId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (serieId: string) => items.some((i) => i.serie.id === serieId),
    [items]
  );

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, i) => sum + i.serie.preco, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems, totalPrice, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};
