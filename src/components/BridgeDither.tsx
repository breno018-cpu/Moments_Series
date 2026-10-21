import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BRIDGE_SRC = "/bridge-dither.png";
export const BRIDGE_REMOTE_SRC =
  "https://frameline.ai/a/screens/bridge-dither/bridge-dither.png?c=cp_N4TIA6has6Opkwj7";

export const RETICLE_MARK_LINES = Array.from({ length: 24 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
  const cx = 18.5;
  const cy = 18;
  const inner = 6.6;
  const outer = 16.4;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x1: round(cx + Math.cos(a) * inner),
    y1: round(cy + Math.sin(a) * inner),
    x2: round(cx + Math.cos(a) * outer),
    y2: round(cy + Math.sin(a) * outer),
  };
});

export function ReticleMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 37 36">
      {RETICLE_MARK_LINES.map((line, i) => (
        <line
          key={i}
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2.2"
          x1={line.x1}
          x2={line.x2}
          y1={line.y1}
          y2={line.y2}
        />
      ))}
    </svg>
  );
}

type Dot = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
};

export type DitherFieldProps = {
  src?: string;
  className?: string;
  cellSize?: number;
  disturbRadius?: number;
  onReady?: () => void;
};

class CanvasSafeBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn("[BridgeDither] Canvas error suppressed gracefully:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="absolute inset-0 bg-white" aria-hidden>
            <img
              src="/bridge-dither.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center opacity-85 select-none"
              draggable={false}
            />
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function RawDitherField({
  src = BRIDGE_SRC,
  className,
  cellSize = 3,
  disturbRadius = 150,
  onReady,
}: DitherFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const onReadyRef = useRef(onReady);

  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!canvas || !wrap || !img) {
      onReadyRef.current?.();
      return;
    }

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d", { alpha: true });
    } catch (e) {
      console.warn("[DitherField] Canvas context creation failed:", e);
    }
    if (!ctx) {
      onReadyRef.current?.();
      return;
    }

    let dots: Dot[] = [];
    let raf = 0;
    let running = true;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let targetX = -9999;
    let targetY = -9999;
    let hasPointer = false;
    let frameReady = false;
    let allowParticles = false;
    let canvasShowsArt = false;
    let readyFired = false;
    let dotSize = 2;
    let objectUrl: string | null = null;
    let artBitmap: ImageBitmap | HTMLImageElement | null = null;

    let rest: HTMLCanvasElement | null = null;
    let restCtx: CanvasRenderingContext2D | null = null;
    let sample: HTMLCanvasElement | null = null;
    let sampleCtx: CanvasRenderingContext2D | null = null;

    try {
      rest = document.createElement("canvas");
      restCtx = rest.getContext("2d", { alpha: false });
      sample = document.createElement("canvas");
      sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    } catch (e) {
      console.warn("[DitherField] Helper canvas init error:", e);
    }

    const fireReady = () => {
      if (readyFired) return;
      readyFired = true;
      try {
        onReadyRef.current?.();
      } catch {
        /* ignore */
      }
    };

    const syncImgFit = (frameW: number) => {
      try {
        if (frameW >= 1024) {
          img.style.objectFit = "cover";
          img.style.objectPosition = "center center";
        } else {
          img.style.objectFit = "contain";
          img.style.objectPosition = "center bottom";
        }
      } catch {
        /* ignore */
      }
    };

    const setCanvasVisible = (visible: boolean) => {
      try {
        canvasShowsArt = visible;
        canvas.style.opacity = visible ? "1" : "0";
        img.style.opacity = visible ? "0.2" : "0.85";
        if (visible) fireReady();
      } catch {
        /* ignore */
      }
    };

    const measureFrame = () => {
      try {
        const parent = wrap.parentElement;
        const parentRect = parent?.getBoundingClientRect();
        const nextW = Math.max(
          1,
          Math.floor(parentRect?.width || wrap.getBoundingClientRect().width || window.innerWidth || 800)
        );
        const nextH = Math.max(
          1,
          Math.floor(
            parentRect?.height ||
              wrap.getBoundingClientRect().height ||
              Math.min(window.innerHeight || 600, document.documentElement.clientHeight || 600)
          )
        );
        return { nextW, nextH };
      } catch {
        return { nextW: 1024, nextH: 768 };
      }
    };

    const blitRest = () => {
      try {
        if (!frameReady || !rest || rest.width <= 0 || rest.height <= 0 || !ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(rest, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        /* ignore canvas drawing errors gracefully */
      }
    };

    const sizeSurfaces = () => {
      try {
        const { nextW, nextH } = measureFrame();
        if (nextW <= 0 || nextH <= 0 || !isFinite(nextW) || !isFinite(nextH)) return;
        width = nextW;
        height = nextH;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        syncImgFit(width);

        wrap.style.width = "100%";
        wrap.style.height = "100%";
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (rest && restCtx) {
          rest.width = Math.floor(width * dpr);
          rest.height = Math.floor(height * dpr);
          restCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          restCtx.fillStyle = "#ffffff";
          restCtx.fillRect(0, 0, width, height);
        }
      } catch (err) {
        console.warn("[DitherField] sizeSurfaces error:", err);
      }
    };

    const bitmapSize = (bitmap: ImageBitmap | HTMLImageElement) => {
      try {
        if ("naturalWidth" in bitmap) {
          return { iw: bitmap.naturalWidth || 1, ih: bitmap.naturalHeight || 1 };
        }
        return { iw: bitmap.width || 1, ih: bitmap.height || 1 };
      } catch {
        return { iw: 1, ih: 1 };
      }
    };

    const rebuild = () => {
      try {
        sizeSurfaces();

        const bitmap = artBitmap;
        if (!bitmap || !restCtx || !rest) {
          dots = [];
          allowParticles = false;
          frameReady = false;
          setCanvasVisible(false);
          fireReady();
          return;
        }

        const { iw, ih } = bitmapSize(bitmap);
        if (iw <= 0 || ih <= 0 || width <= 0 || height <= 0) {
          dots = [];
          allowParticles = false;
          frameReady = false;
          setCanvasVisible(false);
          fireReady();
          return;
        }

        const fillWidth = width >= 1024;
        const scale = fillWidth ? width / iw : Math.min(width / iw, height / ih);
        const drawW = Math.max(1, Math.round(iw * scale));
        const drawH = Math.max(1, Math.round(ih * scale));
        const dx = Math.floor((width - drawW) / 2);
        const dy = fillWidth ? Math.floor((height - drawH) / 2) : Math.max(0, height - drawH);

        const step = Math.max(2, Math.round(cellSize));
        dotSize = step;

        restCtx.imageSmoothingEnabled = false;
        restCtx.drawImage(bitmap, 0, 0, iw, ih, dx, dy, drawW, drawH);

        if (isFinite(width) && width > 0) {
          const wash = restCtx.createLinearGradient(0, 0, width * 0.38, 0);
          wash.addColorStop(0, "rgba(255,255,255,0.55)");
          wash.addColorStop(0.55, "rgba(255,255,255,0.18)");
          wash.addColorStop(1, "rgba(255,255,255,0)");
          restCtx.fillStyle = wash;
          restCtx.fillRect(0, 0, width * 0.42, height);
        }

        frameReady = true;
        blitRest();
        setCanvasVisible(true);

        if (!sampleCtx || !sample) {
          dots = [];
          allowParticles = false;
          return;
        }

        sample.width = width;
        sample.height = height;
        sampleCtx.setTransform(1, 0, 0, 1, 0, 0);
        sampleCtx.drawImage(rest, 0, 0, rest.width, rest.height, 0, 0, width, height);

        let data: Uint8ClampedArray;
        try {
          data = sampleCtx.getImageData(0, 0, width, height).data;
        } catch {
          // If tainted or security error, gracefully show static background without crash
          dots = [];
          allowParticles = false;
          return;
        }

        const next: Dot[] = [];
        const x0 = Math.max(0, dx);
        const y0 = Math.max(0, dy);
        const x1 = Math.min(width, dx + drawW);
        const y1 = Math.min(height, dy + drawH);

        for (let y = y0; y < y1; y += step) {
          for (let x = x0; x < x1; x += step) {
            let sum = 0;
            let count = 0;
            for (let oy = 0; oy < step; oy++) {
              for (let ox = 0; ox < step; ox++) {
                const ix = Math.min(width - 1, x + ox);
                const iy = Math.min(height - 1, y + oy);
                const i = (iy * width + ix) * 4;
                sum +=
                  0.2126 * (data[i] ?? 255) +
                  0.7152 * (data[i + 1] ?? 255) +
                  0.0722 * (data[i + 2] ?? 255);
                count++;
              }
            }
            const lum = sum / Math.max(1, count);
            if (lum > 110) continue;

            next.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0 });
          }
        }

        dots = next;
        allowParticles = next.length > 0;
      } catch (error) {
        console.warn("[DitherField] field rebuild safely caught:", error);
        dots = [];
        allowParticles = false;
        frameReady = false;
        setCanvasVisible(false);
        fireReady();
      }
    };

    const syncPointer = (clientX: number, clientY: number) => {
      try {
        const rect = wrap.getBoundingClientRect();
        const inside =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;

        if (!inside) {
          hasPointer = false;
          targetX = -9999;
          targetY = -9999;
          return;
        }

        hasPointer = true;
        targetX = clientX - rect.left;
        targetY = clientY - rect.top;
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      syncPointer(event.clientX, event.clientY);
    };

    const onPointerLeaveWindow = () => {
      hasPointer = false;
      targetX = -9999;
      targetY = -9999;
    };

    const draw = () => {
      if (!running) return;
      raf = window.requestAnimationFrame(draw);
      if (!frameReady || !canvasShowsArt || !ctx) return;

      try {
        if (hasPointer) {
          pointerX += (targetX - pointerX) * 0.5;
          pointerY += (targetY - pointerY) * 0.5;
        } else {
          pointerX += (targetX - pointerX) * 0.14;
          pointerY += (targetY - pointerY) * 0.14;
        }

        blitRest();
        if (!allowParticles || dots.length === 0) return;

        const radius = disturbRadius;
        const radiusSq = radius * radius;
        const affectSq = (radius * 1.4) ** 2;
        const voidRadius = Math.max(14, radius * 0.36);
        const active: Dot[] = [];

        for (const dot of dots) {
          const bdx = dot.baseX - pointerX;
          const bdy = dot.baseY - pointerY;
          const baseDistSq = bdx * bdx + bdy * bdy;
          const moving = Math.abs(dot.vx) + Math.abs(dot.vy) > 0.025;
          const near = hasPointer && baseDistSq < affectSq;

          if (!near && !moving) {
            if (dot.x !== dot.baseX || dot.y !== dot.baseY) {
              dot.x = dot.baseX;
              dot.y = dot.baseY;
              dot.vx = 0;
              dot.vy = 0;
            }
            continue;
          }

          let forceX = 0;
          let forceY = 0;

          if (hasPointer) {
            const pdx = dot.x - pointerX;
            const pdy = dot.y - pointerY;
            const distSq = pdx * pdx + pdy * pdy;

            if (distSq < radiusSq) {
              const dist = Math.sqrt(distSq) || 0.0001;
              const nx = pdx / dist;
              const ny = pdy / dist;
              const t = 1 - dist / radius;
              const falloff = t * t * (3 - 2 * t);
              const push = voidRadius + falloff * (radius * 0.65);
              const extra = Math.max(0, push - dist);

              forceX = nx * (extra + falloff * 30);
              forceY = ny * (extra + falloff * 30);

              if (dist < voidRadius) {
                dot.x = pointerX + nx * voidRadius;
                dot.y = pointerY + ny * voidRadius;
                forceX += nx * (voidRadius - dist) * 2.2;
                forceY += ny * (voidRadius - dist) * 2.2;
              }
            }
          }

          const ax = (dot.baseX + forceX - dot.x) * 0.2;
          const ay = (dot.baseY + forceY - dot.y) * 0.2;
          dot.vx = (dot.vx + ax) * 0.75;
          dot.vy = (dot.vy + ay) * 0.75;
          dot.x += dot.vx;
          dot.y += dot.vy;
          active.push(dot);
        }

        if (active.length === 0) return;

        const clearPad = radius + voidRadius + dotSize * 2;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, clearPad, 0, Math.PI * 2);
        ctx.fill();

        for (const dot of active) {
          ctx.fillRect(dot.baseX - 1, dot.baseY - 1, dotSize + 2, dotSize + 2);
        }

        ctx.fillStyle = "#0a0a0a";
        for (const dot of active) {
          ctx.fillRect(dot.x, dot.y, dotSize, dotSize);
        }
      } catch (err) {
        console.warn("[DitherField] draw tick caught:", err);
      }
    };

    const revokeObjectUrl = () => {
      if (!objectUrl) return;
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }
      objectUrl = null;
    };

    const closeBitmap = () => {
      if (artBitmap && "close" in artBitmap && typeof artBitmap.close === "function") {
        try {
          artBitmap.close();
        } catch {
          /* ignore */
        }
      }
      artBitmap = null;
    };

    const waitForHtmlImage = (el: HTMLImageElement, url: string, cors: boolean) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const onLoad = () => {
          cleanup();
          resolve(el);
        };
        const onError = () => {
          cleanup();
          reject(new Error("image load failed"));
        };
        const cleanup = () => {
          el.removeEventListener("load", onLoad);
          el.removeEventListener("error", onError);
        };
        el.addEventListener("load", onLoad);
        el.addEventListener("error", onError);
        if (cors) el.crossOrigin = "anonymous";
        else el.removeAttribute("crossOrigin");
        el.src = url;
        if (el.complete && el.naturalWidth > 0) {
          cleanup();
          resolve(el);
        }
      });

    const loadArt = async () => {
      // 1. Tenta carregar imagem local primeiro
      try {
        const probe = new Image();
        probe.decoding = "async";
        await waitForHtmlImage(probe, src, false);
        if (!running) return;
        closeBitmap();
        artBitmap = probe;
        rebuild();
        return;
      } catch {
        /* fallback to remote */
      }

      // 2. Se falhar, tenta fetch
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const blob = await res.blob();
        if (!running) return;

        const bitmap = await createImageBitmap(blob);
        if (!running) {
          bitmap.close();
          return;
        }

        closeBitmap();
        artBitmap = bitmap;

        revokeObjectUrl();
        objectUrl = URL.createObjectURL(blob);
        img.src = objectUrl;

        rebuild();
        return;
      } catch (error) {
        console.warn("[DitherField] Fetch path failed, using display fallback", error);
      }

      // 3. Fallback final direto
      if (img.complete && img.naturalWidth > 0) {
        closeBitmap();
        artBitmap = img;
        rebuild();
      } else {
        fireReady();
      }
    };

    try {
      sizeSurfaces();
      setCanvasVisible(false);
      void loadArt();
    } catch (e) {
      console.warn("[DitherField] Init error:", e);
      fireReady();
    }

    const onResize = () => {
      rebuild();
    };

    let resizeObserver: ResizeObserver | null = null;
    try {
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          rebuild();
        });
        if (wrap.parentElement) resizeObserver.observe(wrap.parentElement);
        else resizeObserver.observe(wrap);
      }
    } catch {
      /* ignore */
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeaveWindow);
    document.addEventListener("mouseleave", onPointerLeaveWindow);
    window.addEventListener("resize", onResize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      revokeObjectUrl();
      closeBitmap();
      resizeObserver?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("blur", onPointerLeaveWindow);
      document.removeEventListener("mouseleave", onPointerLeaveWindow);
      window.removeEventListener("resize", onResize);
    };
  }, [src, cellSize, disturbRadius]);

  return (
    <div
      ref={wrapRef}
      className={cn("absolute inset-0 h-full w-full bg-white", className)}
      aria-hidden
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full select-none transition-opacity duration-1000 ease-in-out"
        style={{ objectFit: "cover", objectPosition: "center center", opacity: 0.85 }}
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full touch-none transition-opacity duration-1000 ease-in-out opacity-0"
      />
    </div>
  );
}

