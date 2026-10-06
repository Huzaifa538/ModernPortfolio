import { motion } from 'framer-motion'
import { BriefcaseBusiness } from 'lucide-react'
import clsx from 'clsx'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionFlip } from '../ui/SectionFlip'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { Experience } from '../../lib/types'

function dateRange(exp: Experience): string {
  const start = exp.startDate?.trim() || ''
  const end = exp.current ? 'Present' : exp.endDate?.trim() || ''
  if (start && end) return `${start} — ${end}`
  return start || end || '—'
}

interface ExperienceProps {
  experiences: Experience[]
  loading: boolean
}

export function Experience({ experiences, loading }: ExperienceProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section id="experience" className="relative py-24 sm:py-32">
      <SectionFlip flip="down">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading
          label="experience"
          title="Where I've been"
          subtitle="A quick tour of the roles that shaped how I build software today."
        />

        <div className="mt-16">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <Card className="text-center text-[var(--muted)]">
              <BriefcaseBusiness className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No experience entries yet — check back soon.</p>
            </Card>
          ) : (
            <div className="relative">
              {/* The gradient spine — draws itself downward as you scroll in */}
              <div
                aria-hidden
                className="absolute left-5 top-0 h-full md:left-1/2 md:-translate-x-1/2"
              >
                <motion.div
                  className="h-full w-0.5 origin-top bg-gradient-to-b from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] opacity-40"
                  initial={reduceMotion ? undefined : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
              </div>

              <div className="space-y-10">
                {experiences.map((exp, i) => {
                  const leftSide = i % 2 === 0
                  return (
                    <div key={exp._id} className="relative md:grid md:grid-cols-2 md:gap-12">
                      {/* Glowing node on the spine */}
                      <span
                        aria-hidden
                        className="absolute left-5 top-6 z-10 -translate-x-1/2 md:left-1/2"
                      >
                        <motion.span
                          className="block"
                          initial={reduceMotion ? undefined : { scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true, margin: '-60px' }}
                          transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.15 }}
                        >
                          <span className="block h-4 w-4 rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] ring-4 ring-[#8b5cf6]/20 shadow-lg shadow-indigo-500/40" />
                        </motion.span>
                      </span>

                      <motion.div
                        style={{ transformPerspective: 900 }}
                        initial={reduceMotion ? { opacity: 0, y: 24 } : { opacity: 0, y: 36, rotateX: 10 }}
                        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                        className={clsx(
                          'ml-12 md:ml-0',
                          leftSide ? 'md:col-start-1 md:pr-2 md:text-right' : 'md:col-start-2 md:pl-2'
                        )}
                      >
                        <Card hover>
                          <div className={clsx('flex flex-wrap items-center gap-2', leftSide && 'md:justify-end')}>
                            {exp.current && <Badge tone="success">Current</Badge>}
                            <span className="font-mono text-xs text-[var(--muted)]">{dateRange(exp)}</span>
                          </div>
                          <h3 className="font-display mt-2 text-xl font-bold">{exp.role}</h3>
                          <p className="mt-1 font-medium text-[#8b5cf6]">{exp.company}</p>
                          {exp.description && (
                            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{exp.description}</p>
                          )}
                        </Card>
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </SectionFlip>
    </section>
  )
}
