import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Skill } from '../../lib/types'

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools', 'Other'] as const

interface SkillForm {
  name: string
  category: Skill['category']
  level: number
}

const EMPTY_FORM: SkillForm = { name: '', category: 'Frontend', level: 70 }

export function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [form, setForm] = useState<SkillForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Skill | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .list<Skill>('skills')
      .then(setSkills)
      .catch(() => toast.error('Could not load skills'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (skill: Skill) => {
    setEditing(skill)
    setForm({ name: skill.name, category: skill.category, level: skill.level })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Give the skill a name first')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.update<Skill>('skills', editing._id, form)
        toast.success('Skill updated')
      } else {
        await api.create<Skill>('skills', { ...form, order: skills.length })
        toast.success('Skill added')
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
      await api.remove('skills', deleting._id)
      toast.success('Skill deleted')
      setDeleting(null)
      load()
    } catch {
      toast.error('Delete failed — please try again')
    } finally {
      setDeleteBusy(false)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...skills]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSkills(next)
    try {
      await api.reorder('skills', next.map((s) => s._id))
    } catch {
      toast.error('Reorder failed — refreshing')
      load()
    }
  }

  const columns: Column<Skill>[] = [
    {
      header: 'Skill',
      render: (s) => (
        <div>
          <p className="font-semibold">{s.name}</p>
          <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-[var(--surface2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#22d3ee]"
              style={{ width: `${s.level}%` }}
            />
          </div>
        </div>
      ),
    },
    { header: 'Category', render: (s) => <Badge>{s.category}</Badge> },
    { header: 'Level', render: (s) => <span className="font-mono text-sm">{s.level}%</span> },
    {
      header: 'Order',
      render: (s) => {
        const i = skills.indexOf(s)
        return (
          <div className="flex gap-1">
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${s.name} up`} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-30">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === skills.length - 1} aria-label={`Move ${s.name} down`} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-30">
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
    {
      header: 'Actions',
      render: (s) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400">
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
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Skills</h1>
          <p className="mt-1 text-[var(--muted)]">{skills.length} skills total.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add skill
        </Button>
      </div>

      {loading ? <Skeleton className="h-64" /> : (
        <DataTable columns={columns} rows={skills} keyOf={(s) => s._id} emptyText="No skills yet — add your first one." />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit skill' : 'New skill'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text)]">Category</p>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Skill['category'] })}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-3 text-[var(--text)] focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text)]">Proficiency</p>
              <span className="font-mono text-sm text-[var(--muted)]">{form.level}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
              aria-label="Skill proficiency"
              className="w-full accent-[#8b5cf6]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add skill'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete skill"
        message={`Delete "${deleting?.name}"? This can't be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
