import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useWishlist, useCurrentUser } from '@/hooks/useWishlist';
import { useSeries } from '@/hooks/useSeries';
import { useAnimes } from '@/hooks/useAnimes';
import { SeriesCard } from '@/components/SeriesCard';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Favoritos() {
  const userId = useCurrentUser();
  const navigate = useNavigate();
  const { data: wishlist, isLoading } = useWishlist();
  const { data: series } = useSeries();
  const { data: animes } = useAnimes();

  useEffect(() => {
    if (userId === null) {
      // wait initial load
    }
  }, [userId]);

  const items = useMemo(() => {
    if (!wishlist) return [];
    const all: any[] = [];
    wishlist.forEach((w) => {
      if (w.item_type === 'series') {
        const s = series?.find((x) => x.id === w.item_id);
        if (s) all.push(s);
      } else {
        const a = animes?.find((x) => x.id === w.item_id);
        if (a) all.push({ ...a, image_url: (a as any).image });
      }
    });
    return all;
  }, [wishlist, series, animes]);



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="app-container py-8 mt-16 sm:mt-20">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-7 w-7 fill-primary text-primary" />
          <h1 className="text-2xl sm:text-3xl font-black">Meus Favoritos</h1>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">Você ainda não favoritou nenhuma série.</p>
            <Link to="/">
              <Button>Explorar catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="catalog-grid">
            {items.map((item) => (
              <SeriesCard key={item.id} series={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
