import { useEffect, useRef } from "react";

/**
 * Subtle biomedical backdrop: a slow molecular particle mesh with a faint
 * double-helix strand. Deliberately low contrast — texture, not decoration.
 */
export function MolecularField({ density = 46 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let points: P[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(18, Math.round((width * height) / 26000));
      points = Array.from({ length: Math.min(count, density) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: 0.8 + Math.random() * 1.4,
      }));
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      t += reduced ? 0 : 0.0032;

      // Helix strands
      const cx = width * 0.5;
      const amp = Math.min(width * 0.16, 150);
      for (let s = 0; s < 2; s++) {
        ctx.beginPath();
        for (let y = -20; y <= height + 20; y += 6) {
          const x = cx + Math.sin(y * 0.011 + t * 1.6 + s * Math.PI) * amp;
          if (y === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(56,189,248,${s === 0 ? 0.1 : 0.07})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 34) {
        const x1 = cx + Math.sin(y * 0.011 + t * 1.6) * amp;
        const x2 = cx + Math.sin(y * 0.011 + t * 1.6 + Math.PI) * amp;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = "rgba(56,189,248,0.045)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Particle mesh
      for (const p of points) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
        }
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = `rgba(125,180,230,${0.09 * (1 - d / 140)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(140,205,240,0.28)";
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
    />
  );
}
