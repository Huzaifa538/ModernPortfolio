import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Ghost } from 'lucide-react'

export function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 — Page not found</title>
      </Helmet>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-6">
        <div className="aurora" aria-hidden>
          <div className="aurora-blob aurora-1" />
          <div className="aurora-blob aurora-3" />
        </div>
        <div className="relative text-center">
          <Ghost className="mx-auto h-16 w-16 text-[#8b5cf6]" />
          <p className="font-display mt-6 text-8xl font-bold text-gradient">404</p>
          <h1 className="font-display mt-4 text-2xl font-bold">This page wandered off</h1>
          <p className="mt-3 text-[var(--muted)]">
            The link might be broken, or the page moved somewhere else.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
          >
            Back home
          </Link>
        </div>
      </div>
    </>
  )
}
