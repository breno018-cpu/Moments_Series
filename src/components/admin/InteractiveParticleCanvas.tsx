import React, { useEffect, useRef } from "react";

export const InteractiveParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 140,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Generate grid dots
    const spacing = 38;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    interface Dot {
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      size: number;
      alpha: number;
    }

    const dots: Dot[] = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        dots.push({
          baseX: i * spacing,
          baseY: j * spacing,
          x: i * spacing,
          y: j * spacing,
          size: 1.2,
          alpha: 0.15,
        });
      }
    }

    let t = 0;
    const render = () => {
      t += 0.015;
      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Subtle radiant glow around mouse
      const glowGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        320
      );
      glowGrad.addColorStop(0, "rgba(225, 29, 72, 0.12)");
      glowGrad.addColorStop(0.5, "rgba(147, 51, 234, 0.05)");
      glowGrad.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = mouse.x - d.baseX;
        const dy = mouse.y - d.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let pushX = 0;
        let pushY = 0;
        let scale = 1;
        let alpha = 0.12;

        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius);
          const angle = Math.atan2(dy, dx);
          pushX = -Math.cos(angle) * force * 15;
          pushY = -Math.sin(angle) * force * 15;
          scale = 1 + force * 1.5;
          alpha = 0.18 + force * 0.65;
        }

        // Slight ambient wave
        const wave = Math.sin(t + (d.baseX + d.baseY) * 0.005) * 1.5;
        d.x = d.baseX + pushX;
        d.y = d.baseY + pushY + wave;

        ctx.fillStyle = alpha > 0.3 ? `rgba(244, 63, 94, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
};

export default InteractiveParticleCanvas;
