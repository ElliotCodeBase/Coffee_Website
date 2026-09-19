"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions/auth";
import PasswordField from "@/components/shared/PasswordField";
import AdminButton from "@/components/admin/AdminButton";

export default function LoginForm({ redirectTo = "" }: { redirectTo?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase text-stone-500 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>
      <PasswordField id="password" name="password" label="Password" required autoComplete="current-password" />

      {error && (
        <p role="alert" className="text-sm text-red-600 font-bold">
          {error}
        </p>
      )}

      <AdminButton type="submit" variant="primary" className="w-full py-3" disabled={isPending}>
        {isPending ? "Logging in…" : "Log In"}
      </AdminButton>
    </form>
  );
}
