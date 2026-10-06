import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface SectionHeadingProps {
  label: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Mono eyebrow label + gradient display title + muted subtitle.
 * The title swings up out of an overflow mask with a deep 3D rotation —
 * each line of the heading lands like a struck match.
 */
export function SectionHeading({ label, title, subtitle, align = 'center' }: SectionHeadingProps) {
  const reduceMotion = useReducedMotion()
  const centered = align === 'center'

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: EASE }}
      className={centered ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'}
    >
      <motion.p
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, rotateX: -45 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ transformPerspective: 700 }}
        className="font-mono text-xs tracking-[0.3em] uppercase text-[#8b5cf6]"
      >
        {'// '}{label}
      </motion.p>

      {/* Masked 3D swing: the title flips up from -90deg, hidden until it lands. */}
      <span className="mt-3 block overflow-hidden pb-2">
        <motion.span
          style={{ transformPerspective: 900, transformOrigin: 'top center' }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: -90, y: 24 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
          className="font-display block text-3xl font-bold sm:text-4xl lg:text-5xl leading-tight"
        >
          <span className="text-gradient">{title}</span>
        </motion.span>
      </span>

      {subtitle && (
        <motion.p
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
          className="mt-4 text-[var(--muted)] text-base sm:text-lg leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
