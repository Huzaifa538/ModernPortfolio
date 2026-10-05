import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { api, auth } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/layout/ThemeToggle'

export function Settings() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!current || !next || !confirm) {
      setError('Fill in all three fields.')
      return
    }
    if (next.length < 6) {
      setError('The new password needs at least 6 characters.')
      return
    }
    if (next !== confirm) {
      setError("The new passwords don't match.")
      return
    }

    setBusy(true)
    try {
      await api.changePassword(current, next)
      toast.success('Password changed — please sign in again')
      auth.clearToken()
      navigate('/admin/login', { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Password change is not available on the backend yet.')
      } else {
        const message = axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined
        setError(message ?? 'Password change failed — please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const logout = () => {
    auth.clearToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-[var(--muted)]">Account and appearance preferences.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-gradient-to-br from-[#6366f1]/15 to-[#22d3ee]/15 p-3 text-[#8b5cf6]">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Change password</h2>
            <p className="text-sm text-[var(--muted)]">You'll be signed out after changing it.</p>
          </div>
        </div>

        <form onSubmit={changePassword} className="mt-6 space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy}>
            {busy ? 'Changing…' : 'Change password'}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Appearance</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Switch between dark and light themes.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Session</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Sign out of the admin panel on this device.</p>
        <div className="mt-4">
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </Card>
    </div>
  )
}
