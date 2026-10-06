import { Suspense, lazy } from 'react'
import { Helmet } from 'react-helmet-async'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { ScrollProgress } from '../components/layout/ScrollProgress'
import { CursorGlow } from '../components/layout/CursorGlow'
import { BackToTop } from '../components/layout/BackToTop'
import { Hero } from '../components/sections/Hero'
import { About } from '../components/sections/About'
import { Skills } from '../components/sections/Skills'
import { Experience } from '../components/sections/Experience'
import { Projects } from '../components/sections/Projects'
import { Testimonials } from '../components/sections/Testimonials'
import { Contact } from '../components/sections/Contact'
// The chat widget pulls in the whole Firebase SDK — load it lazily so the
// first paint isn't held up by ~400KB of chat code the visitor may never open.
const ChatWidget = lazy(() =>
  import('../components/ChatWidget').then((m) => ({ default: m.ChatWidget }))
)
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'

function LoadingShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-28">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-24 w-3/4" />
        <Skeleton className="mt-4 h-16 w-1/2" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PublicPortfolio() {
  const { data, loading, error, retry } = usePortfolio()
  const profile = data?.profile ?? null

  const seoTitle = profile?.seoTitle || (profile?.fullName ? `${profile.fullName} — Portfolio` : 'Portfolio')
  const seoDescription =
    profile?.seoDescription ||
    profile?.heroSubtitle ||
    'Personal portfolio — projects, skills and experience.'

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        {profile?.avatarUrl && <meta property="og:image" content={profile.avatarUrl} />}
      </Helmet>

      <ScrollProgress />
      <CursorGlow />

      {loading ? (
        <LoadingShell />
      ) : error ? (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
          <div className="glass max-w-md rounded-2xl p-10 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="font-display mt-5 text-2xl font-bold">Couldn't load the portfolio</h1>
            <p className="mt-3 text-[var(--muted)]">
              The server didn't respond. Make sure the backend is running and try again.
            </p>
            <div className="mt-6">
              <Button onClick={retry}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navbar name={profile?.fullName} />
          <main>
            <Hero profile={profile} />
            <About profile={profile} />
            <Skills skills={data?.skills ?? []} loading={false} />
            <Experience experiences={data?.experiences ?? []} loading={false} />
            <Projects projects={data?.projects ?? []} loading={false} />
            <Testimonials testimonials={data?.testimonials ?? []} loading={false} />
            <Contact profile={profile} />
          </main>
          <Footer profile={profile} />
        </>
      )}

      <BackToTop />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </>
  )
}
