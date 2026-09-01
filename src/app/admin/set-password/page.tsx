"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Supabase's browser client auto-parses the invite link's URL hash
  // (access_token/refresh_token) and turns it into a real session. We
  // just need to confirm that a session actually landed before showing
  // the form — if it didn't, the link was invalid or already used.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        setCheckError("This invite link is invalid or has expired. Ask whoever invited you to send a new one.");
      }
    });
  }, [supabase]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setSubmitError("Passwords don't match.");
      return;
    }

    setIsPending(true);
    supabase.auth.updateUser({ password }).then(({ error }) => {
      setIsPending(false);
      if (error) {
        setSubmitError(error.message || "Failed to set password. Please try again.");
        return;
      }
      router.push("/admin");
    });
  }

  return (
    <div className="min-h-screen bg-caffeine-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl">
        <h1 className="font-cozy text-2xl font-bold text-caffeine-dark mb-1">Set your password</h1>
        <p className="text-sm text-stone-500 mb-6">Choose a password to finish setting up your account.</p>

        {!ready && !checkError && <p className="text-sm text-stone-400">Checking your invite link…</p>}

        {checkError && <p role="alert" className="text-sm text-red-600 font-bold">{checkError}</p>}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase text-stone-500 mb-2">
                New password
              </label>
              <input
                type="password"
                id="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-xs font-bold uppercase text-stone-500 mb-2">
                Confirm password
              </label>
              <input
                type="password"
                id="confirm"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              />
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-red-600 font-bold">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-caffeine-dark hover:bg-caffeine-card disabled:opacity-60 text-white font-bold py-3 text-sm rounded-2xl transition-colors active:scale-95"
            >
              {isPending ? "Saving…" : "Set password & continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
