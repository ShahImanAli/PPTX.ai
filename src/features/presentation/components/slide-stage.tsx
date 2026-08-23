import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export const SLIDE_BASE_WIDTH = 1280
export const SLIDE_BASE_HEIGHT = 720

type SlideStageProps = {
  children: ReactNode
  className?: string
}

/**
 * Renders slide content on a fixed 1280x720 canvas and scales it uniformly
 * to fit the available space, so typography, spacing, alignment and colors
 * stay identical to the normal (inline) preview at every screen size.
 */
export function SlideStage({ children, className }: SlideStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  const updateScale = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { clientWidth, clientHeight } = el
    if (clientWidth === 0 || clientHeight === 0) return
    setScale(
      Math.min(
        clientWidth / SLIDE_BASE_WIDTH,
        clientHeight / SLIDE_BASE_HEIGHT,
      ),
    )
  }, [])

  useEffect(() => {
    updateScale()
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(updateScale)
    observer.observe(el)
    window.addEventListener('resize', updateScale)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [updateScale])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${
        className ?? ''
      }`}
    >
      <div
        className="relative shrink-0 origin-center"
        style={{
          width: `${SLIDE_BASE_WIDTH}px`,
          height: `${SLIDE_BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
