"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "@/src/lib/firebase";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { AuthError } from "@/src/types";
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";

interface AccountSettingsProps {
  dict: Dictionary;
  lang: string;
}

export default function AccountSettings({ dict, lang }: AccountSettingsProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); // For re-auth

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [reauthRequired, setReauthRequired] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || "");
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || user.isAnonymous)) {
      router.push(`/${lang}/login`);
    }
  }, [user, loading, router, lang]);
  
  if (loading || !user || user.isAnonymous) return null;

  const isGoogleUser = user.providerData.some(
    (p) => p.providerId === "google.com",
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage(null);
    try {
      await updateProfile(user, { displayName: username });
      setMessage({ type: "success", text: dict.settings.update_success });
    } catch (err: unknown) {
      const error = err as AuthError;
      setMessage({ type: "error", text: error.message || "An error occurred" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage(null);
    try {
      if (reauthRequired) {
        const credential = EmailAuthProvider.credential(
          user.email!,
          currentPassword,
        );
        await reauthenticateWithCredential(user, credential);
        setReauthRequired(false);
      }

      await updatePassword(user, newPassword);
      setMessage({ type: "success", text: dict.settings.update_success });
      setNewPassword("");
      setCurrentPassword("");
    } catch (err: unknown) {
      const error = err as AuthError;
      if (error.code === "auth/requires-recent-login") {
        setReauthRequired(true);
        setMessage({ type: "error", text: dict.settings.reauth_required });
      } else {
        setMessage({ type: "error", text: error.message || "An error occurred" });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-xl shadow-zinc-200 dark:shadow-none">
          <HiOutlineUser className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-tight">
            {dict.settings.title}
          </h1>
          <p className="text-zinc-500 font-medium">
            {dict.settings.profile_section}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none border dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineUser className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              {dict.settings.profile_section}
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                {dict.auth.email}
              </label>
              <div className="relative group">
                <input
                  type="email"
                  readOnly
                  value={user.email || ""}
                  className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent text-zinc-400 dark:text-zinc-500 text-sm font-medium cursor-not-allowed group-hover:border-zinc-200 dark:group-hover:border-slate-700 transition-all outline-none"
                />
                {isGoogleUser && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-blue-200 dark:border-blue-800">
                    {dict.settings.oauth_label}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                {dict.auth.username}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all dark:text-white text-sm font-medium"
                placeholder="johndoe"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-zinc-950/20 disabled:opacity-50 text-sm"
            >
              {dict.settings.save_changes}
            </button>
          </form>
        </section>

        {/* Security / Password */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none border dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineLockClosed className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              {dict.settings.security_section}
            </h2>
          </div>

          {isGoogleUser ? (
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400">
              <p className="text-sm font-medium leading-relaxed">
                {dict.settings.oauth_label}
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {reauthRequired && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 px-1">
                    {dict.settings.reauth_required}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/30 focus:border-rose-500 outline-none transition-all dark:text-white text-sm"
                    placeholder={dict.settings.enter_new_password}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                  {dict.settings.change_password}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all dark:text-white text-sm font-medium"
                  placeholder={dict.settings.enter_new_password}
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 text-sm"
              >
                {dict.settings.update_password}
              </button>
            </form>
          )}
        </section>
      </div>

      {message && (
        <div
          className={`fixed bottom-8 right-8 p-4 pr-12 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 ${
            message.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {message.type === "success" ? (
            <HiCheckCircle className="w-5 h-5" />
          ) : (
            <HiExclamationCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="absolute right-4 hover:scale-110 transition-transform"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
