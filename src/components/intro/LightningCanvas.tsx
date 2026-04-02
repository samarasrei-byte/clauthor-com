import { useEffect, useRef, useCallback } from "react";

interface LightningCanvasProps {
  active: boolean;
  onStrikeComplete?: () => void;
}

const LightningCanvas = ({ active, onStrikeComplete }: LightningCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const strikeCountRef = useRef(0);

  const drawLightning = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      depth: number
    ) => {
      if (depth <= 0) return;
      const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 80;
      const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 30;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      if (depth > 2 && Math.random() > 0.5) {
        const branchEndX = midX + (Math.random() - 0.5) * 120;
        const branchEndY = midY + Math.random() * 80;
        ctx.save();
        ctx.lineWidth = Math.max(0.5, ctx.lineWidth * 0.5);
        ctx.globalAlpha *= 0.6;
        drawLightning(ctx, midX, midY, branchEndX, branchEndY, depth - 2);
        ctx.restore();
      }

      drawLightning(ctx, startX, startY, midX, midY, depth - 1);
      drawLightning(ctx, midX, midY, endX, endY, depth - 1);
    },
    []
  );

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    let frame = 0;
    let flashAlpha = 0;
    let particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const spawnParticles = () => {
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 40 + Math.random() * 40,
          size: 1 + Math.random() * 3,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      frame++;

      // Flash on impact
      if (frame === 15 || frame === 25) {
        flashAlpha = 0.8;
        spawnParticles();
        strikeCountRef.current++;
      }

      // Lightning bolts
      if (frame >= 10 && frame <= 30 && frame % 3 === 0) {
        ctx.strokeStyle = `rgba(120, 180, 255, ${0.8 - (frame - 10) * 0.03})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(100, 160, 255, 0.9)";
        ctx.shadowBlur = 20;
        drawLightning(ctx, cx + (Math.random() - 0.5) * 40, 0, cx, cy, 5);
        ctx.shadowBlur = 0;
      }

      // Screen flash
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(140, 180, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        flashAlpha *= 0.85;
      }

      // Particles
      particles = particles.filter((p) => p.life > 0);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life--;
        const alpha = p.life / 80;
        ctx.beginPath();
        ctx.fillStyle = `rgba(140, 200, 255, ${alpha})`;
        ctx.shadowColor = "rgba(100, 160, 255, 0.5)";
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (frame < 120 || particles.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        onStrikeComplete?.();
      }
    };

    const timeout = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(animate);
    }, 800);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, drawLightning, onStrikeComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default LightningCanvas;
