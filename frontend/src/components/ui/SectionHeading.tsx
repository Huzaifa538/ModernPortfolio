import { motion } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface SectionHeadingProps {
  label: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

/** Mono eyebrow label + gradient display title + muted subtitle. */
export function SectionHeading({ label, title, subtitle, align = 'center' }: SectionHeadingProps) {
  const reduceMotion = useReducedMotion()
  const centered = align === 'center'

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={centered ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl'}
    >
      <p className="font-mono text-xs tracking-[0.3em] uppercase text-[#8b5cf6]">
        {'// '}{label}
      </p>
      <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl leading-tight">
        <span className="text-gradient">{title}</span>
      </h2>
      {subtitle && (
        <p className="mt-4 text-[var(--muted)] text-base sm:text-lg leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  )
}
