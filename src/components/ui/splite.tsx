import { Suspense, lazy, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

function SplineFallback({ className }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className ?? ''}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 text-center p-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
          <Cpu className="h-7 w-7 text-primary/60" strokeWidth={1.5} />
        </div>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
          3D Preview
        </p>
      </motion.div>
    </div>
  )
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (hasError) {
    return <SplineFallback className={className} />
  }

  return (
    <Suspense fallback={<SplineFallback className={className} />}>
      <SplineErrorBoundary onError={handleError}>
        <Spline scene={scene} className={className} />
      </SplineErrorBoundary>
    </Suspense>
  )
}

// Minimal error boundary for WebGL crashes
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface EBProps {
  children: ReactNode
  onError: () => void
}

class SplineErrorBoundary extends Component<EBProps, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
