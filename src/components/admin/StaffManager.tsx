"use client";

import { useState, useTransition } from "react";
import { addTeamMember, removeTeamMember } from "@/lib/actions/staff";
import SaveButton from "@/components/admin/SaveButton";

interface TeamUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "staff";
}

export default function StaffManager({ team }: { team: TeamUser[] }) {
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setInviteError(null);
    setInviteSuccess(false);
    startTransition(async () => {
      const result = await addTeamMember(formData);
      if (result.error) setInviteError(result.error);
      else setInviteSuccess(true);
    });
  }

  function handleRemove(userId: string) {
    if (!confirm("Remove this account? They will lose access immediately.")) return;
    startTransition(async () => {
      await removeTeamMember(userId);
    });
  }

  const admins = team.filter((u) => u.role === "admin");
  const staff = team.filter((u) => u.role === "staff");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Add a team member</h2>
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
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Access level</label>
            <select
              name="role"
              defaultValue="staff"
              className="w-full sm:w-64 px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            >
              <option value="staff">Staff — menu only</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>
          <SaveButton pending={isPending} label="Send invite" />
        </form>
        {inviteError && <p className="text-sm text-red-600 font-semibold mt-3">{inviteError}</p>}
        {inviteSuccess && <p className="text-sm text-green-700 font-semibold mt-3">Invite sent!</p>}
        <p className="text-xs text-stone-400 mt-3">
          They&apos;ll get an email to set their own password. Staff can only manage the food &amp; drinks menu;
          admins get the same access you have.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Admins</h2>
        {admins.length === 0 ? (
          <p className="text-sm text-stone-400">No other admin accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {admins.map((u) => (
              <TeamRow key={u.id} user={u} onRemove={handleRemove} disabled={isPending} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Staff</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-stone-400">No staff accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {staff.map((u) => (
              <TeamRow key={u.id} user={u} onRemove={handleRemove} disabled={isPending} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({
  user,
  onRemove,
  disabled,
}: {
  user: TeamUser;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-stone-50">
      <div className="min-w-0">
        <p className="text-sm font-bold text-caffeine-dark truncate">{user.full_name || user.email || user.id}</p>
        {user.full_name && <p className="text-xs text-stone-400 truncate">{user.email}</p>}
      </div>
      <button
        onClick={() => onRemove(user.id)}
        disabled={disabled}
        className="text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-40 shrink-0"
      >
        Remove
      </button>
    </div>
  );
}
