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
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "@/src/lib/firebase";
import { useAuth } from "@/src/context/AuthContext";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { useRouter } from "next/navigation";
import { Auth, linkWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import {
  HiOutlineMail,
  HiOutlineCheckCircle,
  HiArrowLeft,
  HiOutlineRefresh,
} from "react-icons/hi";
import ReCAPTCHA from "react-google-recaptcha";

interface AuthFormProps {
  mode: "login" | "register" | "forgot-password";
  dict: Dictionary;
  lang: string;
}

type ViewState = "form" | "verify_sent" | "reset_sent";

export default function AuthForm({ mode, dict, lang }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resendEmailForm, setResendEmailForm] = useState({
    auth: null as Auth | null,
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [view, setView] = useState<ViewState>("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showResendCaptcha, setShowResendCaptcha] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setView("reset_sent");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!captchaToken) {
      setError(dict.auth.please_verify_captcha);
      return;
    }

    setError("");
    setLoading(true);
    try {
      // If user is already signed in (e.g. from registration flow), use that
      let currentUser = auth.currentUser;

      // If signed out (from login flow), perform a silent login to get the user object
      // Use the preserved credentials to avoid 'missing-email' errors if state is cleared
      const targetEmail = resendEmailForm.email || email;
      const targetPassword = resendEmailForm.password || password;
      const targetAuth = resendEmailForm.auth || auth;

      if (!currentUser?.email && targetEmail && targetPassword) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            targetAuth,
            targetEmail,
            targetPassword,
          );
          currentUser = userCredential.user;
        } catch (authErr: unknown) {
          const error = authErr as Error;
          throw new Error(`Authentication for resend failed: ${error.message}`);
        }
      }

      if (currentUser?.email) {
        await sendEmailVerification(currentUser);
        setResendSuccess(true);
        // Reset captcha for security
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        // Always ensure signed out after sending if they are unverified
        if (!currentUser.emailVerified) {
          await signOut(auth);
        }
      } else {
        throw new Error(
          "No credentials found. Please try logging in again first.",
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
      setShowResendCaptcha(false);
      setResendSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!agreedToTerms) {
          throw new Error("Please agree to the Terms and Privacy Policy");
        }

        setResendEmailForm({
          auth,
          email,
          password,
        });

        if (user?.isAnonymous) {
          const credential = EmailAuthProvider.credential(email, password);
          await linkWithCredential(user, credential);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }

        // Update profile with username and send verification
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: username });
          await sendEmailVerification(auth.currentUser);
          await signOut(auth); // Sign out so they have to verify and log in properly
          setView("verify_sent");
        }
      } else if (mode === "login") {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const loggedUser = userCredential.user;

        if (!loggedUser.emailVerified) {
          // Immediately sign out unverified users locally
          setResendEmailForm({
            auth,
            email,
            password,
          });
          await signOut(auth);
          setError("unverified_login");
          return;
        }

        router.push(`/${lang}`);
      }
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      console.error(error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (view === "verify_sent" || view === "reset_sent") {
    return (
      <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-10 border dark:border-slate-800 text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-8">
            {view === "verify_sent" ? (
              <HiOutlineMail className="w-10 h-10" />
            ) : (
              <HiOutlineCheckCircle className="w-10 h-10" />
            )}
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-4">
            {view === "verify_sent"
              ? dict.auth.check_email
              : dict.auth.reset_password}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-10 leading-relaxed">
            {view === "verify_sent"
              ? dict.auth.verify_email_sent
              : "A password reset link has been sent to your email address."}
          </p>

          {view === "verify_sent" && (
            <div className="mb-8 space-y-6 flex flex-col items-center">
              {showResendCaptcha && !resendSuccess && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                    onChange={(token) => setCaptchaToken(token)}
                    theme="light"
                  />
                </div>
              )}

              {resendSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold animate-in fade-in slide-in-from-top-2">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  {dict.auth.verification_resent}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (showResendCaptcha && captchaToken) {
                      handleResendVerification();
                    } else {
                      setShowResendCaptcha(true);
                    }
                  }}
                  disabled={loading || (showResendCaptcha && !captchaToken)}
                  className="flex items-center gap-2 text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  <HiOutlineRefresh
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {showResendCaptcha
                    ? dict.auth.resend_verification
                    : dict.auth.resend_link}
                </button>
              )}

              {error && error !== "unverified_login" && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                  {error}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              router.push(`/${lang}/login`);
              setView("form");
              setResendSuccess(false);
              setShowResendCaptcha(false);
            }}
            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl hover:scale-[1.02] transition-all"
          >
            {dict.auth.already_have_account}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
          {mode === "register"
            ? dict.auth.create_account
            : mode === "forgot-password"
              ? dict.auth.forgot_password
              : dict.auth.welcome_back}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
          {mode === "register"
            ? dict.auth.register_subtitle
            : mode === "forgot-password"
              ? "Enter your email to receive a reset link."
              : dict.auth.login_subtitle}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-zinc-100 dark:border-slate-800">
        <form
          onSubmit={
            mode === "forgot-password" ? handleForgotPassword : handleSubmit
          }
          className="space-y-4"
        >
          {mode === "register" && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                {dict.auth.username}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
                placeholder="johndoe"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
              {dict.auth.email}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
              placeholder="name@example.com"
            />
          </div>

          {mode !== "forgot-password" && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                  {dict.auth.password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
                  placeholder="••••••••"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                    {dict.auth.confirm_password}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white text-sm"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </>
          )}

          {mode === "register" && (
            <div className="flex items-start gap-3 py-2 px-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="terms"
                className="text-xs text-zinc-500 leading-relaxed"
              >
                {dict.auth.agree_to_terms}
              </label>
            </div>
          )}

          {mode === "login" && (
            <div className="text-right">
              <Link
                href={`/${lang}/login/forgot-password`}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
              >
                {dict.auth.forgot_password}
              </Link>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
              {error === "unverified_login" ? (
                <div className="space-y-4">
                  <p>
                    {dict.auth.unverified_error}{" "}
                    <button
                      type="button"
                      onClick={() => setShowResendCaptcha(true)}
                      className="text-blue-600 dark:text-blue-400 font-black hover:underline underline-offset-4"
                    >
                      {dict.auth.resend_link}
                    </button>
                  </p>

                  {showResendCaptcha && !resendSuccess && (
                    <div className="flex flex-col items-center gap-4 py-2 animate-in fade-in slide-in-from-top-2">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={
                          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""
                        }
                        onChange={(token) => setCaptchaToken(token)}
                        theme="light"
                      />
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={loading || !captchaToken}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        {loading ? "..." : dict.auth.resend_verification}
                      </button>
                    </div>
                  )}

                  {resendSuccess && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      {dict.auth.verification_resent}
                    </p>
                  )}
                </div>
              ) : (
                error
              )}
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
                ? dict.auth.register
                : mode === "forgot-password"
                  ? dict.auth.send_reset_link
                  : dict.auth.login}
          </button>
        </form>

        {mode !== "forgot-password" && (
          <>
            <div className="my-6 flex items-center gap-4 text-zinc-300 dark:text-slate-800">
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
              {dict.auth.google_sign_in}
            </button>
          </>
        )}

        {mode === "forgot-password" && (
          <button
            onClick={() => router.push(`/${lang}/login`)}
            className="w-full mt-4 flex items-center justify-center gap-2 text-zinc-500 font-bold hover:text-zinc-900 transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            {dict.auth.already_have_account}
          </button>
        )}
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
            ? dict.auth.already_have_account
            : dict.auth.no_account}
        </button>
      </div>
    </div>
  );
}
