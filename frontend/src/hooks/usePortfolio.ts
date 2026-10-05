import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { PortfolioData } from '../lib/types'

interface PortfolioState {
  data: PortfolioData | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function usePortfolio(): PortfolioState {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getPortfolio()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, retry: load }
}
