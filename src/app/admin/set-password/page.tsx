"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordField from "@/components/shared/PasswordField";
import AdminButton from "@/components/admin/AdminButton";

export default function SetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [ready, setReady] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  /* Read the invite tokens from the URL and call setSession() directly.
     Do not use getSession() here. The browser stores sessions in cookies
     that are shared across all tabs on this domain. If an admin is already
     logged in on another tab, getSession() returns the admin session before
     the invite tokens are exchanged. That causes the invited user to
     accidentally operate inside the admin session instead of their own.
     Calling setSession() with the tokens from the invite URL avoids this
     problem entirely. The session on this page always belongs to the
     invited user, regardless of what other tabs are open. */
  useEffect(() => {
    let cancelled = false;

    async function establishInviteSession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const hashError = hash.get("error_description");

      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");

      if (hashError) {
        if (!cancelled) setCheckError(decodeURIComponent(hashError.replace(/\+/g, " ")));
        return;
      }

      /* Classic invite link format: tokens are in the URL hash. */
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        /* Remove the tokens from the URL. This prevents them from
           remaining in the browser history after the page loads. */
        window.history.replaceState(null, "", window.location.pathname);
        if (cancelled) return;
        if (error) {
          setCheckError("This invite link is invalid or has expired. Ask the person who invited you to send a new link.");
          return;
        }
        setReady(true);
        return;
      }

      /* PKCE-style invite links use a one-time code query parameter. */
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        /* Remove the code from the URL after it is used. */
        window.history.replaceState(null, "", window.location.pathname);
        if (cancelled) return;
        if (error) {
          setCheckError("This invite link is invalid or has expired. Ask the person who invited you to send a new link.");
          return;
        }
        setReady(true);
        return;
      }

      /* No invite tokens are present in the URL. The user opened this page
         directly, not from an invite email. Do not fall back to an existing
         session. Doing so would allow the user to act as another person. */
      if (!cancelled) {
        setCheckError("This invite link is invalid or has expired. Ask the person who invited you to send a new link.");
      }
    }

    establishInviteSession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    supabase.auth.updateUser({ password }).then(({ error }) => {
      setIsPending(false);
      if (error) {
        setSubmitError(error.message || "Failed to set password. Please try again.");
        return;
      }
      /* Sign the user out after the password is set. This invalidates the
         invite session so the same invite link cannot be used again.
         Then redirect the user to the public home page. */
      supabase.auth.signOut().then(() => {
        router.push("/");
      });
    });
  }

  return (
    <div className="min-h-screen bg-caffeine-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-stone-200 p-8 sm:p-10 max-w-md w-full shadow-xl">
        <h1 className="font-cozy text-2xl font-bold text-caffeine-dark mb-1">Set your password</h1>
        <p className="text-sm text-stone-500 mb-6">Choose a password to finish setting up your account.</p>

        {!ready && !checkError && <p className="text-sm text-stone-400">Checking your invite link…</p>}

        {checkError && <p role="alert" className="text-sm text-red-600 font-bold">{checkError}</p>}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              id="password"
              name="password"
              label="New password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordField
              id="confirm"
              name="confirm"
              label="Confirm password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {submitError && (
              <p role="alert" className="text-sm text-red-600 font-bold">
                {submitError}
              </p>
            )}

            <AdminButton type="submit" variant="primary" className="w-full py-3" disabled={isPending}>
              {isPending ? "Saving…" : "Set password & continue"}
            </AdminButton>
          </form>
        )}
      </div>
    </div>
  );
}
