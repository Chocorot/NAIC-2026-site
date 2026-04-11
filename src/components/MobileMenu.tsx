"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function MobileMenu({
  lang,
  dict,
}: {
  lang: string;
  dict: Dictionary;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Define a minimal store for the persistence flag. 
  // useSyncExternalStore is the "blessed" way in React 18+ to sync with external 
  // systems like localStorage while handling hydration and evitando cascading renders.
  const stayOpenFlag = useSyncExternalStore(
    () => () => {}, // No need to subscribe to changes after mount
    () => typeof window !== 'undefined' && localStorage.getItem("mobile-menu-stay-open") === "true",
    () => false // Server default
  );

  // Adjust state during render - This follows the "Adjusting state during render" pattern
  // from the docs. React handles this re-render before painting the first frame.
  // Adjust state during render - Only if on mobile width to prevent desktop menu show
  if (stayOpenFlag && !isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
    setIsOpen(true);
  }

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Cleanup the persistence flag once it has been consumed
      if (typeof window !== 'undefined' && localStorage.getItem("mobile-menu-stay-open") === "true") {
        localStorage.removeItem("mobile-menu-stay-open");
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const links = [
    { href: `/${lang}`, label: dict.navigation.screening },
    { href: `/${lang}/about`, label: dict.navigation.about },
    { href: `/${lang}/performance`, label: dict.navigation.performance },
  ];

  const isActive = (href: string) => {
    if (href === `/${lang}`) {
      return pathname === href || pathname === `/${lang}/`;
    }
    return pathname.startsWith(href);
  };

  const menuOverlay = (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-9999 flex flex-col bg-white dark:bg-slate-950"
          style={{ backgroundColor: "var(--background)" }}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex flex-col h-full bg-white dark:bg-slate-950"
          >
            <header className="h-16 w-full border-b border-zinc-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                  href={`/${lang}`}
                  className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400"
                >
                  <span className="bg-blue-600 text-white p-1 rounded-md text-sm">
                    NAIC
                  </span>
                  <span>DR Screening</span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  aria-label="Close menu"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col bg-white dark:bg-slate-950">
              <nav className="flex flex-col space-y-4 mb-12">
                {links.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-3xl font-extrabold py-4 border-b border-zinc-50 dark:border-slate-900 block transition-colors ${
                        isActive(link.href)
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-400 dark:text-zinc-500 hover:text-blue-600"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-auto space-y-8 pb-12"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        Appearance
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        Dark or Light Mode
                      </span>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-800">
                    <span className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Language Select
                    </span>
                    <LanguageSwitcher currentLocale={lang} isMobile={true} />
                  </div>
                </div>
              </motion.div>
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
        aria-label="Open menu"
      >
        <HiOutlineMenuAlt3 className="w-6 h-6" />
      </button>

      {typeof document !== "undefined" &&
        createPortal(menuOverlay, document.body)}
    </>
  );
}
