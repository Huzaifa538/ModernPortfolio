import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  tone?: 'brand' | 'neutral' | 'success'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        tone === 'brand' &&
          'bg-gradient-to-r from-[#6366f1]/15 via-[#8b5cf6]/15 to-[#22d3ee]/15 text-[#8b5cf6] border border-[#8b5cf6]/25',
        tone === 'neutral' &&
          'bg-[var(--surface2)] text-[var(--muted)] border border-[var(--border)]',
        tone === 'success' &&
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
        className
      )}
    >
      {children}
    </span>
  )
}
