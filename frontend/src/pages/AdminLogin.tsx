import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import axios from 'axios'
import { api, auth } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)

  // If a valid token already exists, skip the login form entirely.
  useEffect(() => {
    if (!auth.isLoggedIn()) {
      setChecking(false)
      return
    }
    api
      .getMe()
      .then(() => navigate('/admin/dashboard', { replace: true }))
      .catch(() => {
        auth.clearToken()
        setChecking(false)
      })
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)

    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }

    setBusy(true)
    try {
      const res = await api.login({ username: username.trim(), password })
      auth.setToken(res.token)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const message = axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined
      setError(message ?? 'Login failed — please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6]" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin login — Portfolio</title>
      </Helmet>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-5">
        <div className="aurora" aria-hidden>
          <div className="aurora-blob aurora-1" />
          <div className="aurora-blob aurora-2" />
        </div>

        <div className="glass relative w-full max-w-sm rounded-3xl p-8 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-white shadow-lg shadow-indigo-500/30">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="font-display mt-5 text-center text-2xl font-bold">Admin login</h1>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            Sign in to manage your portfolio content.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" loading={busy} className="w-full" size="lg">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            <a href="/" className="text-[var(--muted)] underline-offset-4 hover:text-[var(--text)] hover:underline">
              ← Back to the site
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
