import { useEffect, useState } from 'react'

/**
 * Watches a list of section ids and returns the one currently in view.
 * Used to highlight the active link in the navbar.
 */
export function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '')

  useEffect(() => {
    if (ids.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )

    const elements: Element[] = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) {
        observer.observe(el)
        elements.push(el)
      }
    })

    return () => {
      elements.forEach((el) => observer.unobserve(el))
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')])

  return active
}
