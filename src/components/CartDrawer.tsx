import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight, Trash2, Sparkles, ShieldCheck } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { optimizedImage } from "@/lib/image";
import placeholderImage from "@/assets/series-1.jpg";
import { triggerHaptic } from "@/lib/haptics";

export function CartDrawer() {
  const { items, removeItem, getTotalPrice } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = (items || []).reduce(
    (acc, item) => acc + (typeof item?.quantity === 'number' && item.quantity > 0 ? item.quantity : 1),
    0
  );
  const totalPrice = getTotalPrice();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  const handleCheckoutClick = () => {
    triggerHaptic('medium');
    setIsOpen(false);
    navigate('/checkout/cart');
  };

  const handleItemClick = (item: any) => {
    setIsOpen(false);
    if (item.itemType === 'anime' || item.type === 'anime') {
      navigate('/animes');
    } else {
      navigate(`/series/${item.id}`);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botão de Disparo do Carrinho na Barra de Navegação */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCheckoutClick}
        aria-label="Abrir carrinho de compras"
        className="relative h-10 w-10 text-foreground hover:bg-white/10 hover:text-primary rounded-full transition-all group"
      >
        <ShoppingBag className="h-[1.15rem] w-[1.15rem] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
        
        {totalItems > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-2 border-background shadow-md shadow-purple-900/50 animate-in zoom-in-75">
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
      </Button>

      {/* Popover Animado com Exibição dos Itens no Hover */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 animate-cart-popup rounded-2xl bg-[#0b0d14]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-purple-500/20 overflow-hidden text-foreground"
          role="dialog"
          aria-label="Itens do carrinho"
        >
          {/* Topo do Card de Pré-visualização */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                Seu Carrinho
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> PIX Instantâneo
            </span>
          </div>

          {/* Lista de Itens com Efeito Cascata */}
          {items.length === 0 ? (
            <div className="px-6 py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-muted-foreground mx-auto flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-xs font-semibold text-slate-200">Seu carrinho está vazio</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Navegue pelas séries e animes para adicionar episódios e temporadas completas.
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.05] p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                {items.map((item, index) => {
                  if (!item || !item.id) return null;
                  const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
                  const itemQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
                  const itemImg = item.image_url ? optimizedImage(item.image_url, { width: 120, quality: 70 }) : placeholderImage;
                  const isAnime = item.itemType === 'anime' || (item as any).type === 'anime';

                  return (
                    <div
                      key={item.id}
                      style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
                      className="animate-cart-item group/item relative flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-all duration-200"
                    >
                      {/* Pôster com thumbnail e badge */}
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10 bg-black/40 group-hover/item:scale-105 transition-transform text-left cursor-pointer"
                        title="Ver detalhes"
                      >
                        <img
                          src={itemImg}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = placeholderImage;
                          }}
                        />
                        {isAnime && (
                          <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded bg-purple-600/90 flex items-center justify-center text-[8px] text-white">
                            <Sparkles className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>

                      {/* Informações do Título */}
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className="text-left w-full cursor-pointer"
                        >
                          <h4 className="text-xs font-semibold text-white truncate group-hover/item:text-purple-300 transition-colors">
                            {item.title}
                          </h4>
                        </button>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {item.genre || (isAnime ? 'Anime' : 'Série')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-emerald-400">
                            R$ {(itemPrice * itemQty).toFixed(2)}
                          </span>
                          {itemQty > 1 && (
                            <span className="text-[10px] text-slate-400">
                              ({itemQty}x R$ {itemPrice.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botão de Remover com confirmação instantânea */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          removeItem(item.id);
                        }}
                        className="opacity-60 group-hover/item:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Remover do carrinho"
                        aria-label={`Remover ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Rodapé com Total e Botão para Finalizar Compra */}
              <div className="p-3 bg-white/[0.02] border-t border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground font-medium">Subtotal ({totalItems} itens):</span>
                  <span className="text-sm font-black text-white">
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={handleCheckoutClick}
                  className="w-full h-10 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 border border-yellow-300/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                >
                  <span>Finalizar Compra</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
