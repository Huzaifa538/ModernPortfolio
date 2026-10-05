import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * A soft radial spotlight that trails the cursor.
 * Skipped entirely on touch devices and when reduced motion is requested.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const glow = glowRef.current
    if (!glow) return

    let raf = 0
    let targetX = -400
    let targetY = -400
    let x = targetX
    let y = targetY

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const tick = () => {
      // gentle easing so the glow trails behind the cursor
      x += (targetX - x) * 0.08
      y += (targetY - y) * 0.08
      glow.style.transform = `translate(${x - 250}px, ${y - 250}px)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduceMotion])

  if (reduceMotion) return null

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[500px] w-[500px] rounded-full opacity-25 blur-3xl md:block"
      style={{
        background: 'radial-gradient(circle, #8b5cf6 0%, #6366f1 35%, transparent 70%)',
      }}
    />
  )
}
