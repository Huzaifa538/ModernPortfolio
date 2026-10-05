import { useEffect, useState, type KeyboardEvent } from 'react'
import { Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, resolveAssetUrl } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { Skeleton } from '../../components/ui/Skeleton'
import { FileUploader, ImageUploader } from '../../components/admin/ImageUploader'
import type { Profile } from '../../lib/types'

type Editable = Omit<Profile, '_id'>

function GroupCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  )
}

/** Simple tag editor for the hero "roles" that cycle in the typewriter. */
function RolesInput({ roles, onChange }: { roles: string[]; onChange: (r: string[]) => void }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (value && !roles.includes(value)) onChange([...roles, value])
    setDraft('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--text)]">Roles (cycle in the hero)</p>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6366f1]/15 to-[#22d3ee]/15 border border-[#8b5cf6]/25 px-3 py-1.5 text-sm font-medium"
          >
            {role}
            <button
              type="button"
              onClick={() => onChange(roles.filter((r) => r !== role))}
              aria-label={`Remove role ${role}`}
              className="rounded-full p-0.5 text-[var(--muted)] transition hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <Input
          label="Add a role"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
        />
        <Button type="button" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}

export function ProfileEditor() {
  const [form, setForm] = useState<Editable | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        const { _id: _omit, ...rest } = p
        void _omit
        setForm(rest)
      })
      .catch(() => toast.error('Could not load profile'))
  }, [])

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f))
    setDirty(true)
  }

  const save = async () => {
    if (!form || saving) return
    setSaving(true)
    try {
      await api.updateProfile(form)
      setDirty(false)
      toast.success('Profile saved')
    } catch {
      toast.error('Saving failed — please try again')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  const avatarPreview = resolveAssetUrl(form.avatarUrl)

  return (
    <div className="pb-28">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Profile</h1>
        <p className="mt-1 text-[var(--muted)]">
          Everything the public site shows about you lives here.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <GroupCard title="Hero" description="The first thing visitors see.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploader
                label="Avatar"
                value={form.avatarUrl}
                onChange={(url) => set('avatarUrl', url)}
              />
              <FileUploader
                label="Resume (PDF)"
                accept="application/pdf"
                hint="PDF — up to 5 MB"
                previewAsImage={false}
                value={form.resumeUrl}
                onChange={(url) => set('resumeUrl', url)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.fullName ?? ''}
                onChange={(e) => set('fullName', e.target.value)}
              />
              <Input
                label="Hero headline"
                value={form.heroTitle ?? ''}
                onChange={(e) => set('heroTitle', e.target.value)}
              />
            </div>
            <Textarea
              label="Hero subtitle"
              rows={3}
              value={form.heroSubtitle ?? ''}
              onChange={(e) => set('heroSubtitle', e.target.value)}
            />
            <RolesInput roles={form.roles} onChange={(r) => set('roles', r)} />
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface2)]/60 px-4 py-3">
              <div>
                <p className="font-medium">Available for work</p>
                <p className="text-sm text-[var(--muted)]">
                  Shows the pulsing badge in the hero.
                </p>
              </div>
              <Toggle
                label="Available for work"
                checked={form.availableForWork}
                onChange={(v) => set('availableForWork', v)}
              />
            </div>
          </GroupCard>

          <GroupCard title="About" description="The bio on your About section.">
            <Textarea
              label="About text"
              rows={6}
              value={form.aboutText ?? ''}
              onChange={(e) => set('aboutText', e.target.value)}
            />
            <Textarea
              label="Short bio"
              rows={3}
              value={form.bio ?? ''}
              onChange={(e) => set('bio', e.target.value)}
            />
          </GroupCard>

          <GroupCard title="Contact & social" description="Where people can reach you.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
              <Input label="Phone" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
              <Input label="Location" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
              <Input label="GitHub URL" value={form.githubUrl ?? ''} onChange={(e) => set('githubUrl', e.target.value)} />
              <Input label="LinkedIn URL" value={form.linkedinUrl ?? ''} onChange={(e) => set('linkedinUrl', e.target.value)} />
              <Input label="Twitter URL" value={form.twitterUrl ?? ''} onChange={(e) => set('twitterUrl', e.target.value)} />
            </div>
          </GroupCard>

          <GroupCard title="Stats" description="The counters on your About section.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Years experience"
                type="number"
                min={0}
                value={form.yearsExperience ?? ''}
                onChange={(e) => set('yearsExperience', Number(e.target.value) || 0)}
              />
              <Input
                label="Projects completed"
                type="number"
                min={0}
                value={form.projectsCompleted ?? ''}
                onChange={(e) => set('projectsCompleted', Number(e.target.value) || 0)}
              />
              <Input
                label="Happy clients"
                type="number"
                min={0}
                value={form.happyClients ?? ''}
                onChange={(e) => set('happyClients', Number(e.target.value) || 0)}
              />
            </div>
          </GroupCard>

          <GroupCard title="SEO" description="How your site appears in search results and link previews.">
            <Input label="SEO title" value={form.seoTitle ?? ''} onChange={(e) => set('seoTitle', e.target.value)} />
            <Textarea
              label="SEO description"
              rows={3}
              value={form.seoDescription ?? ''}
              onChange={(e) => set('seoDescription', e.target.value)}
            />
          </GroupCard>
        </div>

        {/* Live mini preview */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
              Live preview
            </p>
            <div className="mt-4 rounded-2xl bg-[var(--surface2)]/60 p-6 text-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-[#8b5cf6]/40"
                />
              ) : (
                <span className="font-display mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-3xl font-bold text-white">
                  {(form.fullName ?? 'P').charAt(0).toUpperCase()}
                </span>
              )}
              <p className="font-display mt-4 text-xl font-bold">
                {form.fullName || 'Your Name'}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {form.roles[0] ?? 'Full-Stack Developer'}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {form.heroSubtitle || 'Your hero subtitle will appear here.'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--bg-soft)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <p className="text-sm text-[var(--muted)]">
            {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </p>
          <Button onClick={save} loading={saving} disabled={!dirty}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>
    </div>
  )
}
