"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HiOutlineGlobeAlt, HiChevronDown, HiCheck } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { setLanguageCookie } from "@/src/lib/cookies";
import { Dictionary } from "@/app/[lang]/dictionaries";

const locales = ["en", "ms", "zh-hans", "zh-hant", "ja", "ko", "de", "ru"];

export default function LanguageSwitcher({
  currentLocale,
  dict,
  isMobile = false,
}: {
  currentLocale: string;
  dict: Dictionary;
  isMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    if (typeof window === "undefined") return;

    // Set cookie for persistence
    setLanguageCookie(newLocale);

    if (isMobile) {
      localStorage.setItem("mobile-menu-stay-open", "true");
    }
    localStorage.setItem("screening-stay-active", "true");

    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setIsOpen(false);
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

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-3 rounded-2xl bg-zinc-100 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-800 transition-all text-zinc-600 dark:text-zinc-400 group shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Select language"
      >
        <HiOutlineGlobeAlt className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
        <HiChevronDown
          className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 min-w-50 bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 overflow-hidden ${
              isMobile ? "right-0 bottom-10" : "right-0"
            }`}
          >
            <div className="max-h-87.5 overflow-y-auto scrollbar-hide">
              <div id="select-language-label" className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {dict.navigation.select_language}
              </div>
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                    currentLocale === locale
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <span>{localeNames[locale] || locale.toUpperCase()}</span>
                  {currentLocale === locale && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <HiCheck className="w-4 h-4" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
