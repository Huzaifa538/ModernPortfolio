import { motion } from 'framer-motion'
import { BriefcaseBusiness } from 'lucide-react'
import clsx from 'clsx'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
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
  return (
    <section id="experience" className="relative py-24 sm:py-32">
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
              {/* The gradient spine */}
              <div
                aria-hidden
                className="absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] opacity-40 md:left-1/2 md:-translate-x-1/2"
              />

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
                        <span className="block h-4 w-4 rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] ring-4 ring-[#8b5cf6]/20 shadow-lg shadow-indigo-500/40" />
                      </span>

                      <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.55 }}
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
    </section>
  )
}
