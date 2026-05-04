import { useEffect, useRef, useCallback } from "react";

interface WaveCanvasProps {
  intensity: number;
  mousePos: { x: number; y: number };
  particleMode: boolean;
  className?: string;
}

const WaveCanvas = ({ intensity, mousePos, particleMode, className }: WaveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; size: number; hue: number;
  }>>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    // Fade trail instead of full clear for ghosting effect
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);

    timeRef.current += 0.016;
    const t = timeRef.current;
    const amp = 25 + intensity * 150;
    const cy = h * 0.5;
    const mx = mousePos.x * w;
    const my = mousePos.y * h;

    // Wave layers - more layers, richer look
    const layers = [
      { freq: 0.005, speed: 0.6, alpha: 0.06, offset: 0, r: 80, g: 120, b: 255 },
      { freq: 0.008, speed: 1.0, alpha: 0.1, offset: 0.5, r: 100, g: 140, b: 255 },
      { freq: 0.012, speed: 1.4, alpha: 0.18, offset: 1.0, r: 120, g: 160, b: 255 },
      { freq: 0.006, speed: 1.8, alpha: 0.25, offset: 1.5, r: 140, g: 100, b: 240 },
      { freq: 0.015, speed: 2.2, alpha: 0.35, offset: 2.0, r: 100, g: 160, b: 255 },
      { freq: 0.01, speed: 0.9, alpha: 0.45, offset: 2.5, r: 130, g: 80, b: 220 },
      { freq: 0.02, speed: 2.8, alpha: 0.15, offset: 3.0, r: 160, g: 120, b: 255 },
    ];

    for (const layer of layers) {
      ctx.beginPath();
      ctx.lineWidth = 0.8 + intensity * 2.5;

      for (let x = 0; x < w; x += 2) {
        const dx = (mx - x) / w;
        const dy = (my - cy) / h;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = Math.max(0, 1 - mouseDist * 2.5) * 50 * intensity;

        const wave1 = Math.sin(x * layer.freq + t * layer.speed + layer.offset) * amp;
        const wave2 = Math.sin(x * layer.freq * 2.1 + t * layer.speed * 0.7 + layer.offset) * amp * 0.35;
        const wave3 = Math.sin(x * layer.freq * 0.4 + t * layer.speed * 1.5) * amp * 0.2;
        const noise = Math.sin(x * 0.04 + t * 2.5) * Math.sin(x * 0.015 + t * 0.8) * amp * 0.18 * intensity;

        const y = cy + wave1 + wave2 + wave3 + noise + mouseInfluence * Math.sin(t * 2.5);

        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }

      const { r, g, b, alpha } = layer;
      ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`;
      ctx.shadowBlur = 12 + intensity * 35;
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Central bright line - the core
    ctx.beginPath();
    ctx.lineWidth = 1.5 + intensity * 4;
    for (let x = 0; x < w; x += 1) {
      const wave = Math.sin(x * 0.01 + t * 1.0) * amp
        + Math.sin(x * 0.023 + t * 0.7 + 2.0) * amp * 0.4
        + Math.sin(x * 0.003 + t * 0.3) * amp * 0.15;
      const y = cy + wave;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.shadowColor = "rgba(120,180,255,0.95)";
    ctx.shadowBlur = 30 + intensity * 50;
    ctx.strokeStyle = "rgba(140,190,255,0.95)";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Particles - denser and more varied
    if (particleMode) {
      const spawnRate = intensity * 1.5;
      const spawnCount = Math.floor(spawnRate) + (Math.random() < (spawnRate % 1) ? 1 : 0);
      for (let s = 0; s < spawnCount; s++) {
        const spawnX = Math.random() * w;
        const spawnWave = Math.sin(spawnX * 0.01 + t) * amp + Math.sin(spawnX * 0.023 + t * 0.7 + 2) * amp * 0.4;
        particlesRef.current.push({
          x: spawnX,
          y: cy + spawnWave,
          vx: (Math.random() - 0.5) * 3,
          vy: -1.5 - Math.random() * 4 * intensity,
          life: 0,
          maxLife: 30 + Math.random() * 70,
          size: 0.8 + Math.random() * 3.5,
          hue: 210 + Math.random() * 70,
        });
      }
    }

    // Cap particles
    if (particlesRef.current.length > 300) {
      particlesRef.current = particlesRef.current.slice(-300);
    }

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.97;
      p.vx *= 0.99;
      p.life++;
      const progress = p.life / p.maxLife;
      if (progress >= 1) return false;
      const alpha = (1 - progress) * (1 - progress);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${alpha * 0.7})`;
      ctx.shadowColor = `hsla(${p.hue}, 85%, 70%, ${alpha * 0.4})`;
      ctx.shadowBlur = 10;
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      return true;
    });

    frameRef.current = requestAnimationFrame(draw);
  }, [intensity, mousePos, particleMode]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className || ""}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default WaveCanvas;
