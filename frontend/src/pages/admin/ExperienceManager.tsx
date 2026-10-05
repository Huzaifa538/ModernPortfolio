import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Experience } from '../../lib/types'

interface ExperienceForm {
  role: string
  company: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

const EMPTY_FORM: ExperienceForm = {
  role: '',
  company: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

export function ExperienceManager() {
  const [items, setItems] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Experience | null>(null)
  const [form, setForm] = useState<ExperienceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Experience | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .list<Experience>('experiences')
      .then(setItems)
      .catch(() => toast.error('Could not load experience entries'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (exp: Experience) => {
    setEditing(exp)
    setForm({
      role: exp.role,
      company: exp.company,
      startDate: exp.startDate ?? '',
      endDate: exp.endDate ?? '',
      current: exp.current,
      description: exp.description ?? '',
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.role.trim() || !form.company.trim()) {
      toast.error('Role and company are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.update<Experience>('experiences', editing._id, form)
        toast.success('Experience updated')
      } else {
        await api.create<Experience>('experiences', { ...form, order: items.length })
        toast.success('Experience added')
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
      await api.remove('experiences', deleting._id)
      toast.success('Experience deleted')
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
      await api.reorder('experiences', next.map((e) => e._id))
    } catch {
      toast.error('Reorder failed — refreshing')
      load()
    }
  }

  const columns: Column<Experience>[] = [
    {
      header: 'Role',
      render: (e) => (
        <div>
          <p className="font-semibold">{e.role}</p>
          <p className="text-sm text-[var(--muted)]">{e.company}</p>
        </div>
      ),
    },
    {
      header: 'Period',
      render: (e) => (
        <span className="text-sm text-[var(--muted)]">
          {e.startDate || '—'} → {e.current ? 'Present' : e.endDate || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (e) => (e.current ? <Badge tone="success">Current</Badge> : <Badge>Past</Badge>),
    },
    {
      header: 'Order',
      render: (e) => {
        const i = items.indexOf(e)
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
      render: (e) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(e)} aria-label={`Edit ${e.role}`} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleting(e)} aria-label={`Delete ${e.role}`} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400">
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
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Experience</h1>
          <p className="mt-1 text-[var(--muted)]">{items.length} entries total.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add experience
        </Button>
      </div>

      {loading ? <Skeleton className="h-64" /> : (
        <DataTable columns={columns} rows={items} keyOf={(e) => e._id} emptyText="No experience entries yet." />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit experience' : 'New experience'}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start date" placeholder="e.g. Jan 2022" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End date" placeholder="e.g. Dec 2023" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} disabled={form.current} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface2)]/60 px-4 py-3">
            <span className="font-medium">I currently work here</span>
            <Toggle label="Currently working here" checked={form.current} onChange={(v) => setForm({ ...form, current: v })} />
          </div>
          <Textarea label="Description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add experience'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete experience"
        message={`Delete "${deleting?.role} at ${deleting?.company}"? This can't be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
