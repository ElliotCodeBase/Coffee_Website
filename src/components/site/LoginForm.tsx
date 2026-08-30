"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginForm() {
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
          className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase text-stone-500 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 font-bold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-caffeine-dark hover:bg-caffeine-card disabled:opacity-60 text-white font-bold py-3 text-sm rounded-2xl transition-colors active:scale-95"
      >
        {isPending ? "Logging in…" : "Log In"}
      </button>
    </form>
  );
}
