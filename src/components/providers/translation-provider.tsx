'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Locale, defaultLocale, loadTranslations, detectLocale, TranslationContext } from '@/lib/i18n'
import { GenderType } from '@/lib/gender-rules'
import enTranslations from '@/app/locales/en.json'

interface TranslationProviderProps {
  children: ReactNode
  initialLocale?: Locale
  initialGender?: GenderType
}

export function TranslationProvider({ children, initialLocale, initialGender }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale)
  const [translations, setTranslations] = useState<Record<string, string>>(() => enTranslations)
  const [isLoading, setIsLoading] = useState(true)
  const [currentGender, setGender] = useState<GenderType | undefined>(initialGender)

  // Load translations when locale changes
  useEffect(() => {
    async function loadLocaleTranslations() {
      setIsLoading(true)
      try {
        const newTranslations = await loadTranslations(locale)
        setTranslations(newTranslations)
      } catch (error) {
        console.error('Failed to load translations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLocaleTranslations()
  }, [locale])

  // Detect and set initial locale on client side
  useEffect(() => {
    if (!initialLocale && typeof window !== 'undefined') {
      const detectedLocale = detectLocale()
      if (detectedLocale !== locale) {
        setLocaleState(detectedLocale)
      }
    }
  }, [initialLocale, locale])

  // Update locale and persist to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
      // Update document direction for RTL languages
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = newLocale
      // Toggle rtl helper class on body for CSS targeting
      if (newLocale === 'ar') {
        document.body.classList.add('rtl')
      } else {
        document.body.classList.remove('rtl')
      }
    }
  }

  // Set initial document attributes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = locale
      // Ensure body rtl class is set on initial load
      if (locale === 'ar') {
        document.body.classList.add('rtl')
      } else {
        document.body.classList.remove('rtl')
      }
    }
  }, [locale])

  const contextValue = {
    locale,
    translations,
    setLocale,
    currentGender,
    setGender
  }

  // To avoid hydration mismatches, render children immediately and provide translations via context.
  // While translations are loading we keep the page content visible (prevents server/client mismatch)
  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
      {isLoading && (
        <div aria-hidden="true" className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 opacity-80" />
        </div>
      )}
    </TranslationContext.Provider>
  )
}
