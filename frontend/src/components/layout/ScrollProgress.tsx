import { motion, useScroll, useSpring } from 'framer-motion'

/** Thin gradient bar pinned to the top that fills as you scroll the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#22d3ee]"
    />
  )
}
