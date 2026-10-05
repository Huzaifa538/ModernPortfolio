import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageSquareHeart, Quote } from 'lucide-react'
import clsx from 'clsx'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { resolveAssetUrl } from '../../lib/api'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { Testimonial } from '../../lib/types'

const AUTOPLAY_MS = 6000

interface TestimonialsProps {
  testimonials: Testimonial[]
  loading: boolean
}

export function Testimonials({ testimonials, loading }: TestimonialsProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const timer = useRef<number | null>(null)

  const goTo = useCallback(
    (i: number) => {
      if (testimonials.length === 0) return
      setIndex(((i % testimonials.length) + testimonials.length) % testimonials.length)
    },
    [testimonials.length]
  )

  // Autoplay — paused on hover or when the user prefers reduced motion
  useEffect(() => {
    if (paused || reduceMotion || testimonials.length < 2) return
    timer.current = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [index, paused, reduceMotion, goTo, testimonials.length])

  const current = testimonials[index]

  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading
          label="testimonials"
          title="Kind words"
          subtitle="What the people I've worked with have to say."
        />

        <div className="mt-14">
          {loading ? (
            <Skeleton className="h-64" />
          ) : testimonials.length === 0 ? (
            <Card className="text-center text-[var(--muted)]">
              <MessageSquareHeart className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No testimonials yet — check back soon.</p>
            </Card>
          ) : (
            <div
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="relative"
            >
              <Card padded={false} className="relative overflow-hidden p-8 sm:p-12">
                <Quote
                  aria-hidden
                  className="absolute -top-2 left-6 h-20 w-20 text-[#8b5cf6] opacity-10"
                />
                <AnimatePresence mode="wait">
                  <motion.figure
                    key={current._id}
                    initial={reduceMotion ? undefined : { opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -32 }}
                    transition={{ duration: 0.4 }}
                    className="relative"
                  >
                    <blockquote className="text-lg leading-relaxed text-[var(--text)] sm:text-xl">
                      “{current.quote}”
                    </blockquote>
                    <figcaption className="mt-7 flex items-center gap-4">
                      {current.avatarUrl ? (
                        <img
                          src={resolveAssetUrl(current.avatarUrl)}
                          alt={current.name}
                          className="rounded-full object-cover ring-2 ring-[#8b5cf6]/40"
                          style={{ height: 52, width: 52 }}
                        />
                      ) : (
                        <span className="font-display flex items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-lg font-bold text-white" style={{ height: 52, width: 52 }}>
                          {current.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="font-display font-semibold">{current.name}</p>
                        {(current.role || current.company) && (
                          <p className="text-sm text-[var(--muted)]">
                            {[current.role, current.company].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </figcaption>
                  </motion.figure>
                </AnimatePresence>
              </Card>

              {/* Arrows */}
              {testimonials.length > 1 && (
                <>
                  <button
                    onClick={() => goTo(index - 1)}
                    aria-label="Previous testimonial"
                    className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--muted)] shadow-lg transition hover:text-[#8b5cf6] sm:-left-6"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => goTo(index + 1)}
                    aria-label="Next testimonial"
                    className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--muted)] shadow-lg transition hover:text-[#8b5cf6] sm:-right-6"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Dots */}
              {testimonials.length > 1 && (
                <div className="mt-7 flex justify-center gap-2.5">
                  {testimonials.map((t, i) => (
                    <button
                      key={t._id}
                      onClick={() => goTo(i)}
                      aria-label={`Go to testimonial ${i + 1}`}
                      className={clsx(
                        'h-2.5 rounded-full transition-all duration-300',
                        i === index
                          ? 'w-8 bg-gradient-to-r from-[#6366f1] to-[#22d3ee]'
                          : 'w-2.5 bg-[var(--surface2)] hover:bg-[#8b5cf6]/50'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
