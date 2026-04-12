"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dictionary } from "@/app/[lang]/dictionaries";

export default function Navbar({
  lang,
  dict,
}: {
  lang: string;
  dict: Dictionary;
}) {
  const pathname = usePathname();

  const links = [
    { href: `/${lang}`, label: dict.navigation.screening },
    { href: `/${lang}/history`, label: dict.navigation.history },
    { href: `/${lang}/about`, label: dict.navigation.about },
    { href: `/${lang}/performance`, label: dict.navigation.performance },
  ];

  const isActive = (href: string) => {
    if (href === `/${lang}`) {
      return pathname === href || pathname === `/${lang}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center gap-8">
      {links.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-bold transition-all hover:text-blue-600 ${
              active
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-500 dark:text-zinc-500 hover:-translate-y-px"
            } relative py-2`}
          >
            {link.label}
            {active && (
              <div className="absolute bottom-0 left-0 w-full flex justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-in zoom-in duration-300" />
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
