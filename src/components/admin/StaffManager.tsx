"use client";

import { useState, useTransition } from "react";
import { addStaffMember, removeStaffMember } from "@/lib/actions/staff";
import SaveButton from "@/components/admin/SaveButton";

interface StaffUser {
  id: string;
  email: string | null;
  full_name: string | null;
}

export default function StaffManager({ staff }: { staff: StaffUser[] }) {
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setInviteError(null);
    setInviteSuccess(false);
    startTransition(async () => {
      const result = await addStaffMember(formData);
      if (result.error) setInviteError(result.error);
      else setInviteSuccess(true);
    });
  }

  function handleRemove(userId: string) {
    if (!confirm("Remove this staff account? They will lose access immediately.")) return;
    startTransition(async () => {
      await removeStaffMember(userId);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Add a staff member</h2>
        <form action={handleAdd} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Full name</label>
              <input
                name="full_name"
                type="text"
                placeholder="Jamie Rivera"
                className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Email address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="jamie@example.com"
                className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              />
            </div>
          </div>
          <SaveButton pending={isPending} label="Send invite" />
        </form>
        {inviteError && <p className="text-sm text-red-600 font-semibold mt-3">{inviteError}</p>}
        {inviteSuccess && <p className="text-sm text-green-700 font-semibold mt-3">Invite sent!</p>}
        <p className="text-xs text-stone-400 mt-3">
          They&apos;ll get an email to set their own password. Once they sign in, they&apos;ll only be able to
          manage the food &amp; drinks menu.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Staff accounts</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-stone-400">No staff accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {staff.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-stone-50">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-caffeine-dark truncate">{u.full_name || u.email || u.id}</p>
                  {u.full_name && <p className="text-xs text-stone-400 truncate">{u.email}</p>}
                </div>
                <button
                  onClick={() => handleRemove(u.id)}
                  disabled={isPending}
                  className="text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
