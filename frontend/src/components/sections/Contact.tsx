import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Github, Linkedin, Mail, MapPin, Phone, Send, Twitter } from 'lucide-react'
import toast from 'react-hot-toast'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { api } from '../../lib/api'
import type { Profile } from '../../lib/types'

interface FormState {
  name: string
  email: string
  subject: string
  message: string
  website: string // honeypot — left empty by humans
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '', website: '' }

export function Contact({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      toast.success(`${label} copied to clipboard`)
      window.setTimeout(() => setCopied((c) => (c === label ? null : c)), 1800)
    } catch {
      toast.error('Copy failed — long-press to copy instead')
    }
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address'
    if (form.message.trim().length < 10)
      next.message = 'Tell me a little more (at least 10 characters)'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || sending) return

    setSending(true)
    try {
      await api.sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
        website: form.website || undefined,
      })
      toast.success("Message sent! I'll get back to you soon.")
      setForm(EMPTY)
      setErrors({})
    } catch (err: unknown) {
      const message =
        axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined
      toast.error(message ?? 'Something went wrong — please try again.')
    } finally {
      setSending(false)
    }
  }

  const infoCards = [
    profile?.email && {
      icon: Mail,
      label: 'Email',
      value: profile.email,
      copy: true,
    },
    profile?.phone && {
      icon: Phone,
      label: 'Phone',
      value: profile.phone,
      copy: true,
    },
    profile?.location && {
      icon: MapPin,
      label: 'Location',
      value: profile.location,
      copy: false,
    },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; copy: boolean }[]

  const socials = [
    profile?.githubUrl && { href: profile.githubUrl, label: 'GitHub', icon: Github },
    profile?.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    profile?.twitterUrl && { href: profile.twitterUrl, label: 'Twitter', icon: Twitter },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Github }[]

  return (
    <section id="contact" className="relative overflow-hidden py-24 sm:py-32 bg-[var(--bg-soft)]">
      <div className="aurora" aria-hidden>
        <div className="aurora-blob aurora-2" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          label="contact"
          title="Let's work together"
          subtitle="Have a project in mind, a role to fill, or just want to say hi? My inbox is always open."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: info cards + socials */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-display text-2xl font-bold">
              Don't be a stranger<span className="text-gradient">.</span>
            </h3>
            <p className="mt-3 leading-relaxed text-[var(--muted)]">
              I usually reply within a day or two. If it's urgent, reach me directly on any of
              these — or just use the form and I'll find you.
            </p>

            <div className="mt-7 space-y-4">
              {infoCards.map(({ icon: Icon, label, value, copy }) => (
                <Card key={label} hover={copy} className="flex items-center gap-4 p-4">
                  <span className="rounded-xl bg-gradient-to-br from-[#6366f1]/15 to-[#22d3ee]/15 p-3 text-[#8b5cf6]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                      {label}
                    </p>
                    <p className="truncate font-medium">{value}</p>
                  </div>
                  {copy && (
                    <button
                      onClick={() => copyToClipboard(value, label)}
                      aria-label={`Copy ${label}`}
                      className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]"
                    >
                      {copied === label ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </Card>
              ))}
            </div>

            {socials.length > 0 && (
              <div className="mt-7 flex items-center gap-3">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="rounded-full border border-[var(--border)] bg-[var(--glass)] p-3 text-[var(--muted)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/60 hover:text-[#8b5cf6]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right: the form */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-7 sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Your name"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={set('name')}
                    error={errors.name}
                  />
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                  />
                </div>
                <Input
                  label="Subject (optional)"
                  name="subject"
                  value={form.subject}
                  onChange={set('subject')}
                />
                <Textarea
                  label="Your message"
                  name="message"
                  value={form.message}
                  onChange={set('message')}
                  error={errors.message}
                />

                {/* Honeypot: invisible to humans, irresistible to bots */}
                <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={set('website')}
                    />
                  </label>
                </div>

                <Button type="submit" size="lg" loading={sending} className="w-full sm:w-auto">
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending…' : 'Send Message'}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
