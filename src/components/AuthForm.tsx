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
import { AuthError } from "@/src/types";
import { useRouter } from "next/navigation";
import { Auth, linkWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import LoadingSpinner from "./LoadingSpinner";
import {
  HiOutlineMail,
  HiOutlineCheckCircle,
  HiArrowLeft,
  HiCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import ReCAPTCHA from "react-google-recaptcha";
import { FcGoogle } from "react-icons/fc";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const authErr = err as AuthError;
      console.error(authErr);
      if (authErr.code === "auth/popup-closed-by-user") {
        setError(dict.auth.popup_closed_error);
      } else if (authErr.code === "auth/popup-blocked") {
        setError(dict.auth.popup_blocked_error);
      } else if (authErr.code === "auth/cancelled-popup-request") {
        // Silently ignore if multiple requests were made
      } else {
        setError(authErr.message || "An error occurred with Google Sign-In");
      }
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
        const passwordRequirements = {
          hasLength: password.length >= 8,
          hasUpper: /[A-Z]/.test(password),
          hasLower: /[a-z]/.test(password),
          hasNumber: /[0-9]/.test(password),
          hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };

        if (!Object.values(passwordRequirements).every(Boolean)) {
          throw new Error(dict.auth.error_password_complexity);
        }
        if (password !== confirmPassword) {
          throw new Error(dict.auth.error_password_mismatch);
        }
        if (!agreedToTerms) {
          throw new Error(dict.auth.error_agree_to_terms);
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

      if (error.code === "auth/email-already-in-use") {
        setError(dict.auth.error_email_in_use);
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError(dict.auth.error_invalid_login);
      } else {
        setError(error.message || "An error occurred");
      }
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
              : dict.auth.reset_link_sent}
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
                  <LoadingSpinner
                    size="sm"
                    className={loading ? "opacity-100" : "opacity-0"}
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

  const passwordRequirements = {
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

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
              ? dict.auth.forgot_password_subtitle
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white text-sm pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="w-5 h-5" />
                    ) : (
                      <HiOutlineEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {mode === "register" && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 px-1">
                    <RequirementItem
                      met={passwordRequirements.hasLength}
                      label={dict.auth.password_req_length}
                    />
                    <RequirementItem
                      met={passwordRequirements.hasUpper}
                      label={dict.auth.password_req_upper}
                    />
                    <RequirementItem
                      met={passwordRequirements.hasLower}
                      label={dict.auth.password_req_lower}
                    />
                    <RequirementItem
                      met={passwordRequirements.hasNumber}
                      label={dict.auth.password_req_number}
                    />
                    <RequirementItem
                      met={passwordRequirements.hasSymbol}
                      label={dict.auth.password_req_symbol}
                    />
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">
                    {dict.auth.confirm_password}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none transition-all dark:text-white text-sm pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
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
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                <span>{dict.auth.processing || "Processing..."}</span>
              </div>
            ) : mode === "register" ? (
              dict.auth.register
            ) : mode === "forgot-password" ? (
              dict.auth.send_reset_link
            ) : (
              dict.auth.login
            )}
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
              <FcGoogle className="w-5 h-5" />
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

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 transition-colors duration-300 ${met ? "text-emerald-500" : "text-zinc-400"}`}
    >
      <div
        className={`w-4 h-4 aspect-square rounded-full flex items-center justify-center border transition-all duration-300 ${met ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-200 dark:border-slate-700 bg-transparent text-transparent"}`}
      >
        <HiCheck className="w-3 h-3" />
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}
