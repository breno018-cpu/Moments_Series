import React from 'react';
import { triggerHaptic } from '@/lib/haptics';
import { Sparkles, Flame, Clock, Mic, MessageSquare, Film, Star } from 'lucide-react';

export type FilterCategory = 'all' | 'featured' | 'recent' | 'dublado' | 'legendado' | 'anime' | 'top_rated';

interface QuickFilterBarProps {
  activeFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
  counts?: Record<FilterCategory, number>;
}

const FILTER_ITEMS: { id: FilterCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'featured', label: 'Mais Vendidos', icon: Flame },
  { id: 'recent', label: 'Lançamentos', icon: Clock },
  { id: 'dublado', label: 'Dublados', icon: Mic },
  { id: 'legendado', label: 'Legendados', icon: MessageSquare },
  { id: 'anime', label: 'Animes', icon: Film },
  { id: 'top_rated', label: 'Top Avaliados', icon: Star },
];

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const handleSelect = (id: FilterCategory) => {
    triggerHaptic('selection');
    onSelectFilter(id);
  };

  return (
    <div className="w-full py-3 mb-6">
      <div className="app-container">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 touch-pan-x">
          {FILTER_ITEMS.map((item) => {
            const isActive = activeFilter === item.id;
            const count = counts ? counts[item.id] : undefined;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 scale-[1.03] ring-1 ring-purple-400/50'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-black/30 text-purple-200' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
