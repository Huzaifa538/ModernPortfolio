import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padded?: boolean
}

/** Frosted-glass surface card — the default building block for panels. */
export function Card({ children, hover = false, padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'glass rounded-2xl',
        padded && 'p-6',
        hover && 'card-hover',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
