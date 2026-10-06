import { useRef, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface TiltCardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationComplete' | 'onAnimationIteration'
  > {
  children: ReactNode
  /** How many degrees the card leans at its edge. Keep it subtle. */
  maxTilt?: number
  /** A soft light sheen that follows the cursor across the card. */
  glare?: boolean
  /** Lift the card a touch while hovered. */
  lift?: boolean
  /** Class applied to the outer perspective wrapper (e.g. "h-full" in grids). */
  wrapperClassName?: string
}

/**
 * Wraps any card and lets it lean toward the cursor in 3D, with a soft
 * light sheen tracking the pointer. The motion is springed so it feels
 * physical — it eases back flat when the pointer leaves.
 *
 * Visuals come from `className` as usual; this only adds the motion layer.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
  glare = true,
  lift = true,
  wrapperClassName,
  style,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const targetRX = useMotionValue(0)
  const targetRY = useMotionValue(0)
  // Springs instead of raw values — this is what makes the tilt feel
  // like a real object instead of something glued to the cursor.
  const rotateX = useSpring(targetRX, { stiffness: 280, damping: 24, mass: 0.5 })
  const rotateY = useSpring(targetRY, { stiffness: 280, damping: 24, mass: 0.5 })

  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)
  const glareOpacity = useMotionValue(0)
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.13), transparent 62%)`

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    targetRX.set(-(py - 0.5) * maxTilt * 2)
    targetRY.set((px - 0.5) * maxTilt * 2)
    glareX.set(px * 100)
    glareY.set(py * 100)
    glareOpacity.set(1)
  }

  const handleLeave = () => {
    targetRX.set(0)
    targetRY.set(0)
    glareOpacity.set(0)
  }

  // No 3D shenanigans for reduced-motion users — just the card.
  if (reduceMotion) {
    return (
      <div ref={ref} className={className} style={style} {...rest}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ perspective: 1100 }} className={wrapperClassName}>
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ ...style, rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={lift ? { y: -6 } : undefined}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className={className}
        {...rest}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ background: glareBackground, opacity: glareOpacity }}
          />
        )}
      </motion.div>
    </div>
  )
}
