import { Github, Linkedin, Twitter, Mail } from 'lucide-react'
import { auth } from '../../lib/api'
import type { Profile } from '../../lib/types'

interface FooterProps {
  profile: Profile | null
}

export function Footer({ profile }: FooterProps) {
  const year = new Date().getFullYear()
  const name = profile?.fullName ?? 'Portfolio'

  const socials = [
    profile?.githubUrl && { href: profile.githubUrl, label: 'GitHub', icon: Github },
    profile?.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    profile?.twitterUrl && { href: profile.twitterUrl, label: 'Twitter', icon: Twitter },
    profile?.email && { href: `mailto:${profile.email}`, label: 'Email', icon: Mail },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Github }[]

  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] font-display text-lg font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-display font-semibold">{name}</p>
            <p className="text-sm text-[var(--muted)]">© {year} — built with care</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {socials.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              aria-label={label}
              className="rounded-full border border-[var(--border)] bg-[var(--glass)] p-2.5 text-[var(--muted)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]"
            >
              <Icon className="h-[18px] w-[18px]" />
            </a>
          ))}
          {auth.isLoggedIn() && (
            <a
              href="/admin/dashboard"
              className="ml-2 text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--text)] hover:underline"
            >
              Admin
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
