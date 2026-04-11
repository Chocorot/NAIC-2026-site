'use client'

import { usePathname, useRouter } from 'next/navigation'
const locales = ['en', 'zh', 'ms', 'ja', 'de']

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLanguageChange = (newLocale: string) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
    
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const localeNames: Record<string, string> = {
    en: 'English',
    zh: '中文',
    ms: 'Bahasa Melayu',
    ja: '日本語',
    de: 'Deutsch'
  }

  return (
    <div className="flex gap-2">
      <select
        value={currentLocale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale] || locale.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  )
}
