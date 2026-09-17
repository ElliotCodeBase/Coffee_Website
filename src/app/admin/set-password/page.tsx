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

  // IMPORTANT: this page must not trust whatever session happens to already
  // be sitting in the browser's cookies. The Supabase browser client
  // (@supabase/ssr) stores its session in cookies, which are shared across
  // every tab of the same browser for this domain — so if an admin already
  // has a tab open and logged in, calling `getSession()` here can resolve
  // with THEIR session before the invite link's own tokens have been
  // exchanged, since that exchange happens asynchronously. That race is
  // what caused setting a staff password to silently land the invited
  // person in the admin's own session instead of their own.
  //
  // The fix: pull the invite's access/refresh tokens directly out of the
  // URL ourselves and call `setSession()` explicitly, so this page only
  // ever acts on the session the invite link actually grants — never on
  // whatever else happens to be in cookies from another tab.
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

      // Classic invite-link format: tokens land in the URL hash.
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Clear the hash so the tokens don't linger in browser history.
        window.history.replaceState(null, "", window.location.pathname);
        if (cancelled) return;
        if (error) {
          setCheckError("This invite link is invalid or has expired. Ask whoever invited you to send a new one.");
          return;
        }
        setReady(true);
        return;
      }

      // Newer PKCE-style invite links pass a one-time `code` query param.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", window.location.pathname);
        if (cancelled) return;
        if (error) {
          setCheckError("This invite link is invalid or has expired. Ask whoever invited you to send a new one.");
          return;
        }
        setReady(true);
        return;
      }

      // No invite tokens in the URL at all — this page was opened directly,
      // not from a fresh invite link. Never fall back to an ambient session
      // here (that's exactly the bleed-through this page exists to avoid).
      if (!cancelled) {
        setCheckError("This invite link is invalid or has expired. Ask whoever invited you to send a new one.");
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
