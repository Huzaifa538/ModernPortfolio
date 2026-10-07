import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Download, Github, Linkedin, Mail, Sparkles, Twitter } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { resolveAssetUrl, DEFAULT_AVATAR } from '../../lib/api'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { Profile } from '../../lib/types'

/** Types one role at a time, deletes it, moves to the next. */
function useTypewriter(words: string[], speed = 70, pause = 1600): string {
  const [text, setText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (words.length === 0) return
    const current = words[wordIndex % words.length]

    if (!deleting && text === current) {
      const hold = window.setTimeout(() => setDeleting(true), pause)
      return () => window.clearTimeout(hold)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setWordIndex((i) => (i + 1) % words.length)
      return
    }

    const next = deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)
    const timer = window.setTimeout(() => setText(next), deleting ? speed / 2 : speed)
    return () => window.clearTimeout(timer)
  }, [text, deleting, wordIndex, words, speed, pause])

  return text
}

interface HeroProps {
  profile: Profile | null
}

export function Hero({ profile }: HeroProps) {
  const roles = profile?.roles?.length ? profile.roles : ['Full-Stack Developer']
  const typed = useTypewriter(roles)

  const name = profile?.fullName ?? 'Your Name'
  const title = profile?.heroTitle ?? 'Building digital experiences that people love'
  const subtitle = profile?.heroSubtitle
  const avatar = resolveAssetUrl(profile?.avatarUrl) || DEFAULT_AVATAR
  const available = profile?.availableForWork ?? true
  const reduceMotion = useReducedMotion()

  // Scroll-linked parallax: the aurora drifts down slowly while the copy
  // rises and fades — separate speeds are what sell the depth.
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 220])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -110])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  // As the hero scrolls away it tips backward in 3D, like a page lifting off.
  const contentTilt = useTransform(scrollYProgress, [0, 1], [0, 9])

  const socials = [
    profile?.githubUrl && { href: profile.githubUrl, label: 'GitHub', icon: Github },
    profile?.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    profile?.twitterUrl && { href: profile.twitterUrl, label: 'Twitter', icon: Twitter },
    profile?.email && { href: `mailto:${profile.email}`, label: 'Email', icon: Mail },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Github }[]

  const scrollToProjects = () =>
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="home" ref={sectionRef} className="relative flex min-h-screen items-center overflow-hidden">
      {/* Aurora wash behind everything — drifts on scroll for parallax depth */}
      <motion.div
        aria-hidden
        style={reduceMotion ? undefined : { y: bgY }}
        className="aurora"
      >
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg)_75%)]"
      />

      <motion.div
        style={
          reduceMotion
            ? undefined
            : { y: contentY, opacity: contentOpacity, rotateX: contentTilt, transformPerspective: 1200 }
        }
        className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-24 pt-28 lg:grid-cols-[1.15fr_0.85fr] lg:pt-32"
      >
        {/* Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {available ? (
              <Badge tone="brand">
                <span className="h-2 w-2 rounded-full bg-[#22d3ee] animate-pulse-dot" />
                Available for work
              </Badge>
            ) : (
              <Badge>
                <Sparkles className="h-3 w-3" />
                Open to interesting conversations
              </Badge>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-mono mt-6 text-sm text-[var(--muted)]"
          >
            Hey there — I'm
          </motion.p>

          <h1 className="font-display mt-2 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {name.split(' ').map((word, i, words) => {
              const last = i === words.length - 1
              return (
                <span
                  key={`${word}-${i}`}
                  className="-mb-2 inline-block overflow-hidden pb-2 align-bottom"
                >
                  <motion.span
                    className={`inline-block ${last ? 'text-gradient' : ''}`}
                    style={{ transformPerspective: 600 }}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '110%', rotateX: -80 }}
                    animate={{ opacity: 1, y: '0%', rotateX: 0 }}
                    transition={{ duration: 0.75, delay: 0.14 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {word}
                    {last ? '' : ' '}
                  </motion.span>
                </span>
              )
            })}
          </h1>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="font-display mt-5 text-2xl font-semibold text-[var(--muted)] sm:text-3xl"
          >
            <span aria-live="polite">
              {typed}
              <span className="typing-caret" aria-hidden />
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]"
          >
            {subtitle ?? title}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Button size="lg" onClick={scrollToProjects}>
              View My Work
              <ArrowDown className="h-4 w-4" />
            </Button>
            {profile?.resumeUrl && (
              <a href={resolveAssetUrl(profile.resumeUrl)} download target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline">
                  <Download className="h-4 w-4" />
                  Download Resume
                </Button>
              </a>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-9 flex items-center gap-3"
          >
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer"
                aria-label={label}
                className="rounded-full border border-[var(--border)] bg-[var(--glass)] p-3 text-[var(--muted)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/60 hover:text-[#8b5cf6]"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </motion.div>
        </div>

        {/* Floating avatar card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="animate-float-y relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] opacity-70 blur-xl" aria-hidden />
            <div className="relative rounded-[1.75rem] bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] p-[3px]">
              <div className="overflow-hidden rounded-[calc(1.75rem-3px)] bg-[var(--surface)]">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="aspect-[4/5] w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="flex aspect-[4/5] w-full items-center justify-center bg-[var(--surface2)]">
                    <span className="font-display text-8xl font-bold text-gradient">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tech chips floating on the card */}
            <div className="glass absolute -left-5 top-10 rounded-2xl px-4 py-2.5 shadow-xl sm:-left-10">
              <p className="font-mono text-xs text-[var(--muted)]">currently</p>
              <p className="font-display text-sm font-semibold text-gradient">React + Node</p>
            </div>
            <div className="glass absolute -right-4 bottom-12 rounded-2xl px-4 py-2.5 shadow-xl sm:-right-8">
              <p className="font-mono text-xs text-[var(--muted)]">focus</p>
              <p className="font-display text-sm font-semibold text-gradient">Clean UI</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
        }}
        aria-label="Scroll to about section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="block"
        >
          <ArrowDown className="h-6 w-6" />
        </motion.span>
      </motion.a>
    </section>
  )
}
