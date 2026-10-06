import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface SectionFlipProps {
  children: ReactNode
  className?: string
  /**
   * Which way the section swings in. "down" starts edge-on at -75deg
   * (bottom tilted away) and falls toward the viewer; "up" starts at
   * +55deg and settles back. Alternate per section for variety.
   */
  flip?: 'down' | 'up'
  /** Seconds to wait before the flip starts. */
  delay?: number
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The big dramatic one: the whole section flips over in 3D the first time
 * it scrolls into view — like a page turning toward you — then keeps a
 * gentle scroll-linked lean while it travels through the viewport.
 *
 * Two nested motion layers so the entry flip and the scroll tilt never
 * fight over the same transform: the outer handles scroll lean, the inner
 * handles the one-time entrance flip.
 */
export function SectionFlip({ children, className, flip = 'down', delay = 0 }: SectionFlipProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  // While the section moves through the viewport it leans a few degrees,
  // so the page feels like it has real depth instead of sliding flat.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scrollLean = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5])

  const fromAngle = flip === 'down' ? -75 : 55

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transformPerspective: 1200,
        // Keep the scroll lean subtle even for drama lovers.
        rotateX: reduceMotion ? 0 : scrollLean,
      }}
    >
      <motion.div
        style={{ transformPerspective: 1200, transformOrigin: 'top center' }}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: fromAngle }}
        whileInView={{ opacity: 1, rotateX: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
