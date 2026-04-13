"use client";

import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { Dictionary } from "@/app/[lang]/dictionaries";

export default function ThemeToggle({ dict }: { dict: Dictionary }) {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    // Set cookie for server-side persistence
    document.cookie = `theme=${newTheme}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 dark:hover:bg-slate-800 transition-all text-zinc-600 dark:text-zinc-400 shadow-sm"
      aria-label={dict.navigation.toggle_theme}
    >
      <MdOutlineDarkMode className="w-5 h-5 block dark:hidden animate-in zoom-in duration-300" />

      <MdOutlineLightMode className="w-5 h-5 hidden dark:block animate-in zoom-in duration-300" />
    </button>
  );
}
