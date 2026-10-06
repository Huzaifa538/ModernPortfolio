import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110',
  outline:
    'border border-[var(--border)] bg-[var(--glass)] backdrop-blur text-[var(--text)] hover:border-[#8b5cf6]/60 hover:text-[#8b5cf6]',
  ghost: 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--glass)]',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
}

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

// framer-motion redefines several DOM event props (drag/animation) with its
// own signatures, so they are omitted here to keep the types compatible.
type MotionSafeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationComplete' | 'onAnimationIteration'
>

interface ButtonProps extends MotionSafeButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      // Springs for the press — snappy but never harsh.
      whileHover={{ scale: 1.045, y: -1 }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[box-shadow,border-color,background-color,color,filter] duration-300',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  )
})
