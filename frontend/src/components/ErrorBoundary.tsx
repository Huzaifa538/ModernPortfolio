import { Component, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Catches render crashes so the whole site doesn't go blank. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Keep it in the console for debugging; nothing sensitive leaves the browser.
    console.error('UI crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
          <div className="glass max-w-md rounded-2xl p-10 text-center">
            <TriangleAlert className="mx-auto h-12 w-12 text-[#8b5cf6]" />
            <h1 className="font-display mt-5 text-2xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-[var(--muted)]">
              The page hit an unexpected snag. A refresh usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
            >
              Refresh the page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
