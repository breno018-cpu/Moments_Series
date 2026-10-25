import React from "react";

interface StorefrontGridSkeletonProps {
  count?: number;
}

/**
 * Skeleton geométrico para a grade principal da loja pública.
 * Possui proporção exata de poster vertical (aspect 2/3),
 * emblemas simulados, títulos, estrelas e preços, gerados em cascata com atraso escalonado.
 */
export const StorefrontGridSkeleton: React.FC<StorefrontGridSkeletonProps> = ({ count = 12 }) => {
  return (
    <div className="catalog-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`storefront-grid-skeleton-${i}`}
          className="animate-storefront-stagger group block select-none pointer-events-none"
          style={{ animationDelay: `${Math.min(i * 35, 420)}ms` }}
        >
          {/* Card Poster Container */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06]">
            {/* Shimmer de fundo escuro */}
            <div className="absolute inset-0 shimmer-placeholder-dark" />

            {/* Simulação do Badge de Áudio no topo esquerdo */}
            <div className="absolute top-2 left-2 flex gap-1 items-center">
              <div className="h-4 w-8 rounded bg-white/[0.08]" />
            </div>

            {/* Simulação do Badge de Avaliação ou Vendas no rodapé do poster */}
            <div className="absolute bottom-2 left-2 flex gap-1 items-center">
              <div className="h-3.5 w-16 rounded bg-white/[0.06]" />
            </div>

            {/* Simulação do botão circular rápido */}
            <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-white/[0.06]" />
          </div>

          {/* Rodapé de informações: título, nota e preço */}
          <div className="pt-2.5 px-0.5 space-y-1.5">
            {/* Linha do título */}
            <div
              className="h-3.5 rounded bg-white/[0.07] shimmer-placeholder-dark"
              style={{ width: `${65 + ((i * 7) % 30)}%` }}
            />
            {/* Linha de nota e preço */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/30" />
                <div className="w-6 h-2.5 rounded bg-white/[0.05]" />
              </div>
              <div className="w-12 h-3 rounded bg-white/[0.08] shimmer-placeholder-dark" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface StorefrontRowSkeletonProps {
  count?: number;
  title?: string;
}

/**
 * Skeleton para trilhas horizontais (carrosséis) da loja pública.
 */
export const StorefrontRowSkeleton: React.FC<StorefrontRowSkeletonProps> = ({
  count = 7,
  title,
}) => {
  return (
    <section className="mb-8 sm:mb-12" aria-hidden="true">
      <div className="app-container">
        {/* Cabeçalho da seção */}
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-3">
            {title ? (
              <h2 className="text-base sm:text-xl font-semibold tracking-tight text-foreground/70">
                {title}
              </h2>
            ) : (
              <div className="h-5 w-44 rounded-md bg-white/[0.08] shimmer-placeholder-dark" />
            )}
            <div className="h-3 w-6 rounded bg-white/[0.04]" />
          </div>
        </div>

        {/* Trilho horizontal */}
        <div className="relative">
          <div className="flex gap-3 sm:gap-4 overflow-hidden pb-2">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={`storefront-row-skeleton-${i}`}
                className="flex-none w-[135px] xs:w-[150px] sm:w-[170px] md:w-[185px] lg:w-[195px] xl:w-[205px] animate-storefront-stagger pointer-events-none select-none"
                style={{ animationDelay: `${Math.min(i * 40, 360)}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06]">
                  <div className="absolute inset-0 shimmer-placeholder-dark" />
                  <div className="absolute top-2 left-2 h-4 w-7 rounded bg-white/[0.08]" />
                </div>
                <div className="pt-2 px-0.5 space-y-1.5">
                  <div
                    className="h-3.5 rounded bg-white/[0.07] shimmer-placeholder-dark"
                    style={{ width: `${70 + ((i * 5) % 25)}%` }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-2.5 rounded bg-white/[0.05]" />
                    <div className="w-10 h-2.5 rounded bg-white/[0.08]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorefrontGridSkeleton;
