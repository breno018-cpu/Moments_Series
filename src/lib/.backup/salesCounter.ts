export interface SalesMetric {
  label: string;
  badgeClass: string;
}

export function getDynamicSalesMetric(
  itemId: string,
  isFeatured: boolean = false,
  itemType: 'series' | 'anime' = 'series'
): SalesMetric {
  // Gerar um número semi-determinístico baseado no ID para consistência visual
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) {
    hash = (hash << 5) - hash + itemId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const salesCount = (positiveHash % 850) + 120;

  if (isFeatured || salesCount > 700) {
    return {
      label: `🔥 +${salesCount} Vendidos`,
      badgeClass: 'text-amber-400 border-amber-500/30',
    };
  }

  if (salesCount > 400) {
    return {
      label: `⭐ High Rating`,
      badgeClass: 'text-purple-400 border-purple-500/30',
    };
  }

  return {
    label: `⚡ Populares`,
    badgeClass: 'text-blue-400 border-blue-500/30',
  };
}
