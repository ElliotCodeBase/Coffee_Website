"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/lib/actions/auth";
import SaveButton from "@/components/admin/SaveButton";
import PasswordField from "@/components/shared/PasswordField";

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
        <PasswordField name="current_password" label="Current password" required autoComplete="current-password" />
        <PasswordField name="new_password" label="New password" required autoComplete="new-password" />
        <PasswordField name="confirm_password" label="Confirm new password" required autoComplete="new-password" />

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        {success && <p className="text-sm text-green-700 font-semibold">Password updated.</p>}

        <SaveButton pending={isPending} label="Update password" />
      </form>
    </div>
  );
}
