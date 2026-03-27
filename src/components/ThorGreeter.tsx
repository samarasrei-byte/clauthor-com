import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import thorPhoto from "@/assets/kaelis-ai.png";

const THOR_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const STORAGE_KEY = "thor_greeter_seen_v3";
const PROACTIVE_INTERVAL = 45_000;

interface ThorMessage {
  role: "user" | "assistant";
  content: string;
}

/* ═══════════════════════════════════════════════════
   QUANTUM NEURAL CORE — Ultra-futuristic holographic engine
   Multi-layer particle systems, plasma fields, DNA helixes
   ═══════════════════════════════════════════════════ */
const NeuralCore = ({ isSpeaking, size = 240 }: { isSpeaking: boolean; size?: number }) => {
  const center = size / 2;
  const r = size / 2 - 30;
  const faceR = r * 0.55;

  const describeArc = (cx: number, cy: number, radius: number, startDeg: number, endDeg: number) => {
    const s = (startDeg - 90) * Math.PI / 180;
    const e = (endDeg - 90) * Math.PI / 180;
    const la = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx + radius * Math.cos(s)} ${cy + radius * Math.sin(s)} A ${radius} ${radius} 0 ${la} 1 ${cx + radius * Math.cos(e)} ${cy + radius * Math.sin(e)}`;
  };

  // ── Quantum particle field — floating energy particles ──
  const quantumParticles = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = faceR + 15 + Math.random() * (r - faceR + 30);
      return {
        x: center + Math.cos(angle) * dist,
        y: center + Math.sin(angle) * dist,
        size: 0.5 + Math.random() * 2.5,
        speed: 3 + Math.random() * 8,
        delay: Math.random() * 5,
        glow: i % 4 === 0,
        drift: (Math.random() - 0.5) * 30,
        driftY: (Math.random() - 0.5) * 30,
      };
    });
  }, [size, center, faceR, r]);

  // ── DNA double helix orbiting particles ──
  const dnaHelix = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const t = (i / 40) * Math.PI * 4; // 2 full turns
      const helixR = r - 5;
      return {
        angle1: (i / 40) * 360,
        angle2: (i / 40) * 360 + 180,
        r: helixR,
        offset: Math.sin(t) * 12,
        size: 1.2 + Math.abs(Math.sin(t)) * 1.5,
      };
    });
  }, [r]);

  // ── Hexagonal grid with depth ──
  const hexGrid = useMemo(() => {
    const pts: { x: number; y: number; dist: number }[] = [];
    const sp = 16;
    for (let row = -10; row <= 10; row++) {
      for (let col = -10; col <= 10; col++) {
        const x = center + col * sp + (row % 2 ? sp / 2 : 0);
        const y = center + row * sp * 0.866;
        const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (dist < r + 30 && dist > faceR + 12) pts.push({ x, y, dist });
      }
    }
    return pts;
  }, [size, center, r, faceR]);

  // ── Multi-layer data rings ──
  const dataRings = useMemo(() => [
    { r: faceR + 8, segments: [{ s: 0, e: 45 }, { s: 60, e: 130 }, { s: 150, e: 200 }, { s: 230, e: 310 }, { s: 325, e: 355 }], w: 2.5, speed: 20, dir: 1 },
    { r: faceR + 18, segments: [{ s: 15, e: 70 }, { s: 95, e: 175 }, { s: 195, e: 260 }, { s: 285, e: 345 }], w: 1.8, speed: 30, dir: -1 },
    { r: r - 10, segments: [{ s: 10, e: 80 }, { s: 100, e: 160 }, { s: 200, e: 290 }, { s: 310, e: 350 }], w: 1.2, speed: 40, dir: 1 },
    { r: r + 4, segments: [{ s: 0, e: 50 }, { s: 70, e: 170 }, { s: 190, e: 250 }, { s: 280, e: 360 }], w: 0.8, speed: 55, dir: -1 },
    { r: r + 18, segments: [{ s: 20, e: 90 }, { s: 120, e: 210 }, { s: 240, e: 340 }], w: 0.5, speed: 70, dir: 1 },
    { r: r + 28, segments: [{ s: 5, e: 60 }, { s: 90, e: 180 }, { s: 200, e: 290 }, { s: 310, e: 355 }], w: 0.3, speed: 90, dir: -1 },
  ], [r, faceR]);

  // ── Precision scope ticks ──
  const ticks = useMemo(() => {
    return Array.from({ length: 180 }, (_, i) => {
      const angle = (i / 180) * Math.PI * 2;
      const isMajor = i % 15 === 0;
      const isMid = i % 5 === 0;
      const inner = r + 1;
      const outer = r + (isMajor ? 16 : isMid ? 9 : 3);
      return { x1: center + Math.cos(angle) * inner, y1: center + Math.sin(angle) * inner, x2: center + Math.cos(angle) * outer, y2: center + Math.sin(angle) * outer, isMajor, isMid };
    });
  }, [size, center, r]);

  // ── Orbiting data nodes with connections ──
  const orbitNodes = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      orbit: faceR + 12 + (i % 5) * ((r - faceR + 20) / 5),
      startAngle: (i / 20) * 360,
      speed: 6 + i * 2.5,
      size: 1 + (i % 4) * 0.8,
      hasTrail: i % 2 === 0,
      glow: i % 3 === 0,
    }));
  }, [r, faceR]);

  // ── Energy beams — connecting face to outer ring ──
  const energyBeams = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      return {
        x1: center + Math.cos(angle) * (faceR + 5),
        y1: center + Math.sin(angle) * (faceR + 5),
        x2: center + Math.cos(angle) * (r + 20),
        y2: center + Math.sin(angle) * (r + 20),
        angle: (i / 8) * 360,
      };
    });
  }, [center, faceR, r]);

  return (
    <div className="absolute inset-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <clipPath id="face-clip"><circle cx={center} cy={center} r={faceR} /></clipPath>
          <radialGradient id="plasma-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.15" />
            <stop offset="60%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.6" />
            <stop offset="50%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.8" />
            <stop offset="70%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
          </linearGradient>
          <filter id="quantum-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="particle-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Plasma field background ── */}
        <motion.circle
          cx={center} cy={center} r={r + 35}
          fill="url(#plasma-glow)"
          animate={isSpeaking ? { r: [r + 35, r + 45, r + 35], opacity: [0.6, 1, 0.6] } : { opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Deep hex grid with depth-based opacity ── */}
        {hexGrid.map((pt, i) => {
          const normDist = (pt.dist - faceR) / (r + 30 - faceR);
          return (
            <motion.rect
              key={`hx-${i}`}
              x={pt.x - 0.8} y={pt.y - 0.8}
              width="1.6" height="1.6"
              rx="0.2"
              fill={i % 7 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
              animate={isSpeaking ? {
                opacity: [0.02, 0.08 + (1 - normDist) * 0.2, 0.02],
                scale: [1, 1.5, 1],
              } : {
                opacity: [0.01, 0.03 + (1 - normDist) * 0.04, 0.01],
              }}
              transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          );
        })}

        {/* ── Energy beams — pulsing connections ── */}
        {energyBeams.map((beam, i) => (
          <motion.line
            key={`beam-${i}`}
            x1={beam.x1} y1={beam.y1} x2={beam.x2} y2={beam.y2}
            stroke="hsl(var(--accent-violet))"
            strokeWidth="0.3"
            strokeDasharray="3 8"
            animate={isSpeaking ? {
              strokeOpacity: [0.02, 0.15, 0.02],
              strokeDashoffset: [0, -20],
            } : {
              strokeOpacity: [0.01, 0.04, 0.01],
            }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* ── Precision scope ticks — 180 marks ── */}
        {ticks.map((t, i) => (
          <motion.line
            key={`t-${i}`}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
            strokeWidth={t.isMajor ? "1.5" : t.isMid ? "0.7" : "0.25"}
            animate={isSpeaking && t.isMajor ? {
              strokeOpacity: [0.3, 0.9, 0.3],
            } : {
              strokeOpacity: t.isMajor ? 0.4 : t.isMid ? 0.12 : 0.04,
            }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.01 }}
          />
        ))}

        {/* ── Multi-layer data rings ── */}
        {dataRings.map((ring, ri) => (
          <motion.g
            key={`ring-${ri}`}
            style={{ transformOrigin: `${center}px ${center}px` }}
            animate={{ rotate: ring.dir * 360 }}
            transition={{ duration: ring.speed, repeat: Infinity, ease: "linear" }}
          >
            {ring.segments.map((seg, si) => (
              <motion.path
                key={`seg-${ri}-${si}`}
                d={describeArc(center, center, ring.r, seg.s, seg.e)}
                fill="none"
                stroke={ri <= 1 ? "url(#ring-grad)" : ri % 2 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
                strokeWidth={ring.w}
                strokeLinecap="round"
                animate={isSpeaking ? {
                  strokeOpacity: [0.15, 0.55 + ri * 0.03, 0.15],
                } : {
                  strokeOpacity: 0.08 + (5 - ri) * 0.03,
                }}
                transition={{ duration: 1.2 + si * 0.3, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
            {/* Endpoint nodes on first 2 rings */}
            {ri < 2 && ring.segments.map((seg, si) => {
              const endRad = (seg.e - 90) * Math.PI / 180;
              const dx = center + ring.r * Math.cos(endRad);
              const dy = center + ring.r * Math.sin(endRad);
              return (
                <motion.g key={`node-${ri}-${si}`}>
                  <motion.circle cx={dx} cy={dy} r={ri === 0 ? 3 : 2} fill="none"
                    stroke="hsl(var(--accent-cyan))" strokeWidth="0.8"
                    animate={{ opacity: isSpeaking ? [0.3, 0.8, 0.3] : [0.1, 0.2, 0.1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: si * 0.15 }}
                  />
                  <circle cx={dx} cy={dy} r={1} fill="hsl(var(--accent-cyan))" opacity={isSpeaking ? 0.6 : 0.15} />
                </motion.g>
              );
            })}
          </motion.g>
        ))}

        {/* ── DNA double helix orbiting ── */}
        <motion.g
          style={{ transformOrigin: `${center}px ${center}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          {dnaHelix.map((h, i) => {
            const rad1 = (h.angle1 - 90) * Math.PI / 180;
            const rad2 = (h.angle2 - 90) * Math.PI / 180;
            const x1 = center + (h.r + h.offset) * Math.cos(rad1);
            const y1 = center + (h.r + h.offset) * Math.sin(rad1);
            const x2 = center + (h.r - h.offset) * Math.cos(rad2);
            const y2 = center + (h.r - h.offset) * Math.sin(rad2);
            return (
              <motion.g key={`dna-${i}`}>
                <circle cx={x1} cy={y1} r={h.size * 0.6} fill="hsl(var(--accent-violet))"
                  opacity={isSpeaking ? 0.5 : 0.12} filter="url(#particle-glow)" />
                <circle cx={x2} cy={y2} r={h.size * 0.5} fill="hsl(var(--accent-cyan))"
                  opacity={isSpeaking ? 0.4 : 0.08} filter="url(#particle-glow)" />
                {i % 4 === 0 && (
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="hsl(var(--accent-violet))" strokeWidth="0.3"
                    strokeOpacity={isSpeaking ? 0.2 : 0.04} strokeDasharray="1 3" />
                )}
              </motion.g>
            );
          })}
        </motion.g>

        {/* ── Corner bracket HUD frames — enhanced ── */}
        {[
          { x: center - r * 0.72, y: center - r * 0.72, rot: 0 },
          { x: center + r * 0.72, y: center - r * 0.72, rot: 90 },
          { x: center + r * 0.72, y: center + r * 0.72, rot: 180 },
          { x: center - r * 0.72, y: center + r * 0.72, rot: 270 },
        ].map((c, i) => (
          <g key={`br-${i}`} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
            <line x1="0" y1="0" x2="22" y2="0" stroke="hsl(var(--accent-violet))" strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1="0" y1="0" x2="0" y2="22" stroke="hsl(var(--accent-violet))" strokeWidth="1.5" strokeOpacity="0.5" />
            <rect x="0" y="0" width="3" height="3" fill="hsl(var(--accent-cyan))" fillOpacity="0.5" rx="0.5" />
            <motion.circle cx="0" cy="0" r="5" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="0.3"
              animate={{ strokeOpacity: [0.1, 0.3, 0.1], r: [5, 7, 5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
          </g>
        ))}

        {/* ── Face boundary — double ring with dashes ── */}
        <circle cx={center} cy={center} r={faceR + 1} fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="0.3" strokeOpacity="0.15" strokeDasharray="1 3" />
        <motion.circle
          cx={center} cy={center} r={faceR + 4}
          fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="1"
          strokeDasharray="6 3 1 3"
          animate={isSpeaking ? {
            strokeOpacity: [0.15, 0.5, 0.15],
            r: [faceR + 3, faceR + 6, faceR + 3],
          } : { strokeOpacity: 0.08 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Circular waveform EQ — 96 precision bars ── */}
        {Array.from({ length: 96 }).map((_, i) => {
          const angle = (i / 96) * Math.PI * 2 - Math.PI / 2;
          const baseR = faceR + 7;
          const x1 = center + Math.cos(angle) * baseR;
          const y1 = center + Math.sin(angle) * baseR;
          const isAccent = i % 12 === 0;
          const isMid = i % 6 === 0;
          return (
            <motion.line
              key={`eq-${i}`}
              x1={x1} y1={y1}
              x2={center + Math.cos(angle) * (baseR + 2)}
              y2={center + Math.sin(angle) * (baseR + 2)}
              stroke={isAccent ? "hsl(var(--accent-cyan))" : isMid ? "hsl(var(--accent-violet))" : "hsl(var(--accent-violet))"}
              strokeWidth={isAccent ? "2" : isMid ? "1.5" : "1"}
              strokeLinecap="butt"
              animate={isSpeaking ? {
                x2: [
                  center + Math.cos(angle) * (baseR + 2),
                  center + Math.cos(angle) * (baseR + 4 + Math.random() * 22),
                  center + Math.cos(angle) * (baseR + 1 + Math.random() * 8),
                  center + Math.cos(angle) * (baseR + 3 + Math.random() * 18),
                  center + Math.cos(angle) * (baseR + 2),
                ],
                y2: [
                  center + Math.sin(angle) * (baseR + 2),
                  center + Math.sin(angle) * (baseR + 4 + Math.random() * 22),
                  center + Math.sin(angle) * (baseR + 1 + Math.random() * 8),
                  center + Math.sin(angle) * (baseR + 3 + Math.random() * 18),
                  center + Math.sin(angle) * (baseR + 2),
                ],
                strokeOpacity: [0.25, 0.9, 0.35, 0.95, 0.25],
              } : {
                strokeOpacity: [0.04, 0.1, 0.04],
              }}
              transition={{
                duration: isSpeaking ? 0.12 + Math.random() * 0.2 : 3,
                repeat: Infinity,
                delay: i * 0.005,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* ── Quantum floating particles with various shapes ── */}
        {quantumParticles.map((p, i) => (
          <motion.g key={`qp-${i}`} filter={p.glow ? "url(#particle-glow)" : undefined}
            style={{ willChange: "transform" }}
          >
            {p.type === 0 && (
              <motion.circle cx={p.x} cy={p.y} r={p.size}
                fill={i % 3 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
                animate={{
                  cx: [p.x, p.x + p.drift, p.x - p.drift * 0.5, p.x],
                  cy: [p.y, p.y + p.driftY, p.y - p.driftY * 0.5, p.y],
                  opacity: isSpeaking ? [0.1, 0.7, 0.15, 0.6, 0.1] : [0.02, 0.08, 0.02],
                }}
                transition={{ duration: p.speed, repeat: Infinity, delay: p.delay }}
              />
            )}
            {p.type === 1 && (
              <motion.rect x={p.x - p.size} y={p.y - p.size} width={p.size * 2} height={p.size * 2}
                fill="hsl(var(--accent-cyan))" rx="0.3"
                style={{ transform: `rotate(45deg)`, transformOrigin: `${p.x}px ${p.y}px` }}
                animate={{
                  x: [p.x - p.size, p.x - p.size + p.drift],
                  y: [p.y - p.size, p.y - p.size + p.driftY],
                  opacity: isSpeaking ? [0.05, 0.5, 0.05] : [0.01, 0.06, 0.01],
                }}
                transition={{ duration: p.speed, repeat: Infinity, delay: p.delay }}
              />
            )}
            {p.type === 2 && (
              <motion.circle cx={p.x} cy={p.y} r={p.size + 1}
                fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="0.5"
                animate={{
                  cx: [p.x, p.x + p.drift * 0.7],
                  cy: [p.y, p.y + p.driftY * 0.7],
                  opacity: isSpeaking ? [0.05, 0.4, 0.05] : [0.02, 0.06, 0.02],
                  r: [p.size, p.size + 2, p.size],
                }}
                transition={{ duration: p.speed, repeat: Infinity, delay: p.delay }}
              />
            )}
            {p.type === 3 && (
              <motion.g
                animate={{
                  opacity: isSpeaking ? [0.05, 0.45, 0.05] : [0.01, 0.05, 0.01],
                }}
                transition={{ duration: p.speed, repeat: Infinity, delay: p.delay }}
              >
                <line x1={p.x - p.size} y1={p.y} x2={p.x + p.size} y2={p.y} stroke="hsl(var(--accent-cyan))" strokeWidth="0.4" />
                <line x1={p.x} y1={p.y - p.size} x2={p.x} y2={p.y + p.size} stroke="hsl(var(--accent-cyan))" strokeWidth="0.4" />
              </motion.g>
            )}
            {p.type === 4 && (
              <motion.polygon
                points={`${p.x},${p.y - p.size * 1.2} ${p.x - p.size},${p.y + p.size * 0.7} ${p.x + p.size},${p.y + p.size * 0.7}`}
                fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="0.4"
                animate={{
                  opacity: isSpeaking ? [0.05, 0.5, 0.05] : [0.01, 0.05, 0.01],
                }}
                transition={{ duration: p.speed, repeat: Infinity, delay: p.delay }}
              />
            )}
          </motion.g>
        ))}

        {/* ── Orbiting data nodes with trails ── */}
        {orbitNodes.map((p, i) => (
          <motion.g key={`on-${i}`} style={{ transformOrigin: `${center}px ${center}px` }}
            animate={{ rotate: [p.startAngle, p.startAngle + 360] }}
            transition={{ duration: p.speed, repeat: Infinity, ease: "linear" }}
          >
            <circle cx={center + p.orbit} cy={center} r={p.size}
              fill={i % 3 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
              opacity={isSpeaking ? 0.7 : 0.15}
              filter={p.glow ? "url(#particle-glow)" : undefined}
            />
            {p.hasTrail && (
              <line
                x1={center + p.orbit - 10} y1={center}
                x2={center + p.orbit} y2={center}
                stroke={i % 3 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
                strokeWidth="0.6" strokeOpacity={isSpeaking ? 0.25 : 0.05}
              />
            )}
          </motion.g>
        ))}

        {/* ── Scanning sweep — double radar ── */}
        <motion.g style={{ transformOrigin: `${center}px ${center}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <line x1={center} y1={center} x2={center} y2={center - r - 15} stroke="hsl(var(--accent-cyan))" strokeWidth="0.5" strokeOpacity="0.12" />
          <path d={describeArc(center, center, r * 0.7, -35, 0)} fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="14" strokeOpacity="0.025" />
        </motion.g>
        <motion.g style={{ transformOrigin: `${center}px ${center}px` }}
          animate={{ rotate: -360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        >
          <line x1={center} y1={center} x2={center} y2={center + r + 10} stroke="hsl(var(--accent-violet))" strokeWidth="0.3" strokeOpacity="0.08" />
          <path d={describeArc(center, center, r * 0.5, 170, 195)} fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="10" strokeOpacity="0.02" />
        </motion.g>

        {/* ── HUD telemetry text ── */}
        <text x={center + r + 22} y={center - 14} fill="hsl(var(--accent-violet))" fontSize="4.5" fontFamily="monospace" opacity="0.3" letterSpacing="2">QUANTUM</text>
        <text x={center + r + 22} y={center - 4} fill="hsl(var(--accent-cyan))" fontSize="7" fontFamily="monospace" opacity="0.45" fontWeight="bold">
          {isSpeaking ? "STREAM" : "READY"}
        </text>
        <motion.text x={center + r + 22} y={center + 7} fill="hsl(var(--accent-violet))" fontSize="4" fontFamily="monospace"
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {isSpeaking ? "████████" : "▯▯▯█▯▯▯▯"}
        </motion.text>
        <text x={center + r + 22} y={center + 16} fill="hsl(var(--accent-cyan))" fontSize="3.5" fontFamily="monospace" opacity="0.2">v4.2.0</text>

        <text x={center - r - 62} y={center - 10} fill="hsl(var(--accent-violet))" fontSize="4" fontFamily="monospace" opacity="0.2" letterSpacing="1">NEURAL</text>
        <motion.text x={center - r - 62} y={center + 1} fill="hsl(var(--accent-cyan))" fontSize="6" fontFamily="monospace"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >99.2%</motion.text>
        <text x={center - r - 62} y={center + 11} fill="hsl(var(--accent-violet))" fontSize="3.5" fontFamily="monospace" opacity="0.15">LATENCY 12ms</text>
      </svg>
    </div>
  );
};

/* ─── Status HUD elements ─── */
const HUDElement = ({ label, value, position }: { label: string; value: string; position: "left" | "right" }) => (
  <motion.div
    className={`absolute top-1/2 -translate-y-1/2 ${position === "left" ? "-left-20 sm:-left-28" : "-right-20 sm:-right-28"} hidden sm:flex flex-col items-${position === "left" ? "end" : "start"} gap-0.5`}
    initial={{ opacity: 0, x: position === "left" ? -10 : 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1.5 }}
  >
    <span className="text-[7px] font-mono uppercase tracking-[0.25em] text-accent-violet/40">{label}</span>
    <span className="text-[9px] font-mono text-accent-violet/70 font-bold">{value}</span>
  </motion.div>
);

/* ─── Proactive questions based on route ─── */
const getProactiveMessages = (pathname: string, lang: string): string[] => {
  const isPt = lang.startsWith("pt");
  if (pathname === "/" || pathname === "") {
    return isPt ? [
      "Ei! Notei que você tá olhando a home. Quer que eu te mostre como nossos agentes podem revolucionar sua empresa? 🚀",
      "Tô vendo que você ainda não explorou os departamentos. Posso te guiar? Tenho 200 agentes prontos!",
      "Quer um tour rápido? Em 2 minutos eu te mostro o que a CLAUTHOR pode fazer pela sua empresa.",
    ] : [
      "Hey! I noticed you're on the homepage. Want me to show you how our agents can transform your business? 🚀",
      "I see you haven't explored the departments yet. Can I guide you? I have 200 agents ready!",
      "Want a quick tour? In 2 minutes I'll show you what CLAUTHOR can do for your company.",
    ];
  }
  if (pathname.includes("/library")) {
    return isPt ? ["Boa escolha vir na biblioteca! Posso te ajudar a encontrar o agente perfeito pro seu caso."]
      : ["Great choice coming to the library! I can help you find the perfect agent for your needs."];
  }
  if (pathname.includes("/pricing")) {
    return isPt ? ["Analisando preços? Posso te ajudar a escolher o plano ideal baseado no seu volume."]
      : ["Checking prices? I can help you pick the ideal plan based on your volume."];
  }
  return isPt ? ["Precisa de ajuda com alguma coisa? Tô aqui 24/7!"]
    : ["Need help with anything? I'm here 24/7!"];
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — Cinematic Holographic AI Entity
   ═══════════════════════════════════════════════════════ */
const ThorGreeter = () => {
  const [phase, setPhase] = useState<"entrance" | "active" | "minimized">("minimized");
  const [messages, setMessages] = useState<ThorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proactiveIndexRef = useRef(0);
  const proactiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ThorMessage[]>([]);
  const location = useLocation();
  const { user } = useAuth();
  const lang = navigator.language || "en";

  // Keep messagesRef in sync to avoid stale closures
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  // Safety: force-stop native speech after 30s to prevent infinite talking
  useEffect(() => {
    if (!isSpeaking) return;
    const timeout = setTimeout(() => {
      console.warn("[Thor] Safety timeout: stopping speech after 30s");
      stopTTS();
    }, 30_000);
    return () => clearTimeout(timeout);
  }, [isSpeaking, stopTTS]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && location.pathname === "/") {
      const timer = setTimeout(() => setPhase("entrance"), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (phase === "entrance") {
      const timer = setTimeout(() => {
        setPhase("active");
        localStorage.setItem(STORAGE_KEY, "1");
        const isPt = lang.startsWith("pt");
        const greeting = isPt
          ? "Olá! Eu sou o **Thor**, CEO e Orquestrador da CLAUTHOR. 🧠 Me conta: **o que te trouxe aqui hoje?**"
          : "Hello! I'm **Thor**, CEO & Orchestrator of CLAUTHOR. 🧠 Tell me: **what brought you here today?**";
        setMessages([{ role: "assistant", content: greeting }]);
        if (voiceEnabled) speak(greeting.replace(/[*#🧠]/g, ""), THOR_VOICE_ID);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Proactive messages — clear on hasInteracted or phase change
  useEffect(() => {
    if (proactiveTimerRef.current) {
      clearInterval(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }
    if (phase !== "minimized" || hasInteracted) return;
    proactiveTimerRef.current = setInterval(() => {
      const msgs = getProactiveMessages(location.pathname, lang);
      const idx = proactiveIndexRef.current % msgs.length;
      proactiveIndexRef.current++;
      stopTTS(); // Stop any ongoing speech before new proactive msg
      setPhase("active");
      setMessages(prev => [...prev, { role: "assistant", content: msgs[idx] }]);
      if (voiceEnabled) speak(msgs[idx].replace(/[*#🚀]/g, ""), THOR_VOICE_ID);
    }, PROACTIVE_INTERVAL);
    return () => {
      if (proactiveTimerRef.current) {
        clearInterval(proactiveTimerRef.current);
        proactiveTimerRef.current = null;
      }
    };
  }, [phase, location.pathname, hasInteracted, voiceEnabled, stopTTS, speak, lang]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    setHasInteracted(true);
    setShowChat(true);

    // === CRITICAL: Stop any ongoing speech and cancel previous stream ===
    stopTTS();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Clear proactive timer permanently
    if (proactiveTimerRef.current) {
      clearInterval(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }

    const userMsg: ThorMessage = { role: "user", content: msg };
    const currentMessages = messagesRef.current;
    const updated = [...currentMessages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: updated.slice(-12).map(m => ({ role: m.role, content: m.content })),
            context: {
              area: user ? "client" : "public",
              route: location.pathname,
              authenticated: !!user,
              persona: "thor",
            },
          }),
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              const snapshot = assistantText;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Only speak if not aborted and text exists
      if (!controller.signal.aborted && voiceEnabled && assistantText) {
        const cleanText = assistantText.replace(/[*#🚀🧠💡\[\]()]/g, "").slice(0, 250);
        speak(cleanText, THOR_VOICE_ID);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("[Thor] Stream aborted by user");
        return;
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: lang.startsWith("pt") ? "Ops, tive um problema. Tenta de novo?" : "Oops, had an issue. Try again?",
      }]);
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [input, isLoading, user, location.pathname, voiceEnabled, speak, stopTTS, lang]);

  const minimize = () => {
    stopTTS();
    // Abort any running stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setPhase("minimized");
    setShowChat(false);
  };
  const activate = () => {
    setPhase("active");
    if (messagesRef.current.length === 0) {
      const isPt = lang.startsWith("pt");
      const greeting = isPt ? "Voltei! 😄 Em que posso te ajudar?" : "I'm back! 😄 How can I help?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  };

  const coreSize = typeof window !== "undefined" && window.innerWidth < 640 ? 260 : 360;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  /* ══ ENTRANCE — cinematic boot sequence ══ */
  if (phase === "entrance") {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 backdrop-blur-xl"
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent-violet) / 0.08) 0%, hsl(var(--background) / 0.8) 60%, hsl(var(--background) / 0.92) 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 60, duration: 2 }}
        >
          {/* Neural core with face */}
          <div className="relative" style={{ width: coreSize, height: coreSize }}>
            <NeuralCore isSpeaking={false} size={coreSize} />
            <div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: coreSize * 0.52,
                height: coreSize * 0.52,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: `inset 0 0 20px hsl(var(--accent-violet) / 0.15)`,
                border: "1px solid hsl(var(--accent-violet) / 0.2)",
              }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              <motion.div className="absolute inset-0" style={{
                background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--accent-violet) / 0.04) 2px, hsl(var(--accent-violet) / 0.04) 3px)",
              }} />
            </div>
          </div>

          {/* Boot text */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.h2
              className="font-mono text-xl sm:text-2xl font-bold tracking-[0.4em] uppercase text-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              THOR
            </motion.h2>
            <motion.div
              className="mt-2 flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <motion.span
                className="h-px bg-accent-violet/30"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
              <motion.span
                className="text-[8px] font-mono uppercase tracking-[0.5em] text-accent-violet/60"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Neural Sync
              </motion.span>
              <motion.span
                className="h-px bg-accent-violet/30"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
            </motion.div>
          </motion.div>

          {/* Loading sequence */}
          <motion.div
            className="mt-4 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-6 h-[2px] rounded-full bg-accent-violet"
                animate={{
                  opacity: [0.1, 0.8, 0.1],
                  scaleX: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.12,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  /* ══ MINIMIZED — premium floating orb ══ */
  if (phase === "minimized") {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14 }}
        onClick={activate}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[9999] group cursor-pointer"
        aria-label="Talk to Thor"
      >
        {/* Rotating conic border */}
        <motion.span
          className="absolute inset-[-3px] rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute inset-0" style={{
            background: "conic-gradient(from 0deg, transparent 30%, hsl(var(--accent-violet) / 0.7), hsl(var(--accent-violet) / 0.15), transparent 75%)",
          }} />
        </motion.span>

        {/* Pulse rings */}
        <motion.span
          className="absolute inset-[-8px] rounded-full border border-accent-violet/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.span
          className="absolute inset-[-14px] rounded-full border border-accent-violet/5"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />

        <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background/95 backdrop-blur-2xl overflow-hidden border border-accent-violet/10">
          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover rounded-full" />
          {/* Scanline overlay */}
          <span className="absolute inset-0 rounded-full" style={{
            background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--accent-violet) / 0.03) 2px, hsl(var(--accent-violet) / 0.03) 3px)",
          }} />
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_hsl(var(--accent-violet)/0.15)]" />
        </span>

        {/* Online indicator */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background z-10">
          <span className="block w-full h-full rounded-full bg-emerald-500" />
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
        </span>

        {/* Hover tooltip */}
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-[0.3em] uppercase text-accent-violet/50 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-accent-violet/10">
          THOR · ONLINE
        </span>
      </motion.button>
    );
  }

  const hasSpeech = messages.length > 0;
  const isPresenting = hasSpeech && !showChat;
  const presentCoreSize = typeof window !== "undefined" && window.innerWidth < 640 ? 220 : 300;

  /* ══ ACTIVE — Cinematic holographic entity ══ */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop — frosted glass blur */}
        <motion.div
          className="absolute inset-0 pointer-events-auto"
          onClick={minimize}
          initial={{ backdropFilter: "blur(0px)" }}
          animate={{ backdropFilter: "blur(10px)" }}
          transition={{ duration: 0.8 }}
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent-violet) / 0.06) 0%, hsl(var(--background) / 0.6) 60%, hsl(var(--background) / 0.75) 100%)" }}
        />

        {/* Layout: when presenting = Thor above panel. Otherwise centered */}
        <div className={`relative z-10 w-full h-full flex pointer-events-none ${
          isPresenting
            ? "flex-col items-center justify-center px-4 sm:px-6"
            : "flex-col items-center justify-center"
        }`}>

          {/* Thor orb container */}
          <motion.div
            className={`relative pointer-events-auto flex flex-col items-center ${isPresenting ? "z-20 -mb-10 sm:-mb-14" : ""}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", damping: 16, stiffness: 120 }}
            style={{ flexShrink: 0 }}
          >
            {/* Controls */}
            <div className="absolute -top-3 right-0 sm:-right-4 flex items-center gap-1.5 z-20">
              <button
                onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                className="p-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-accent-violet/10 text-accent-violet/50 hover:text-accent-violet hover:border-accent-violet/30 transition-all"
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={minimize}
                className="p-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-accent-violet/10 text-accent-violet/50 hover:text-accent-violet hover:border-accent-violet/30 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Neural core + face */}
            <div
              className="relative cursor-pointer"
              style={{ width: isPresenting ? presentCoreSize : coreSize, height: isPresenting ? presentCoreSize : coreSize, transition: "width 0.5s, height 0.5s" }}
              onClick={() => setShowChat(!showChat)}
            >
              <NeuralCore isSpeaking={isSpeaking} size={isPresenting ? presentCoreSize : coreSize} />

            {/* Face */}
            <motion.div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: (isPresenting ? presentCoreSize : coreSize) * 0.52,
                height: (isPresenting ? presentCoreSize : coreSize) * 0.52,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                border: "1px solid hsl(var(--accent-violet) / 0.25)",
              }}
              animate={isSpeaking ? {
                boxShadow: [
                  "inset 0 0 15px hsl(var(--accent-violet) / 0.1)",
                  "inset 0 0 25px hsl(var(--accent-violet) / 0.2)",
                  "inset 0 0 15px hsl(var(--accent-violet) / 0.1)",
                ],
              } : {
                boxShadow: "inset 0 0 15px hsl(var(--accent-violet) / 0.1)",
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              <motion.div className="absolute inset-0" style={{
                background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--accent-violet) / 0.03) 2px, hsl(var(--accent-violet) / 0.03) 3px)",
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-accent-violet/10 via-transparent to-accent-violet/5" />
            </motion.div>

            {/* HUD data points — hide when presenting */}
            {!isPresenting && <HUDElement label="Status" value="ACTIVE" position="left" />}
            {!isPresenting && <HUDElement label="Neural" value="98.7%" position="right" />}

            {/* Name badge */}
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
               <div className={`flex items-center gap-2 bg-background/80 backdrop-blur-xl py-1 rounded-full border border-accent-violet/15 shadow-lg shadow-accent-violet/5 ${isPresenting ? "px-2" : "px-4"}`}>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                 <span className={`font-mono font-bold tracking-[0.35em] uppercase text-foreground/90 ${isPresenting ? "text-[7px]" : "text-[9px]"}`}>THOR</span>
                {!isPresenting && <span className="text-[7px] font-mono text-accent-violet/40 tracking-wider">AI</span>}
              </div>
            </motion.div>
           </div>
          </motion.div>

          {/* ══ PRESENTATION PANEL — appears below Thor when presenting ══ */}
          {isPresenting && (
            <motion.div
              className="pointer-events-auto w-full max-w-[92vw] sm:max-w-[640px] max-h-[70vh] overflow-y-auto pt-14 sm:pt-20"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", damping: 20 }}
            >
              <div className="bg-background/80 backdrop-blur-2xl border border-accent-violet/10 rounded-[2rem] p-5 sm:p-6 shadow-2xl shadow-accent-violet/5">
                {lastMessage && lastMessage.role === "assistant" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <motion.span className="w-2 h-2 rounded-full bg-accent-violet" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-accent-violet/60">Thor · Apresentando</span>
                    </div>
                    <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2">
                      <ReactMarkdown>{lastMessage.content}</ReactMarkdown>
                    </div>
                    {isSpeaking && (
                      <div className="flex items-center gap-[2px] h-3 justify-start pt-1">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-[1.5px] rounded-full bg-accent-violet/50"
                            animate={{ height: [1, Math.random() * 10 + 3, 1] }}
                            transition={{ duration: 0.25 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.02 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 mt-4 pt-3 border-t border-accent-violet/5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={lang.startsWith("pt") ? "Pergunte algo ao Thor..." : "Ask Thor something..."}
                    disabled={isLoading}
                    className="flex-1 bg-muted/10 border border-accent-violet/10 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/30 transition-all placeholder:text-muted-foreground/30"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 rounded-lg bg-accent-violet/90 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20"
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Speech bubble — only when NOT presenting and not chat */}
          {lastMessage && !showChat && !isPresenting && (
            <motion.div
              className="mt-4 max-w-[88vw] sm:max-w-[340px] pointer-events-auto"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={lastMessage.content.slice(0, 20)}
            >
              <div
                className="relative bg-background/70 backdrop-blur-2xl border border-accent-violet/10 rounded-xl px-3 py-2 shadow-2xl shadow-accent-violet/5 cursor-pointer"
                onClick={() => setShowChat(true)}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background/70 border-l border-t border-accent-violet/10" />
                <p className="text-[10px] text-foreground/80 leading-snug relative z-10 font-mono">
                  {lastMessage.content.length > 130
                    ? lastMessage.content.slice(0, 130) + "..."
                    : lastMessage.content}
                </p>
                {lastMessage.content.length > 130 && (
                  <span className="text-[8px] text-accent-violet/50 font-mono mt-1 block">▼ ver mais</span>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-[1.5px] mt-1.5 h-2 justify-center">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[1px] rounded-full bg-accent-violet/50"
                        animate={{ height: [1, Math.random() * 6 + 2, 1] }}
                        transition={{ duration: 0.25 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.025 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick actions — hide when presenting */}
          {messages.length <= 1 && !showChat && !isPresenting && !isLoading && messages.some(m => m.role === "assistant") && (
            <motion.div
              className="mt-4 flex gap-2 flex-wrap justify-center pointer-events-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {(lang.startsWith("pt") ? [
                { label: "Me mostre os agentes", icon: "⚡" },
                { label: "Como funciona?", icon: "🔮" },
                { label: "Quero um tour", icon: "🌐" },
              ] : [
                { label: "Show me agents", icon: "⚡" },
                { label: "How does it work?", icon: "🔮" },
                { label: "Give me a tour", icon: "🌐" },
              ]).map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.label)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/60 backdrop-blur-xl border border-accent-violet/10 hover:border-accent-violet/30 hover:bg-accent-violet/5 hover:shadow-lg hover:shadow-accent-violet/10 transition-all text-[11px] font-mono tracking-wide"
                >
                  <span>{q.icon}</span>{q.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Chat area */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 w-[92vw] sm:w-[420px] overflow-hidden pointer-events-auto"
              >
                <div className="bg-background/85 backdrop-blur-2xl border border-accent-violet/10 rounded-2xl overflow-hidden shadow-2xl shadow-accent-violet/5">
                  <div className="px-4 py-2 border-b border-accent-violet/5 flex items-center gap-2">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-accent-violet/40">Neural Channel · Active</span>
                  </div>

                  <div className="max-h-[40vh] overflow-y-auto p-3 space-y-3">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-accent-violet/15 shrink-0 mt-0.5 shadow-md shadow-accent-violet/10">
                            <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                          msg.role === "user"
                            ? "bg-accent-violet/90 text-accent-violet-foreground shadow-lg shadow-accent-violet/20"
                            : "bg-muted/20 border border-accent-violet/5"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="text-[11px] prose prose-xs dark:prose-invert max-w-none [&_p]:mb-0.5 leading-snug">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-[12px]">{msg.content}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-accent-violet/15 shrink-0">
                          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-muted/20 rounded-xl px-3 py-2.5 border border-accent-violet/5">
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-accent-violet/60"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-accent-violet/5">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                        disabled={isLoading}
                        className="flex-1 bg-muted/10 border border-accent-violet/10 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/30 focus:shadow-md focus:shadow-accent-violet/5 transition-all placeholder:text-muted-foreground/30"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="h-9 w-9 rounded-lg bg-accent-violet/90 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20 hover:shadow-accent-violet/40"
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline input when chat hidden and NOT presenting */}
          {!showChat && !isPresenting && (
            <motion.div
              className="mt-4 w-[88vw] sm:w-[380px] pointer-events-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                  disabled={isLoading}
                  className="flex-1 bg-background/60 backdrop-blur-xl border border-accent-violet/10 rounded-full px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/25 focus:shadow-lg focus:shadow-accent-violet/5 transition-all placeholder:text-muted-foreground/30"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 rounded-full bg-accent-violet/80 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThorGreeter;
