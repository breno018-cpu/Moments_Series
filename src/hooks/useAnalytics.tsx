import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
}

export const useAnalytics = (filters: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['analytics', filters.startDate.toISOString(), filters.endDate.toISOString()],
    staleTime: 5 * 60 * 1000, // 5 minutos de cache em memória para navegação instantânea
    queryFn: async () => {
      const startISO = filters.startDate.toISOString();
      const endISO = filters.endDate.toISOString();

      // ============ Dados base ============
      const [pvRes, salesRes, ordersRes, viewsRes, purchasesRes] = await Promise.all([
        // Page views completos (com utms, device, etc)
        supabase
          .from('page_views')
          .select('id, page_path, created_at, session_id, utm_source, utm_medium, utm_campaign, device_type, browser, os, referrer, time_on_page, user_id')
          .gte('created_at', startISO).lte('created_at', endISO)
          .limit(10000),
        // Compras (count)
        supabase
          .from('purchases')
          .select('*', { count: 'exact', head: true })
          .gte('purchased_at', startISO).lte('purchased_at', endISO),
        // Orders pagas com utm + total
        supabase
          .from('orders')
          .select('id, total_amount, customer_email, payment_status, created_at, utm_source, utm_medium, utm_campaign, series_id')
          .gte('created_at', startISO).lte('created_at', endISO)
          .limit(5000),
        // Series views com título
        supabase
          .from('series_views')
          .select('series_id, created_at, series(title)')
          .gte('created_at', startISO).lte('created_at', endISO)
          .limit(5000),
        // Compras com info de série
        supabase
          .from('purchases')
          .select('series_id, order_id, purchased_at, series(title, genre), orders(total_amount, customer_email)')
          .gte('purchased_at', startISO).lte('purchased_at', endISO)
          .limit(5000),
      ]);

      const pageViews = pvRes.data || [];
      const orders = ordersRes.data || [];
      const seriesViews = viewsRes.data || [];
      const purchasesData = purchasesRes.data || [];

      // ============ Métricas básicas ============
      const periodPageViews = pageViews.length;
      const periodSales = salesRes.count || 0;

      // Receita deduplicada por order_id (orders pagas)
      const paidOrders = orders.filter((o: any) => ['completed', 'paid', 'approved'].includes(o.payment_status));
      const periodRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

      // Visitantes únicos
      const uniqueSessions = new Set(pageViews.map((p: any) => p.session_id).filter(Boolean));
      const uniqueVisitors = uniqueSessions.size;

      // Tempo médio na página
      const timesOnPage = pageViews.map((p: any) => p.time_on_page).filter((t: any) => typeof t === 'number' && t > 0);
      const avgTimeOnPage = timesOnPage.length > 0
        ? Math.round(timesOnPage.reduce((s: number, v: number) => s + v, 0) / timesOnPage.length)
        : 0;

      // Ticket médio
      const ticketMedio = paidOrders.length > 0 ? periodRevenue / paidOrders.length : 0;

      // Taxa de conversão geral
      const conversionRate = uniqueVisitors > 0 ? (paidOrders.length / uniqueVisitors) * 100 : 0;

      // ============ Top séries ============
      const seriesViewCounts: Record<string, number> = {};
      seriesViews.forEach((v: any) => {
        const t = v.series?.title || 'Desconhecida';
        seriesViewCounts[t] = (seriesViewCounts[t] || 0) + 1;
      });
      const topViewed = Object.entries(seriesViewCounts)
        .map(([title, views]) => ({ title, views }))
        .sort((a, b) => b.views - a.views).slice(0, 8);

      const seriesPurchaseCounts: Record<string, number> = {};
      purchasesData.forEach((p: any) => {
        const t = p.series?.title || 'Desconhecida';
        seriesPurchaseCounts[t] = (seriesPurchaseCounts[t] || 0) + 1;
      });
      const topPurchased = Object.entries(seriesPurchaseCounts)
        .map(([title, purchases]) => ({ title, purchases }))
        .sort((a, b) => b.purchases - a.purchases).slice(0, 8);

      // ============ Funil de conversão ============
      const sessionPaths = new Map<string, Set<string>>();
      pageViews.forEach((p: any) => {
        if (!p.session_id) return;
        const set = sessionPaths.get(p.session_id) || new Set();
        set.add(p.page_path);
        sessionPaths.set(p.session_id, set);
      });

      const visitedSessions = sessionPaths.size;
      const viewedDetailSessions = Array.from(sessionPaths.values())
        .filter(paths => Array.from(paths).some(p => p.startsWith('/series/') || p.startsWith('/anime/'))).length;
      const cartSessions = Array.from(sessionPaths.values())
        .filter(paths => Array.from(paths).some(p => p.includes('checkout') || p.includes('cart'))).length;
      const purchasedSessions = paidOrders.length;

      const funnel = [
        { stage: 'Visitantes', value: visitedSessions, fill: 'hsl(var(--chart-1))' },
        { stage: 'Detalhe da Série', value: viewedDetailSessions, fill: 'hsl(var(--chart-2))' },
        { stage: 'Checkout', value: cartSessions, fill: 'hsl(var(--chart-3))' },
        { stage: 'Compra', value: purchasedSessions, fill: 'hsl(var(--chart-4))' },
      ];

      // ============ Análise por categoria/gênero ============
      const genreRevenue: Record<string, number> = {};
      const genreCount: Record<string, number> = {};
      purchasesData.forEach((p: any) => {
        const genre = p.series?.genre || 'Sem categoria';
        const amount = Number(p.orders?.total_amount || 0);
        genreRevenue[genre] = (genreRevenue[genre] || 0) + amount;
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
      const byCategory = Object.entries(genreCount).map(([name, count], i) => ({
        name,
        value: count,
        revenue: genreRevenue[name] || 0,
        fill: `hsl(var(--chart-${(i % 10) + 1}))`,
      })).sort((a, b) => b.value - a.value);

      // ============ Heatmap dia da semana × hora ============
      const heatmap: { day: number; hour: number; value: number }[] = [];
      const heatmapMap = new Map<string, number>();
      pageViews.forEach((p: any) => {
        const d = new Date(p.created_at);
        const key = `${d.getDay()}-${d.getHours()}`;
        heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
      });
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmap.push({ day, hour, value: heatmapMap.get(`${day}-${hour}`) || 0 });
        }
      }
      const maxHeatValue = Math.max(...heatmap.map(h => h.value), 1);

      // ============ ROI por UTM Source ============
      const utmStats: Record<string, { sessions: Set<string>; orders: number; revenue: number }> = {};
      pageViews.forEach((p: any) => {
        const src = p.utm_source || '(direct)';
        if (!utmStats[src]) utmStats[src] = { sessions: new Set(), orders: 0, revenue: 0 };
        if (p.session_id) utmStats[src].sessions.add(p.session_id);
      });
      paidOrders.forEach((o: any) => {
        const src = o.utm_source || '(direct)';
        if (!utmStats[src]) utmStats[src] = { sessions: new Set(), orders: 0, revenue: 0 };
        utmStats[src].orders += 1;
        utmStats[src].revenue += Number(o.total_amount || 0);
      });
      const byUtmSource = Object.entries(utmStats)
        .map(([source, s]) => ({
          source,
          visitas: s.sessions.size,
          vendas: s.orders,
          receita: s.revenue,
          conversao: s.sessions.size > 0 ? (s.orders / s.sessions.size) * 100 : 0,
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10);

      // ============ Device / Browser / OS ============
      const tally = (field: string) => {
        const map: Record<string, number> = {};
        pageViews.forEach((p: any) => {
          const v = p[field] || 'desconhecido';
          map[v] = (map[v] || 0) + 1;
        });
        return Object.entries(map).map(([name, value], i) => ({
          name, value, fill: `hsl(var(--chart-${(i % 10) + 1}))`,
        })).sort((a, b) => b.value - a.value);
      };
      const byDevice = tally('device_type');
      const byBrowser = tally('browser');
      const byOS = tally('os');

      // ============ Top referrers ============
      const refMap: Record<string, number> = {};
      pageViews.forEach((p: any) => {
        if (!p.referrer) return;
        try {
          const host = new URL(p.referrer).hostname.replace(/^www\./, '');
          refMap[host] = (refMap[host] || 0) + 1;
        } catch { /* skip */ }
      });
      const topReferrers = Object.entries(refMap)
        .map(([host, count]) => ({ host, count }))
        .sort((a, b) => b.count - a.count).slice(0, 10);

      // ============ Top páginas mais visitadas ============
      const pageMap: Record<string, number> = {};
      pageViews.forEach((p: any) => { pageMap[p.page_path] = (pageMap[p.page_path] || 0) + 1; });
      const topPages = Object.entries(pageMap)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views).slice(0, 10);

      // ============ Evolução mensal ============
      const months = eachMonthOfInterval({ start: filters.startDate, end: filters.endDate });
      const monthlyData = months.map((monthDate) => {
        const ms = startOfMonth(monthDate).getTime();
        const me = endOfMonth(monthDate).getTime();
        const visitas = pageViews.filter((p: any) => {
          const t = new Date(p.created_at).getTime();
          return t >= ms && t <= me;
        }).length;
        const vendas = paidOrders.filter((o: any) => {
          const t = new Date(o.created_at).getTime();
          return t >= ms && t <= me;
        }).length;
        const receita = paidOrders.filter((o: any) => {
          const t = new Date(o.created_at).getTime();
          return t >= ms && t <= me;
        }).reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
        return {
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          visitas, vendas, receita,
        };
      });

      // ============ Evolução diária (últimos 30 dias do range) ============
      const daysSpan = Math.min(60, Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (24 * 3600 * 1000)));
      const dailyData = daysSpan <= 60 ? eachDayOfInterval({
        start: filters.startDate,
        end: filters.endDate,
      }).map(d => {
        const ds = startOfDay(d).getTime();
        const de = endOfDay(d).getTime();
        const visitas = pageViews.filter((p: any) => {
          const t = new Date(p.created_at).getTime();
          return t >= ds && t <= de;
        }).length;
        const vendas = paidOrders.filter((o: any) => {
          const t = new Date(o.created_at).getTime();
          return t >= ds && t <= de;
        }).length;
        return {
          day: format(d, 'dd/MM', { locale: ptBR }),
          visitas, vendas,
        };
      }) : [];

      return {
        // KPIs
        pageViews: periodPageViews,
        sales: periodSales,
        revenue: periodRevenue,
        uniqueVisitors,
        avgTimeOnPage,
        ticketMedio,
        conversionRate,
        paidOrdersCount: paidOrders.length,
        // Tops
        topViewed,
        topPurchased,
        topReferrers,
        topPages,
        // Cortes
        funnel,
        byCategory,
        heatmap,
        maxHeatValue,
        byUtmSource,
        byDevice,
        byBrowser,
        byOS,
        // Tempo
        monthlyData,
        dailyData,
      };
    },
  });
};
