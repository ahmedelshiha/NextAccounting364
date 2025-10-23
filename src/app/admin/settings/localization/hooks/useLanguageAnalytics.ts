"use client"

import { useCallback } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'

export function useLanguageAnalytics() {
  const { setLoading, setAnalyticsData, setError } = useLocalizationContext()

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const r = await fetch('/api/admin/user-language-analytics')
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load analytics')
      setAnalyticsData(d.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics')
      throw e
    } finally {
      setLoading(false)
    }
  }, [setLoading, setAnalyticsData, setError])

  return { loadAnalytics }
}
