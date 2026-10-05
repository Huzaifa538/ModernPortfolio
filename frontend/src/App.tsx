import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PublicPortfolio } from './pages/PublicPortfolio'
import { NotFound } from './pages/NotFound'
import { auth } from './lib/api'
import './index.css'

const AdminLogin = lazy(() =>
  import('./pages/AdminLogin').then((m) => ({ default: m.AdminLogin }))
)
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
)

/** Blocks the dashboard for anyone without a stored admin token. */
function PrivateRoute({ children }: { children: ReactNode }) {
  if (!auth.isLoggedIn()) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6]" />
    </div>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<PublicPortfolio />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard/*"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
              },
            }}
          />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  )
}
