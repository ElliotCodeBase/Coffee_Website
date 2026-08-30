"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/types/database";
import { inviteUser, updateUserRole, removeUser } from "@/lib/actions/developer";
import SaveButton from "@/components/admin/SaveButton";

interface StaffUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
}

export default function UsersManager({ users, currentUserId }: { users: StaffUser[]; currentUserId: string }) {
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    setInviteError(null);
    setInviteSuccess(false);
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.error) setInviteError(result.error);
      else setInviteSuccess(true);
    });
  }

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      await updateUserRole(userId, role);
    });
  }

  function handleRemove(userId: string) {
    if (!confirm("Remove this user? They will lose all access immediately.")) return;
    startTransition(async () => {
      await removeUser(userId);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Invite a new staff member</h2>
        <form action={handleInvite} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Email address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="teammate@example.com"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            />
          </div>
          <SaveButton pending={isPending} label="Send invite" />
        </form>
        {inviteError && <p className="text-sm text-red-600 font-semibold mt-3">{inviteError}</p>}
        {inviteSuccess && <p className="text-sm text-green-700 font-semibold mt-3">Invite sent!</p>}
        <p className="text-xs text-stone-400 mt-3">
          New users start with &quot;Site editor&quot; access. Promote them to Developer below if needed.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Staff accounts</h2>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-stone-50">
              <div className="min-w-0">
                <p className="text-sm font-bold text-caffeine-dark truncate">{u.full_name || u.email || u.id}</p>
                {u.full_name && <p className="text-xs text-stone-400 truncate">{u.email}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  disabled={isPending || u.id === currentUserId}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 disabled:opacity-60"
                >
                  <option value="admin">Site editor</option>
                  <option value="developer">Developer</option>
                </select>
                <button
                  onClick={() => handleRemove(u.id)}
                  disabled={isPending || u.id === currentUserId}
                  className="text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
