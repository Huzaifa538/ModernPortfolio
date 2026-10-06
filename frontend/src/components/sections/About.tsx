import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { Briefcase, FolderKanban, Mail, MapPin, Phone, Smile } from 'lucide-react'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionFlip } from '../ui/SectionFlip'
import { Card } from '../ui/Card'
import { Reveal } from '../ui/Reveal'
import { resolveAssetUrl } from '../../lib/api'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { Profile } from '../../lib/types'

function useCountUp(target: number, started: boolean): number {
  const [value, setValue] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!started) return
    if (reduceMotion) {
      setValue(target)
      return
    }
    const duration = 1600
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      // ease-out cubic so it lands softly
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, target, reduceMotion])

  return value
}

function Stat({ label, value, icon: Icon, started }: { label: string; value: number; icon: typeof Briefcase; started: boolean }) {
  const count = useCountUp(value, started)
  return (
    <div className="flex items-center gap-4">
      <span className="rounded-xl bg-gradient-to-br from-[#6366f1]/15 to-[#22d3ee]/15 p-3 text-[#8b5cf6]">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-3xl font-bold">
          {count}
          <span className="text-gradient">+</span>
        </p>
        <p className="text-sm text-[var(--muted)]">{label}</p>
      </div>
    </div>
  )
}

export function About({ profile }: { profile: Profile | null }) {
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })

  const name = profile?.fullName ?? 'Your Name'
  const avatar = resolveAssetUrl(profile?.avatarUrl)
  const bio = profile?.aboutText ?? profile?.bio ?? 'A developer who cares about the details — the micro-interactions, the empty states, the loading shimmer. I build full-stack apps with modern tools and obsess over the experience.'

  const contactRows = [
    profile?.email && { icon: Mail, label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
    profile?.phone && { icon: Phone, label: 'Phone', value: profile.phone, href: `tel:${profile.phone}` },
    profile?.location && { icon: MapPin, label: 'Location', value: profile.location },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[]

  const stats = [
    { label: 'Years experience', value: profile?.yearsExperience ?? 3, icon: Briefcase },
    { label: 'Projects shipped', value: profile?.projectsCompleted ?? 25, icon: FolderKanban },
    { label: 'Happy clients', value: profile?.happyClients ?? 12, icon: Smile },
  ]

  return (
    <section id="about" className="relative py-24 sm:py-32">
      <SectionFlip flip="down">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          label="about"
          title="A little about me"
          subtitle="The story behind the pixels — who I am and what I care about when I build."
        />

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Tilted portrait */}
          <Reveal className="relative mx-auto w-full max-w-xs" distance={44}>
            <div
              className="absolute inset-0 translate-x-4 translate-y-4 rotate-3 rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#22d3ee] opacity-60"
              aria-hidden
            />
            <div className="relative -rotate-2 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
              {avatar ? (
                <img src={avatar} alt={name} className="aspect-square w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-[var(--surface2)]">
                  <span className="font-display text-7xl font-bold text-gradient">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Reveal>

          {/* Bio + contact rows */}
          <Reveal delay={0.12} distance={44}>
            <h3 className="font-display text-2xl font-bold">
              Hi, I'm <span className="text-gradient">{name}</span>
            </h3>
            <p className="mt-4 leading-relaxed text-[var(--muted)]">{bio}</p>

            <div className="mt-6 space-y-3">
              {contactRows.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className="rounded-lg bg-[var(--surface2)] p-2 text-[#8b5cf6]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-xs text-[var(--muted)] w-16">{label}</span>
                  {href ? (
                    <a href={href} className="font-medium hover:text-[#8b5cf6] transition-colors break-all">
                      {value}
                    </a>
                  ) : (
                    <span className="font-medium">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Counters */}
        <div ref={statsRef} className="mt-16">
          <Card>
            <div className="grid gap-8 sm:grid-cols-3">
              {stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} icon={s.icon} started={statsInView} />
              ))}
            </div>
          </Card>
        </div>
      </div>
      </SectionFlip>
    </section>
  )
}
