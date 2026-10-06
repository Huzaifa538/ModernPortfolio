import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

// Trigger a little before the element is fully on screen, and only once.
const viewport = { once: true, margin: '-80px' } as const

interface RevealProps {
  children: ReactNode
  className?: string
  /** Seconds to wait before the reveal starts — for hand-rolled staggers. */
  delay?: number
  /** How far the block travels upward while fading in. */
  distance?: number
  /** The 3D flip angle — cards look like they rise off the page. */
  tilt?: number
}

/**
 * Fades a block up out of the page with a slight 3D flip the first time
 * it scrolls into view. Sections use this for their big beats.
 */
export function Reveal({ children, className, delay = 0, distance = 36, tilt = 10 }: RevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 900 }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: distance, rotateX: tilt }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={viewport}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
}

const calmGroupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

function itemVariants(flip: boolean): Variants {
  return {
    hidden: flip ? { opacity: 0, y: 34, rotateX: 10 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  }
}

/**
 * Wrap a grid/list in this and each <RevealItem> child rises in with a
 * 3D flip, one after another.
 */
export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 900 }}
      variants={reduceMotion ? calmGroupVariants : groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  flip = true,
}: {
  children: ReactNode
  className?: string
  flip?: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 900 }}
      variants={itemVariants(!reduceMotion && flip)}
    >
      {children}
    </motion.div>
  )
}
