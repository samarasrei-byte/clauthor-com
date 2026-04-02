import { useEffect, useRef, useCallback } from "react";

interface WaveCanvasProps {
  intensity: number; // 0-1, controls wave amplitude
  mousePos: { x: number; y: number };
  particleMode: boolean;
  glowColor?: string;
  className?: string;
}

const WaveCanvas = ({ intensity, mousePos, particleMode, glowColor = "120,160,255", className }: WaveCanvasProps) => {
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

    ctx.clearRect(0, 0, w, h);
    timeRef.current += 0.016;
    const t = timeRef.current;
    const amp = 30 + intensity * 120;
    const cy = h * 0.5;

    // Mouse influence
    const mx = mousePos.x * w;
    const my = mousePos.y * h;

    // Draw multiple wave layers
    const layers = [
      { freq: 0.008, speed: 1.2, alpha: 0.15, offset: 0, color: `rgba(${glowColor},` },
      { freq: 0.012, speed: 0.8, alpha: 0.25, offset: 0.5, color: `rgba(${glowColor},` },
      { freq: 0.006, speed: 1.6, alpha: 0.4, offset: 1.0, color: `rgba(${glowColor},` },
      { freq: 0.015, speed: 2.0, alpha: 0.6, offset: 1.5, color: `rgba(100,80,220,` },
      { freq: 0.01, speed: 1.0, alpha: 0.8, offset: 2.0, color: `rgba(${glowColor},` },
    ];

    for (const layer of layers) {
      ctx.beginPath();
      ctx.lineWidth = 1 + intensity * 2;

      for (let x = 0; x < w; x += 2) {
        const nx = x / w;
        // Mouse proximity influence
        const dx = (mx - x) / w;
        const dy = (my - cy) / h;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const mouseInfluence = Math.max(0, 1 - mouseDist * 3) * 40 * intensity;

        // Multiple harmonics
        const wave1 = Math.sin(x * layer.freq + t * layer.speed + layer.offset) * amp;
        const wave2 = Math.sin(x * layer.freq * 2.3 + t * layer.speed * 0.7 + layer.offset) * amp * 0.4;
        const wave3 = Math.sin(x * layer.freq * 0.5 + t * layer.speed * 1.3) * amp * 0.2;

        // Noise-like variation
        const noise = Math.sin(x * 0.05 + t * 3) * Math.sin(x * 0.02 + t) * amp * 0.15 * intensity;

        const y = cy + wave1 + wave2 + wave3 + noise + mouseInfluence * Math.sin(t * 2);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Glow effect via shadow
      ctx.shadowColor = `rgba(${glowColor},${layer.alpha})`;
      ctx.shadowBlur = 15 + intensity * 30;
      ctx.strokeStyle = `${layer.color}${layer.alpha})`;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Central bright line
    ctx.beginPath();
    ctx.lineWidth = 2 + intensity * 3;
    for (let x = 0; x < w; x += 1) {
      const wave = Math.sin(x * 0.01 + t * 1.0) * amp
        + Math.sin(x * 0.023 + t * 0.7 + 2.0) * amp * 0.4;
      const y = cy + wave;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.shadowColor = `rgba(${glowColor},0.9)`;
    ctx.shadowBlur = 25 + intensity * 40;
    ctx.strokeStyle = `rgba(${glowColor},0.9)`;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Particles emerging from wave
    if (particleMode && Math.random() < intensity * 0.8) {
      const spawnX = Math.random() * w;
      const spawnWave = Math.sin(spawnX * 0.01 + t) * amp + Math.sin(spawnX * 0.023 + t * 0.7 + 2) * amp * 0.4;
      particlesRef.current.push({
        x: spawnX,
        y: cy + spawnWave,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 3 * intensity,
        life: 0,
        maxLife: 40 + Math.random() * 60,
        size: 1 + Math.random() * 3,
        hue: 220 + Math.random() * 60,
      });
    }

    // Update & draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.98;
      p.life++;
      const progress = p.life / p.maxLife;
      if (progress >= 1) return false;
      const alpha = 1 - progress;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha * 0.8})`;
      ctx.shadowColor = `hsla(${p.hue}, 80%, 65%, ${alpha * 0.5})`;
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      return true;
    });

    frameRef.current = requestAnimationFrame(draw);
  }, [intensity, mousePos, particleMode, glowColor]);

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
