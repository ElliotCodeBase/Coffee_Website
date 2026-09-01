"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/lib/actions/auth";
import SaveButton from "@/components/admin/SaveButton";

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changeOwnPassword(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-lg">
      <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Change password</h2>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Current password</label>
          <input
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-2">New password</label>
          <input
            name="new_password"
            type="password"
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Confirm new password</label>
          <input
            name="confirm_password"
            type="password"
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        {success && <p className="text-sm text-green-700 font-semibold">Password updated.</p>}

        <SaveButton pending={isPending} label="Update password" />
      </form>
    </div>
  );
}
