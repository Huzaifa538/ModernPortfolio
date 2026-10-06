import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface SectionFlipProps {
  children: ReactNode
  className?: string
  /**
   * Which way the section swings in. "down" starts edge-on at -90deg
   * (hinged at the top, falls toward the viewer); "up" starts at +90deg
   * hinged at the bottom and rises into place. Alternate per section.
   */
  flip?: 'down' | 'up'
  /** Seconds to wait before the flip starts. */
  delay?: number
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The big dramatic one: the whole section swings over in 3D the first time
 * it scrolls into view — like a page hinged at its edge falling toward you —
 * then keeps a gentle scroll-linked lean while it travels through the viewport.
 *
 * The entrance flip runs at FULL opacity (no fade) so the page-turn is
 * unmistakable: the section starts edge-on (-90deg, invisible) and swings
 * down into place.
 *
 * Visibility is observed on the OUTER wrapper (a stable layout box with no
 * entrance transform) and driven via `animate`, so the reveal can never get
 * stuck if the inner 3D transform confuses in-view detection. The outer
 * handles scroll lean, the inner handles the one-time entrance flip — the
 * two never fight over the same transform.
 */
export function SectionFlip({ children, className, flip = 'down', delay = 0 }: SectionFlipProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  // Observe the outer wrapper: stable box, no entrance transform.
  const inView = useInView(ref, { once: true, margin: '-60px' })

  // While the section moves through the viewport it leans a few degrees,
  // so the page feels like it has real depth instead of sliding flat.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scrollLean = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -4])

  const fromAngle = flip === 'down' ? -90 : 90
  const origin = flip === 'down' ? 'top center' : 'bottom center'

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transformPerspective: 1400,
        // Keep the scroll lean subtle even for drama lovers.
        rotateX: reduceMotion ? 0 : scrollLean,
      }}
    >
      <motion.div
        style={{ transformPerspective: 1400, transformOrigin: origin }}
        initial={reduceMotion ? { opacity: 0 } : { rotateX: fromAngle }}
        animate={inView ? { opacity: 1, rotateX: 0 } : undefined}
        transition={{ duration: 1.1, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
