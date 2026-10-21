import React, { Component, useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

class WorldCupEffectsBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('[WorldCupEffects] Suppressed canvas error:', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const RawWorldCupEffects = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const { data: settings } = useSiteSettings();

  const isCopaActive = isLoaded && settings ? settings.copa_theme_active === 'true' : false;
  const isHalloweenActive = isLoaded && settings ? settings.halloween_theme_active === 'true' : false;
  const isChristmasActive = isLoaded && settings ? settings.christmas_theme_active === 'true' : false;
  const isNewYearActive = isLoaded && settings ? settings.newyear_theme_active === 'true' : false;

  const isActive = isCopaActive || isHalloweenActive || isChristmasActive || isNewYearActive;
  const activeTheme = isCopaActive ? 'copa' 
                    : isHalloweenActive ? 'halloween' 
                    : isChristmasActive ? 'christmas' 
                    : isNewYearActive ? 'newyear' 
                    : null;

  useEffect(() => {
    // Em dispositivos móveis e iPhones, desativa animação de canvas contínua para garantir 120 FPS no scroll
    if (typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)) {
      return;
    }

    if (!isActive || !activeTheme) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch (e) {
      console.warn('[WorldCupEffects] canvas context error:', e);
      return;
    }
    if (!ctx) return;

    let animationId: number = 0;
    let width = Math.max(1, window.innerWidth || 800);
    let height = Math.max(1, window.innerHeight || 600);
    try {
      canvas.width = width;
      canvas.height = height;
    } catch {
      return;
    }

    const handleResize = () => {
      try {
        width = canvas.width = Math.max(1, window.innerWidth || 800);
        height = canvas.height = Math.max(1, window.innerHeight || 600);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('resize', handleResize);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedY: number;
      speedX: number;
      rotation: number;
      rotationSpeed: number;
      isSpecial: boolean;
      emoji: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.size = Math.max(2, Math.random() * 6 + 4);
        this.isSpecial = Math.random() < 0.15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.03;

        if (activeTheme === 'copa') {
          const colors = ['#22c55e', '#eab308', '#3b82f6', '#f59e0b'];
          this.color = colors[Math.floor(Math.random() * colors.length)];
          this.emoji = '';
        } else if (activeTheme === 'halloween') {
          const emojis = ['🎃', '👻', '🦇', '🕷️', '💀'];
          this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
          this.color = Math.random() < 0.5 ? '#f97316' : '#a855f7';
        } else if (activeTheme === 'christmas') {
          const emojis = ['❄️', '🎄', '🎁', '⭐', '🔔'];
          this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
          this.color = Math.random() < 0.5 ? '#ef4444' : '#22c55e';
        } else if (activeTheme === 'newyear') {
          const emojis = ['✨', '🥂', '🍾', '🎉', '⭐'];
          this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
          this.color = '#f59e0b';
        } else {
          this.color = '#ffffff';
          this.emoji = '';
        }

        this.speedY = Math.random() * 1.4 + 0.6;
        this.speedX = Math.random() * 0.5 - 0.25;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.y > height) {
          this.y = -30;
          this.x = Math.random() * width;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        try {
          c.save();
          c.translate(this.x, this.y);

          c.shadowColor = this.color;
          c.shadowBlur = 6;

          if (activeTheme === 'copa') {
            if (this.isSpecial) {
              c.beginPath();
              c.arc(0, 0, Math.max(1, this.size), 0, Math.PI * 2);
              c.fillStyle = '#ffffff';
              c.fill();
              c.lineWidth = 0.8;
              c.strokeStyle = '#0f172a';
              c.stroke();
              
              c.fillStyle = '#0f172a';
              c.beginPath();
              c.arc(0, 0, Math.max(0.5, this.size * 0.3), 0, Math.PI * 2);
              c.fill();
              
              for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const px = Math.cos(angle) * this.size * 0.65;
                const py = Math.sin(angle) * this.size * 0.65;
                c.beginPath();
                c.arc(px, py, Math.max(0.5, this.size * 0.22), 0, Math.PI * 2);
                c.fill();
              }
            } else {
              c.fillStyle = this.color;
              c.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
            }
          } else {
            c.font = `${this.size * 2.2}px Arial`;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(this.emoji, 0, 0);
          }
          c.restore();
        } catch {
          /* ignore particle render errors */
        }
      }
    }

    const maxParticles = activeTheme === 'copa' ? 16 : 8;
    const particles: Particle[] = Array.from({ length: maxParticles }, () => new Particle());

    const animate = () => {
      try {
        if (!document.hidden && width > 0 && height > 0) {
          ctx.clearRect(0, 0, width, height);
          particles.forEach((p) => {
            p.update();
            p.draw(ctx!);
          });
        }
      } catch (err) {
        console.warn('[WorldCupEffects] Particle animation halted safely:', err);
        return;
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, activeTheme]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 opacity-30 select-none"
    />
  );
};

export const WorldCupEffects = () => (
  <WorldCupEffectsBoundary>
    <RawWorldCupEffects />
  </WorldCupEffectsBoundary>
);
