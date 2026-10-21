import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminCatalogSkeletonProps {
  count?: number;
}

/**
 * AdminCatalogSkeleton: Gera quadrados/cards dinâmicos com animação pop-in em cascata
 * e efeito shimmer perolado para preencher a tela durante o carregamento dos itens.
 */
export function AdminCatalogSkeleton({ count = 6 }: AdminCatalogSkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((_, index) => (
        <Card
          key={index}
          style={{ animationDelay: `${index * 65}ms` }}
          className="animate-skeleton-card overflow-hidden border border-zinc-200/80 bg-white shadow-xs flex flex-col justify-between"
        >
          <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
            <div className="flex gap-4 items-start">
              {/* Quadrado do Pôster com shimmer */}
              <div className="w-16 h-24 rounded-xl shimmer-placeholder border border-zinc-200 flex-shrink-0" />

              <div className="flex-1 min-w-0 space-y-2 py-0.5">
                {/* Badge shimmer */}
                <div className="w-16 h-4 rounded-md shimmer-placeholder" />

                {/* Título shimmer */}
                <div className="w-4/5 h-4 rounded-md shimmer-placeholder" />

                {/* Gênero shimmer */}
                <div className="w-1/2 h-3 rounded-md shimmer-placeholder" />

                {/* Preço shimmer */}
                <div className="w-20 h-4 rounded-md shimmer-placeholder mt-1" />
              </div>
            </div>

            {/* Ações inferiores shimmer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 mt-auto">
              <div className="w-14 h-7 rounded-lg shimmer-placeholder" />
              <div className="w-16 h-7 rounded-lg shimmer-placeholder" />
              <div className="w-8 h-7 rounded-lg shimmer-placeholder" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
