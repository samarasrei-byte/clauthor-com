import { motion } from 'framer-motion';
import { Cpu, Zap, Globe, Layers } from 'lucide-react';

interface SplineSceneProps {
  scene?: string;
  className?: string;
}

/**
 * Lightweight animated 3D-like visual replacing the heavy Spline WebGL runtime.
 * Uses GPU-accelerated CSS transforms + framer-motion for smooth 60fps animation.
 */
export function SplineScene({ className }: SplineSceneProps) {
  return (
    <div className={`w-full h-full flex items-center justify-center relative overflow-hidden ${className ?? ''}`}>
      {/* Ambient glow */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px]"
        />
        <motion.div
          animate={{ opacity: [0.08, 0.18, 0.08], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/3 right-1/4 w-[200px] h-[200px] rounded-full bg-primary-glow/15 blur-[60px]"
        />
      </div>

      {/* Rotating rings */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: 12 + i * 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-primary/[0.12]"
            style={{
              transform: `rotateX(${60 + i * 15}deg) rotateY(${i * 30}deg)`,
              transformStyle: 'preserve-3d',
            }}
          />
        ))}

        {/* Central orb */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], boxShadow: [
            '0 0 30px hsl(0 85% 55% / 0.2)',
            '0 0 50px hsl(0 85% 55% / 0.35)',
            '0 0 30px hsl(0 85% 55% / 0.2)',
          ]}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary-glow/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm"
        >
          <Cpu className="h-8 w-8 sm:h-10 sm:w-10 text-primary/80" strokeWidth={1} />
        </motion.div>

        {/* Orbiting icons */}
        {[
          { Icon: Zap, delay: 0, radius: 90 },
          { Icon: Globe, delay: 2, radius: 100 },
          { Icon: Layers, delay: 4, radius: 95 },
        ].map(({ Icon, delay, radius }, i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear', delay }}
            className="absolute top-1/2 left-1/2"
            style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-card/80 border border-primary/15 flex items-center justify-center backdrop-blur-sm">
              <Icon className="h-4 w-4 text-primary/70" strokeWidth={1.5} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(0 85% 55% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(0 85% 55% / 0.4) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
    </div>
  );
}
