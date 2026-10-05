import { useEffect, useState, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Github, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, resolveAssetUrl } from '../../lib/api'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Project } from '../../lib/types'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface ProjectForm {
  title: string
  slug: string
  description: string
  longDescription: string
  imageUrl: string
  gallery: string[]
  techStack: string[]
  category: string
  liveUrl: string
  githubUrl: string
  featured: boolean
}

const EMPTY_FORM: ProjectForm = {
  title: '',
  slug: '',
  description: '',
  longDescription: '',
  imageUrl: '',
  gallery: [],
  techStack: [],
  category: 'Web',
  liveUrl: '',
  githubUrl: '',
  featured: false,
}

const CATEGORIES = ['Web', 'Mobile', 'AI/ML', 'Design', 'DevOps', 'Other']

function TagsInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string
  tags: string[]
  onChange: (t: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (value && !tags.includes(value)) onChange([...tags, value])
    setDraft('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--text)]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--surface2)] px-2.5 py-1 text-xs font-medium">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="text-[var(--muted)] transition hover:text-red-400"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={placeholder ?? 'Type and press Enter'}
        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
      />
    </div>
  )
}

export function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .list<Project>('projects')
      .then(setProjects)
      .catch(() => toast.error('Could not load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
    setModalOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditing(project)
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description ?? '',
      longDescription: project.longDescription ?? '',
      imageUrl: project.imageUrl ?? '',
      gallery: project.gallery ?? [],
      techStack: project.techStack ?? [],
      category: project.category,
      liveUrl: project.liveUrl ?? '',
      githubUrl: project.githubUrl ?? '',
      featured: project.featured,
    })
    setSlugTouched(true)
    setModalOpen(true)
  }

  const setField = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
  }

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Give the project a title first')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      order: editing ? editing.order : projects.length,
    }
    try {
      if (editing) {
        await api.update<Project>('projects', editing._id, payload)
        toast.success('Project updated')
      } else {
        await api.create<Project>('projects', payload)
        toast.success('Project created')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Save failed — check the fields and try again')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.remove('projects', deleting._id)
      toast.success('Project deleted')
      setDeleting(null)
      load()
    } catch {
      toast.error('Delete failed — please try again')
    } finally {
      setDeleteBusy(false)
    }
  }

  const toggleFeatured = async (project: Project) => {
    try {
      await api.update<Project>('projects', project._id, { featured: !project.featured })
      setProjects((list) =>
        list.map((p) => (p._id === project._id ? { ...p, featured: !p.featured } : p))
      )
    } catch {
      toast.error('Could not update featured flag')
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...projects]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setProjects(next)
    try {
      await api.reorder('projects', next.map((p) => p._id))
    } catch {
      toast.error('Reorder failed — refreshing')
      load()
    }
  }

  const columns: Column<Project>[] = [
    {
      header: 'Project',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.imageUrl ? (
            <img
              src={resolveAssetUrl(p.imageUrl)}
              alt=""
              className="h-12 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--surface2)] text-[var(--muted)]">
              —
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold">
              <span className="truncate">{p.title}</span>
              {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
            </p>
            <p className="font-mono truncate text-xs text-[var(--muted)]">/{p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (p) => <Badge>{p.category}</Badge>,
    },
    {
      header: 'Featured',
      render: (p) => (
        <Toggle
          label={`Featured toggle for ${p.title}`}
          checked={p.featured}
          onChange={() => toggleFeatured(p)}
        />
      ),
    },
    {
      header: 'Order',
      render: (p) => {
        const i = projects.indexOf(p)
        return (
          <div className="flex gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Move ${p.title} up`}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === projects.length - 1}
              aria-label={`Move ${p.title} down`}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="flex gap-1">
          <button
            onClick={() => openEdit(p)}
            aria-label={`Edit ${p.title}`}
            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleting(p)}
            aria-label={`Delete ${p.title}`}
            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Projects</h1>
          <p className="mt-1 text-[var(--muted)]">
            {projects.length} project{projects.length === 1 ? '' : 's'} — drag the order with the arrows.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add project
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <DataTable columns={columns} rows={projects} keyOf={(p) => p._id} emptyText="No projects yet — add your first one." />
      )}

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit project' : 'New project'} wide>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" value={form.title} onChange={(e) => onTitleChange(e.target.value)} />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setField('slug', slugify(e.target.value))
              }}
            />
          </div>
          <Textarea label="Short description" rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          <Textarea label="Long description" rows={5} value={form.longDescription} onChange={(e) => setField('longDescription', e.target.value)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader label="Cover image" value={form.imageUrl} onChange={(url) => setField('imageUrl', url)} />
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text)]">Category</p>
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-[var(--text)] focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--surface2)]/60 px-4 py-3">
                <span className="font-medium">Featured</span>
                <Toggle label="Featured project" checked={form.featured} onChange={(v) => setField('featured', v)} />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text)]">Gallery</p>
            <div className="flex flex-wrap gap-2">
              {form.gallery.map((img) => (
                <div key={img} className="relative">
                  <img src={resolveAssetUrl(img)} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setField('gallery', form.gallery.filter((g) => g !== img))}
                    aria-label="Remove gallery image"
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-1 text-white shadow"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <GalleryAdder onAdd={(url) => setField('gallery', [...form.gallery, url])} />
          </div>

          <TagsInput label="Tech stack" tags={form.techStack} onChange={(t) => setField('techStack', t)} placeholder="e.g. React, Node.js…" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Live URL" value={form.liveUrl} onChange={(e) => setField('liveUrl', e.target.value)} />
            <Input label="GitHub URL" value={form.githubUrl} onChange={(e) => setField('githubUrl', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete project"
        message={`Delete "${deleting?.title}"? This can't be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function GalleryAdder({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState('')
  return (
    <div className="mt-2">
      <ImageUploader
        label="Add gallery image"
        value=""
        onChange={(uploaded) => {
          if (uploaded) onAdd(uploaded)
        }}
      />
      <div className="mt-2 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…or paste an image URL"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (url.trim()) {
              onAdd(url.trim())
              setUrl('')
            }
          }}
        >
          Add
        </Button>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-[var(--muted)]">
        <span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Live demo field</span>
        <span className="inline-flex items-center gap-1"><Github className="h-3 w-3" /> GitHub field</span>
      </div>
    </div>
  )
}