export function DitherField(props: DitherFieldProps) {
  return (
    <CanvasSafeBoundary>
      <RawDitherField {...props} />
    </CanvasSafeBoundary>
  );
}

const PROGRESSIVE_WHITE_STEPS = [
  { alpha: 0.72, from: "0%", to: "38%" },
  { alpha: 0.45, from: "8%", to: "52%" },
  { alpha: 0.28, from: "20%", to: "68%" },
  { alpha: 0.14, from: "36%", to: "84%" },
  { alpha: 0.06, from: "55%", to: "100%" },
] as const;

export function ProgressiveBlurEdge({
  edge,
  className,
}: {
  edge: "top" | "bottom";
  className?: string;
}) {
  const dir = edge === "top" ? "to bottom" : "to top";

  return (
    <div
      className={cn(
        "oasis-edge pointer-events-none absolute inset-x-0 z-0 w-full",
        edge === "top" ? "top-0" : "bottom-0",
        className
      )}
      aria-hidden
    >
      {PROGRESSIVE_WHITE_STEPS.map((step) => (
        <div
          key={`${edge}-${step.alpha}`}
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(255,255,255,${step.alpha})`,
            maskImage: `linear-gradient(${dir}, black ${step.from}, transparent ${step.to})`,
            WebkitMaskImage: `linear-gradient(${dir}, black ${step.from}, transparent ${step.to})`,
          }}
        />
      ))}
    </div>
  );
}
