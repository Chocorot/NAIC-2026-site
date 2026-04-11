"use client";

import { usePathname, useRouter } from "next/navigation";
const locales = ["en", "ms", "zh-hans", "zh-hant", "ja", "ko", "de", "ru"];

export default function LanguageSwitcher({
  currentLocale,
  isMobile = false,
}: {
  currentLocale: string;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;

    if (isMobile) {
      localStorage.setItem("mobile-menu-stay-open", "true");
    }
    localStorage.setItem("screening-stay-active", "true");

    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const localeNames: Record<string, string> = {
    en: "English",
    "zh-hans": "简体中文",
    "zh-hant": "繁體中文",
    ko: "한국어",
    ru: "Русский",
    ms: "Bahasa Melayu",
    ja: "日本語",
    de: "Deutsch",
  };

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
  );
}
