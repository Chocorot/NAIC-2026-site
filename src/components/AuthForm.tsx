"use client";

import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  auth,
} from "@/src/lib/firebase";
import { useAuth } from "@/src/context/AuthContext";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { useRouter } from "next/navigation";
import { linkWithPopup } from "firebase/auth";

interface AuthFormProps {
  mode: "login" | "register";
  dict: Dictionary;
  lang: string;
}

export default function AuthForm({ mode, dict, lang }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      if (user?.isAnonymous) {
        await linkWithPopup(user, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      router.push(`/${lang}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || "An error occurred with Google Sign-In");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const credential = EmailAuthProvider.credential(email, password);
        if (user?.isAnonymous) {
          await linkWithCredential(user, credential);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(`/${lang}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
          {mode === "register"
            ? dict.auth?.create_account || "Create Account"
            : dict.auth?.welcome_back || "Welcome Back"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
          {mode === "register"
            ? "Sign up to start tracking your screenings."
            : "Sign in to access your history and results."}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl p-8 border border-zinc-100 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">
              {dict.auth?.email || "Email Address"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all dark:text-white"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">
              {dict.auth?.password || "Password"}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "register"
                ? dict.auth?.sign_up || "Sign Up"
                : dict.auth?.sign_in || "Sign In"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-zinc-300 dark:text-slate-800">
          <div className="h-px flex-1 bg-current" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            OR
          </span>
          <div className="h-px flex-1 bg-current" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white font-black rounded-2xl border-2 border-zinc-100 dark:border-slate-700 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {dict.auth?.google_sign_in || "Continue with Google"}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() =>
            router.push(
              mode === "register" ? `/${lang}/login` : `/${lang}/register`,
            )
          }
          className="text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 transition-colors"
        >
          {mode === "register"
            ? dict.auth?.already_have_account ||
              "Already have an account? Login"
            : dict.auth?.no_account || "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
