/**
 * Gera métricas de vendas realistas e impactantes com adaptação automática
 * ao dia do mês (início, meio e fim de mês) e números fora da curva para Top Séries.
 */
export interface SalesMetric {
  count: number;
  formattedCount: string;
  label: string;
  badgeClass: string;
}

export function getDynamicSalesMetric(seriesId: string, isFeatured = false, itemType = 'series'): SalesMetric {
  if (!seriesId) {
    return {
      count: 14250,
      formattedCount: '14.250',
      label: '+14.250 vendas no mês',
      badgeClass: 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold shadow-sm',
    };
  }

  // Hash determinístico baseado no ID único
  let hash = 0;
  for (let i = 0; i < seriesId.length; i++) {
    hash = (hash << 5) - hash + seriesId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Meta total cheia do mês:
  // Top / Destaques: fora da curva (10.500 a 18.800 vendas no final do mês)
  // Séries Normais / Animes: 520 a 7.100 vendas no final do mês
  let fullMonthlyTarget = 0;
  if (isFeatured) {
    fullMonthlyTarget = 10500 + (positiveHash % 8300);
  } else {
    fullMonthlyTarget = 520 + (positiveHash % 6580);
  }

  // Proporção realista do dia do mês (dia 1 = ~25% acumulado; dia 31 = 100% acumulado)
  const now = new Date();
  const dayOfMonth = Math.max(1, Math.min(31, now.getDate()));
  const monthProgress = 0.25 + (dayOfMonth / 31) * 0.75;

  // Vendas reais acumuladas até o dia de hoje no mês
  const currentSales = Math.floor(fullMonthlyTarget * monthProgress);

  // Formatação pontuada brasileira (ex: 14.850)
  const formattedCount = currentSales.toLocaleString('pt-BR');
  const label = `+${formattedCount} vendas no mês`;

  // Estilo visual de acordo com o nível da série
  const badgeClass = isFeatured
    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold shadow-sm'
    : (positiveHash % 2 === 0
      ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold'
      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold');

  return {
    count: currentSales,
    formattedCount,
    label,
    badgeClass,
  };
}
