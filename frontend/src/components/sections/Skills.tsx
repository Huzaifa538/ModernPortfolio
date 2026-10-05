import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Code2 } from 'lucide-react'
import clsx from 'clsx'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import type { Skill } from '../../lib/types'

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Database', 'Tools', 'Other'] as const

function ProgressBar({ level, animate }: { level: number; animate: boolean }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[var(--surface2)]"
      role="progressbar"
      aria-valuenow={level}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Proficiency ${level} percent`}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#22d3ee]"
        initial={{ width: 0 }}
        animate={{ width: animate ? `${level}%` : 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </div>
  )
}

function SkillMarquee({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) return null
  const names = [...skills.map((s) => s.name), ...skills.map((s) => s.name)]
  return (
    <div className="relative mt-16 overflow-hidden border-y border-[var(--border)] py-5 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="marquee-track gap-10 pr-10">
        {names.map((name, i) => (
          <span key={`${name}-${i}`} className="flex shrink-0 items-center gap-10 whitespace-nowrap">
            <span className="font-display text-xl font-semibold text-[var(--muted)]">{name}</span>
            <span className="text-gradient text-lg">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

interface SkillsProps {
  skills: Skill[]
  loading: boolean
}

export function Skills({ skills, loading }: SkillsProps) {
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>('All')

  const visible = useMemo(
    () => (tab === 'All' ? skills : skills.filter((s) => s.category === tab)),
    [skills, tab]
  )

  return (
    <section id="skills" className="relative py-24 sm:py-32 bg-[var(--bg-soft)]">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          label="skills"
          title="What I work with"
          subtitle="The tools I reach for every day — and how comfortable I am with each one."
        />

        {/* Filter tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              className={clsx(
                'rounded-full px-5 py-2 text-sm font-medium transition-all duration-300',
                tab === cat
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md shadow-indigo-500/30'
                  : 'border border-[var(--border)] bg-[var(--glass)] text-[var(--muted)] hover:border-[#8b5cf6]/40 hover:text-[var(--text)]'
              )}
              aria-pressed={tab === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="text-center text-[var(--muted)]">
              <Code2 className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No skills in this category yet.</p>
            </Card>
          ) : (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((skill) => (
                <motion.div
                  key={skill._id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Card hover padded className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display font-semibold">{skill.name}</h3>
                      <span className="font-mono text-xs text-[var(--muted)]">{skill.level}%</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar level={skill.level} animate />
                    </div>
                    <p className="font-mono mt-3 text-[11px] uppercase tracking-widest text-[var(--muted)]">
                      {skill.category}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <SkillMarquee skills={skills} />
    </section>
  )
}
