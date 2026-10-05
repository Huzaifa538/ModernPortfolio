import clsx from 'clsx'

interface SkeletonProps {
  className?: string
}

/** Lightweight shimmer placeholder shown while data loads. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('shimmer rounded-xl', className)} aria-hidden />
}
