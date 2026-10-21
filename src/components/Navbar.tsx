import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Sparkles, Tv, Heart, Command, X, ChevronDown, Home, Film, Download, Menu, ShieldCheck, HelpCircle } from "lucide-react";
// ThemeToggle removed — single unified Glass Aurora theme
import { CartDrawer } from "./CartDrawer";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState, useRef, useEffect, useMemo } from "react";
import logo from "@/assets/logo.jpg";
import { useSeries } from "@/hooks/useSeries";
import { useAnimes } from "@/hooks/useAnimes";
import { useWishlist, useCurrentUser } from "@/hooks/useWishlist";
import { usePWA } from "@/hooks/usePWA";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";
import { optimizedImage } from "@/lib/image";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import trophyImg from "@/assets/trophy.jpg";
import ballImg from "@/assets/ball.jpg";

export const Navbar = () => {
  const navigate = useNavigate();
  const { isInstalled, promptInstall } = usePWA();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState<null | "series" | "animes">(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Exibe o site original sem decorações no carregamento inicial. 
    // Após 500ms, ativa suavemente a decoração da campanha comemorativa ativa.
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const { data: settings } = useSiteSettings();
  const copaActive = isLoaded && settings ? settings.copa_theme_active === 'true' : false;
  const halloweenActive = isLoaded && settings ? settings.halloween_theme_active === 'true' : false;
  const christmasActive = isLoaded && settings ? settings.christmas_theme_active === 'true' : false;
  const newyearActive = isLoaded && settings ? settings.newyear_theme_active === 'true' : false;

  const anyBannerActive = copaActive || halloweenActive || christmasActive || newyearActive;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('copa-theme', 'halloween-theme', 'christmas-theme', 'newyear-theme');
    
    if (copaActive) {
      root.classList.add('copa-theme');
    } else if (halloweenActive) {
      root.classList.add('halloween-theme');
    } else if (christmasActive) {
      root.classList.add('christmas-theme');
    } else if (newyearActive) {
      root.classList.add('newyear-theme');
    }

    if (anyBannerActive) {
      root.style.setProperty('--copa-banner-height', '28px');
    } else {
      root.style.setProperty('--copa-banner-height', '0px');
    }
  }, [copaActive, halloweenActive, christmasActive, newyearActive, anyBannerActive]);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const megaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchMouseEnter = () => {
    if (searchLeaveTimerRef.current) clearTimeout(searchLeaveTimerRef.current);
    setSearchOpen(true);
  };

  const handleSearchMouseLeave = () => {
    if (searchQuery.trim()) return;
    if (document.activeElement === searchInputRef.current) return;
    searchLeaveTimerRef.current = setTimeout(() => {
      if (!searchQuery.trim() && document.activeElement !== searchInputRef.current) {
        setSearchOpen(false);
      }
    }, 400);
  };

  const handleSearchBlur = () => {
    if (!searchQuery.trim()) {
      searchLeaveTimerRef.current = setTimeout(() => {
        setSearchOpen(false);
      }, 250);
    }
  };

  const { data: series = [] } = useSeries();
  const { data: animes = [] } = useAnimes();
  const userId = useCurrentUser();
  const { data: wishlist = [] } = useWishlist();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current === 5) {
      navigate("/auth");
      clickCountRef.current = 0;
    } else {
      navigate("/");
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2000);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const liveResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const s = series
      .filter((x) => x.title.toLowerCase().includes(q) || x.genre?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((x) => ({ ...x, _kind: "series" as const }));
    const a = animes
      .filter((x: any) => x.title.toLowerCase().includes(q) || x.genre?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((x: any) => ({ ...x, _kind: "anime" as const }));
    return [...s, ...a];
  }, [searchQuery, series, animes]);

  const seriesGenres = useMemo(() => {
    const set = new Map<string, number>();
    series.forEach((s) => {
      const g = (s.genre || "").trim();
      if (g) set.set(g, (set.get(g) || 0) + 1);
    });
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [series]);

  const animeGenres = useMemo(() => {
    const set = new Map<string, number>();
    animes.forEach((s: any) => {
      const g = (s.genre || "").trim();
      if (g) set.set(g, (set.get(g) || 0) + 1);
    });
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [animes]);

  const featuredSeries = useMemo(() => series.filter((s) => s.featured).slice(0, 3), [series]);
  const featuredAnimes = useMemo(() => animes.filter((a: any) => a.featured).slice(0, 3), [animes]);

  const openMega = (kind: "series" | "animes") => {
    if (megaTimerRef.current) clearTimeout(megaTimerRef.current);
    setMegaOpen(kind);
  };
  const closeMega = () => {
    megaTimerRef.current = setTimeout(() => setMegaOpen(null), 150);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm font-medium transition-colors px-3 py-2 rounded-full ${
      isActive
        ? "text-foreground bg-primary/10"
        : "text-foreground/65 hover:text-foreground hover:bg-foreground/5"
    }`;

  const isAnimesActive = typeof window !== "undefined" && window.location.pathname.startsWith("/animes");
  const isSeriesActive = typeof window !== "undefined" && window.location.pathname.startsWith("/series");

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-background/60 backdrop-blur-md border-b border-transparent"
        }`}
      >
        {copaActive && (
          <div className="bg-gradient-to-r from-emerald-600 via-yellow-500 to-blue-600 text-white text-[10px] sm:text-xs py-1 px-4 font-bold text-center tracking-widest flex items-center justify-center gap-3 select-none shadow-sm relative z-50 uppercase overflow-hidden">
            <img src={trophyImg} alt="Taça da Copa" className="h-4 w-auto object-contain rounded-sm" />
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              Rumo ao Hexa <span className="text-yellow-300">★</span> Torcida Moments 2026
            </span>
            <img src={ballImg} alt="Bola de Futebol" className="h-4 w-auto object-contain rounded-full" />
          </div>
        )}
        {halloweenActive && (
          <div className="bg-gradient-to-r from-purple-900 via-orange-600 to-zinc-950 text-white text-[10px] sm:text-xs py-1 px-4 font-bold text-center tracking-widest flex items-center justify-center gap-2 select-none shadow-sm relative z-50 uppercase overflow-hidden">
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              Portal das Sombras <span className="text-orange-400">★</span> Especial Temporada de Terror
            </span>
          </div>
        )}
        {christmasActive && (
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-emerald-700 text-white text-[10px] sm:text-xs py-1 px-4 font-bold text-center tracking-widest flex items-center justify-center gap-2 select-none shadow-sm relative z-50 uppercase overflow-hidden">
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              Boas Festas <span className="text-yellow-300">★</span> Moments Natalino
            </span>
          </div>
        )}
        {newyearActive && (
          <div className="bg-gradient-to-r from-zinc-900 via-yellow-600 to-amber-500 text-white text-[10px] sm:text-xs py-1 px-4 font-bold text-center tracking-widest flex items-center justify-center gap-2 select-none shadow-sm relative z-50 uppercase overflow-hidden">
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              Ano Novo 2027 <span className="text-white">★</span> Celebre o Novo Ciclo
            </span>
          </div>
        )}
        <div className="app-container h-16 sm:h-[72px] flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0 select-none"
          >
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden ring-1 ring-purple-500/30 group-hover:ring-purple-400/70 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300">
              <img src={logo} alt="Moments Séries" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-purple-200 transition-all">
                  MOMENTS
                </span>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 rounded shadow-sm">
                  SÉRIES
                </span>
              </div>
              <span className="text-[8px] text-slate-400 font-medium tracking-wider hidden sm:block mt-0.5 opacity-80">
                STREAMING PREMIUM
              </span>
            </div>
          </Link>

          {/* Nav links desktop com mega-menu */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <NavLink to="/" end className={navLinkClass}>
              Início
            </NavLink>

            {/* Séries com mega-menu */}
            <div
              className="relative"
              onMouseEnter={() => openMega("series")}
              onMouseLeave={closeMega}
            >
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full transition-colors ${
                  megaOpen === "series" || isSeriesActive
                    ? "text-foreground bg-primary/10"
                    : "text-foreground/65 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                Séries
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen === "series" ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Animes com mega-menu */}
            <div
              className="relative"
              onMouseEnter={() => openMega("animes")}
              onMouseLeave={closeMega}
            >
              <button
                onClick={() => navigate("/animes")}
                className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full transition-colors ${
                  megaOpen === "animes" || isAnimesActive
                    ? "text-foreground bg-accent/10"
                    : "text-foreground/65 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                Animes
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen === "animes" ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search + ações */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Busca expansível com animação ao se aproximar (hover/focus) */}
            <div
              className="relative flex items-center"
              onMouseEnter={handleSearchMouseEnter}
              onMouseLeave={handleSearchMouseLeave}
            >
              <form
                onSubmit={handleSearch}
                onClick={() => {
                  if (!searchOpen) setSearchOpen(true);
                }}
                className={cn(
                  "relative flex items-center h-10 rounded-full transition-all duration-300 ease-out overflow-hidden border",
                  searchOpen
                    ? "w-56 sm:w-80 bg-muted/80 border-primary/40 shadow-lg shadow-primary/10 ring-1 ring-primary/20 backdrop-blur-md"
                    : "w-10 bg-transparent border-transparent hover:bg-primary/10 cursor-pointer"
                )}
              >
                <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-muted-foreground">
                  <Search
                    className={cn(
                      "transition-all duration-300",
                      searchOpen ? "h-4 w-4 text-primary" : "h-[1.15rem] w-[1.15rem] text-foreground/80 group-hover:text-primary"
                    )}
                  />
                </div>

                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Buscar título, gênero..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchLeaveTimerRef.current) clearTimeout(searchLeaveTimerRef.current);
                    setSearchOpen(true);
                  }}
                  onBlur={handleSearchBlur}
                  className={cn(
                    "h-full bg-transparent text-sm pl-9 pr-9 outline-none border-none text-foreground placeholder:text-muted-foreground w-full transition-opacity duration-200",
                    searchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  )}
                  tabIndex={searchOpen ? 0 : -1}
                />

                {searchOpen && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    aria-label="Fechar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Preview ao vivo */}
              {searchOpen && searchQuery.trim() && liveResults.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-[22rem] sm:w-[26rem] bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-96 overflow-y-auto">
                    {liveResults.map((r: any) => (
                      <button
                        key={`${r._kind}-${r.id}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate(r._kind === "series" ? `/series/${r.id}` : `/animes`);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 w-full p-3 hover:bg-primary/10 transition-colors text-left"
                      >
                        <img
                          src={optimizedImage(r.image_url, { width: 120, quality: 60 })}
                          alt={r.title}
                          className="w-12 h-16 object-cover rounded-md flex-shrink-0 ring-1 ring-border"
                          onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate flex items-center gap-2">
                            {r.title}
                            {r._kind === "anime" && (
                              <Sparkles className="h-3 w-3 text-accent flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {r.genre} • R$ {r.price.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>Pressione Enter para ver todos</span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">⌘</kbd>
                      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">K</kbd>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Command palette trigger - desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="hidden lg:flex h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-full"
              aria-label="Comandos rápidos"
              title="⌘K para comandos rápidos"
            >
              <Command className="h-[1.05rem] w-[1.05rem]" />
            </Button>

            {/* Favoritos */}
            <Link
              to="/favoritos"
              className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all group"
              aria-label="Favoritos"
            >
              <Heart className="h-[1.15rem] w-[1.15rem] group-hover:fill-current transition-all" />
              {userId && wishlist.length > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                  {wishlist.length > 99 ? "99+" : wishlist.length}
                </Badge>
              )}
            </Link>

            {/* Botão de Instalar App (PWA) */}
            {!isInstalled && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                className="hidden lg:flex h-9 px-3 text-xs font-bold rounded-xl border-purple-500/30 text-purple-300 hover:bg-purple-500/20 gap-1.5 shadow-sm"
                title="Instalar aplicativo Moments na barra de atalhos"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Instalar App</span>
              </Button>
            )}

            <CartDrawer />

            {/* Menu Lateral Completo no Mobile */}
            <div className="md:hidden flex items-center">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-200 hover:text-white hover:bg-white/10 rounded-full"
                    aria-label="Abrir menu de navegação"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[86vw] sm:max-w-sm bg-[#0a0b10] border-white/10 text-white backdrop-blur-2xl p-6 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-6">
                    {/* Header da Gaveta */}
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="h-10 w-10 rounded-xl overflow-hidden ring-1 ring-purple-500/40">
                        <img src={logo} alt="Moments Séries" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                          MOMENTS <span className="text-[9px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">SÉRIES</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Streaming Premium</span>
                      </div>
                    </div>

                    {/* Links Principais */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Navegação</span>
                      <SheetClose asChild>
                        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all">
                          <Home className="w-4 h-4 text-purple-400" /> Início
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/?view=series" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all">
                          <Tv className="w-4 h-4 text-primary" /> Todas as Séries
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/animes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all">
                          <Sparkles className="w-4 h-4 text-accent" /> Animes & Animações
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/favoritos" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all">
                          <Heart className="w-4 h-4 text-rose-400" /> Meus Favoritos
                        </Link>
                      </SheetClose>
                    </div>

                    {/* Categorias Rápidas de Séries */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Gêneros Populares</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {seriesGenres.slice(0, 6).map(([genre, count]) => (
                          <SheetClose asChild key={genre}>
                            <Link
                              to={`/?search=${encodeURIComponent(genre)}`}
                              className="px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-slate-300 flex items-center justify-between"
                            >
                              <span className="truncate">{genre}</span>
                              <span className="text-[10px] text-muted-foreground">{count}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé da Gaveta */}
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    {!isInstalled && (
                      <Button
                        onClick={() => {
                          promptInstall();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold gap-2 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Instalar Aplicativo
                      </Button>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <SheetClose asChild>
                        <Link to="/faq" className="hover:text-white flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Ajuda & FAQ
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/termos" className="hover:text-white flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Termos de Uso
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mobile sub-nav — Início / Séries / Animes / Favoritos / Instalar */}
        <div className="md:hidden border-t border-border/40 bg-background/80 backdrop-blur-md">
          <div className="app-container flex items-center justify-around gap-1 py-1 px-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-foreground/70 hover:text-foreground"
                }`
              }
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </NavLink>
            <NavLink
              to="/?view=series"
              className={() =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  isSeriesActive
                    ? "text-primary bg-primary/10"
                    : "text-foreground/70 hover:text-foreground"
                }`
              }
            >
              <Tv className="h-4 w-4" />
              <span>Séries</span>
            </NavLink>
            <NavLink
              to="/animes"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "text-accent bg-accent/10"
                    : "text-foreground/70 hover:text-foreground"
                }`
              }
            >
              <Sparkles className="h-4 w-4" />
              <span>Animes</span>
            </NavLink>
            <NavLink
              to="/favoritos"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-foreground/70 hover:text-foreground"
                }`
              }
            >
              <Heart className="h-4 w-4" />
              <span>Favoritos</span>
            </NavLink>

            {!isInstalled && (
              <button
                type="button"
                onClick={promptInstall}
                className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] sm:text-xs font-bold text-purple-400 bg-purple-500/15 rounded-lg hover:bg-purple-500/25 transition-all border border-purple-500/30"
                title="Adicionar Moments à tela de início"
              >
                <Download className="h-4 w-4" />
                <span>App</span>
              </button>
            )}
          </div>
        </div>

        {/* MEGA MENU - Séries */}
        {megaOpen === "series" && (
          <div
            onMouseEnter={() => openMega("series")}
            onMouseLeave={closeMega}
            className="absolute left-0 right-0 top-full bg-background/95 backdrop-blur-md border-b border-border/50 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="app-container py-8 grid grid-cols-12 gap-8">
              <div className="col-span-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <Tv className="h-3.5 w-3.5" /> Categorias
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {seriesGenres.map(([g, count]) => (
                    <Link
                      key={g}
                      to={`/?search=${encodeURIComponent(g)}`}
                      onClick={() => setMegaOpen(null)}
                      className="text-sm text-foreground/75 hover:text-primary transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate">{g}</span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary">{count}</span>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/"
                  onClick={() => setMegaOpen(null)}
                  className="mt-4 inline-flex items-center text-xs font-semibold text-primary hover:underline"
                >
                  Ver catálogo completo →
                </Link>
              </div>
              <div className="col-span-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <Film className="h-3.5 w-3.5" /> Em destaque
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {featuredSeries.length > 0 ? featuredSeries.map((s) => (
                    <Link
                      key={s.id}
                      to={`/series/${s.id}`}
                      onClick={() => setMegaOpen(null)}
                      className="group relative aspect-video rounded-lg overflow-hidden ring-1 ring-border hover:ring-primary transition-all shadow-md hover:shadow-xl hover:shadow-primary/30"
                    >
                      <img src={optimizedImage(s.image_url, { width: 400, quality: 65 })} alt={s.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs font-bold truncate">{s.title}</p>
                        <p className="text-[10px] text-primary font-semibold">R$ {s.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-muted-foreground col-span-3">Nenhum destaque disponível.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEGA MENU - Animes */}
        {megaOpen === "animes" && (
          <div
            onMouseEnter={() => openMega("animes")}
            onMouseLeave={closeMega}
            className="absolute left-0 right-0 top-full bg-background/95 backdrop-blur-md border-b border-border/50 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="app-container py-8 grid grid-cols-12 gap-8">
              <div className="col-span-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Gêneros
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {animeGenres.length > 0 ? animeGenres.map(([g, count]) => (
                    <Link
                      key={g}
                      to={`/animes?search=${encodeURIComponent(g)}`}
                      onClick={() => setMegaOpen(null)}
                      className="text-sm text-foreground/75 hover:text-accent transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate">{g}</span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-accent">{count}</span>
                    </Link>
                  )) : (
                    <p className="text-sm text-muted-foreground col-span-2">Em breve!</p>
                  )}
                </div>
                <Link
                  to="/animes"
                  onClick={() => setMegaOpen(null)}
                  className="mt-4 inline-flex items-center text-xs font-semibold text-accent hover:underline"
                >
                  Ver catálogo de animes →
                </Link>
              </div>
              <div className="col-span-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Lançamentos</h3>
                <div className="grid grid-cols-3 gap-4">
                  {featuredAnimes.length > 0 ? featuredAnimes.map((a: any) => (
                    <Link
                      key={a.id}
                      to="/animes"
                      onClick={() => setMegaOpen(null)}
                      className="group relative aspect-video rounded-lg overflow-hidden ring-1 ring-border hover:ring-accent transition-all shadow-md hover:shadow-xl hover:shadow-accent/30"
                    >
                      <img src={optimizedImage(a.image_url, { width: 400, quality: 65 })} alt={a.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs font-bold truncate">{a.title}</p>
                        <p className="text-[10px] text-accent font-semibold">R$ {a.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  )) : (
                    <div className="col-span-3 py-8 text-center text-sm text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-accent/40" />
                      Novos animes chegando em breve!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <CommandPalette />
    </>
  );
};

export default Navbar;
