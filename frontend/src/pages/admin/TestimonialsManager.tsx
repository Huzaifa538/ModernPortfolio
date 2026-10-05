import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, resolveAssetUrl } from '../../lib/api'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Testimonial } from '../../lib/types'

interface TestimonialForm {
  name: string
  role: string
  company: string
  quote: string
  avatarUrl: string
}

const EMPTY_FORM: TestimonialForm = { name: '', role: '', company: '', quote: '', avatarUrl: '' }

export function TestimonialsManager() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [form, setForm] = useState<TestimonialForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Testimonial | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .list<Testimonial>('testimonials')
      .then(setItems)
      .catch(() => toast.error('Could not load testimonials'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (t: Testimonial) => {
    setEditing(t)
    setForm({
      name: t.name,
      role: t.role ?? '',
      company: t.company ?? '',
      quote: t.quote,
      avatarUrl: t.avatarUrl ?? '',
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.quote.trim()) {
      toast.error('Name and quote are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.update<Testimonial>('testimonials', editing._id, form)
        toast.success('Testimonial updated')
      } else {
        await api.create<Testimonial>('testimonials', { ...form, order: items.length })
        toast.success('Testimonial added')
      }
      setModalOpen(false)
      load()
    } catch {
      toast.error('Save failed — please try again')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.remove('testimonials', deleting._id)
      toast.success('Testimonial deleted')
      setDeleting(null)
      load()
    } catch {
      toast.error('Delete failed — please try again')
    } finally {
      setDeleteBusy(false)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    try {
      await api.reorder('testimonials', next.map((t) => t._id))
    } catch {
      toast.error('Reorder failed — refreshing')
      load()
    }
  }

  const columns: Column<Testimonial>[] = [
    {
      header: 'Person',
      render: (t) => (
        <div className="flex items-center gap-3">
          {t.avatarUrl ? (
            <img src={resolveAssetUrl(t.avatarUrl)} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-sm font-bold text-white">
              {t.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="font-semibold">{t.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {[t.role, t.company].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Quote',
      render: (t) => <p className="max-w-md truncate text-sm text-[var(--muted)]">“{t.quote}”</p>,
    },
    {
      header: 'Order',
      render: (t) => {
        const i = items.indexOf(t)
        return (
          <div className="flex gap-1">
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-30">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-30">
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
    {
      header: 'Actions',
      render: (t) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(t)} aria-label={`Edit ${t.name}`} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleting(t)} aria-label={`Delete ${t.name}`} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400">
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
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Testimonials</h1>
          <p className="mt-1 text-[var(--muted)]">{items.length} testimonials total.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add testimonial
        </Button>
      </div>

      {loading ? <Skeleton className="h-64" /> : (
        <DataTable columns={columns} rows={items} keyOf={(t) => t._id} emptyText="No testimonials yet." />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit testimonial' : 'New testimonial'}>
        <div className="space-y-4">
          <ImageUploader label="Avatar" value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <Textarea label="Quote" rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add testimonial'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete testimonial"
        message={`Delete the testimonial from "${deleting?.name}"? This can't be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
