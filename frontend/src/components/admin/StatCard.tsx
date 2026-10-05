import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  accent: string
}

/** Dashboard stat tile with a count-up number. */
export function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  const [display, setDisplay] = useState(0)
  const reduceMotion = useReducedMotion()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (reduceMotion) {
      setDisplay(value)
      return
    }
    const duration = 900
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduceMotion])

  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className="rounded-xl p-3.5 text-white shadow-lg"
        style={{ background: accent }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-3xl font-bold">{display}</p>
        <p className="text-sm text-[var(--muted)]">{label}</p>
      </div>
    </Card>
  )
}
