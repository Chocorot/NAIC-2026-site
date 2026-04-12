"use client";

import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { auth } from "@/src/lib/firebase";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { HiOutlineUserCircle, HiLogout } from "react-icons/hi";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function AccountMenu({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: string;
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    setIsOpen(false);
  };

  const isGuest = !user || user.isAnonymous;

  if (isGuest) {
    return (
      <Link
        href={`/${lang}/login`}
        className="flex items-center gap-2 h-10 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-950/20"
      >
        <HiOutlineUserCircle className="w-6 h-6" />
        {dict.auth.login}
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 p-1 pr-4 bg-zinc-100 dark:bg-slate-900 rounded-2xl border border-zinc-200 dark:border-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-800 transition-all group"
      >
        <div className="w-8 h-8 rounded-xl bg-blue-600 overflow-hidden flex items-center justify-center text-white text-[10px] font-black shadow-sm group-hover:scale-105 transition-transform">
          {user.photoURL ? (
            <Image src={user.photoURL} alt="Profile" width={32} height={32} />
          ) : (
            user.displayName?.[0].toUpperCase() ||
            user.email?.[0].toUpperCase() ||
            "U"
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
          {user.displayName || user.email?.split("@")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-slate-800 p-2 py-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-slate-800 mb-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
              {dict.auth?.account || "Account"}
            </div>
            <div className="text-xs font-bold truncate text-zinc-900 dark:text-white">
              {user.email}
            </div>
          </div>

          <Link
            href={`/${lang}/account/settings`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-xl transition-all"
          >
            {dict.auth.settings}
          </Link>

          <Link
            href={`/${lang}/history`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-xl transition-all"
          >
            {dict.navigation.history}
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
          >
            <HiLogout className="w-4 h-4" />
            {dict.auth?.sign_out || "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
