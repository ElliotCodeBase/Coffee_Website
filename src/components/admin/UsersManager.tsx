"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/types/database";
import { inviteUser, updateUserRole, removeUser } from "@/lib/actions/developer";
import SaveButton from "@/components/admin/SaveButton";
import AdminButton from "@/components/admin/AdminButton";
import InviteLinkNotice from "@/components/admin/InviteLinkNotice";

interface StaffUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
}

export default function UsersManager({ users, currentUserId }: { users: StaffUser[]; currentUserId: string }) {
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [manualInvite, setManualInvite] = useState<{ link: string; notice?: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    setInviteError(null);
    setInviteSuccess(false);
    setManualInvite(null);
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.error) setInviteError(result.error);
      else if (result.inviteLink) setManualInvite({ link: result.inviteLink, notice: result.notice });
      else setInviteSuccess(true);
    });
  }

  function handleRoleChange(userId: string, role: UserRole) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result.error) setActionError(result.error);
    });
  }

  function handleRemove(userId: string) {
    if (!confirm("Remove this user? They will lose all access immediately.")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await removeUser(userId);
      if (result.error) setActionError(result.error);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Invite a new staff member</h2>
        <form action={handleInvite} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Email address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="teammate@example.com"
              className="w-full px-4 py-3 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            />
          </div>
          <SaveButton pending={isPending} label="Send invite" />
        </form>
        {inviteError && (
          <p role="alert" className="text-sm text-red-600 font-semibold mt-3">
            {inviteError}
          </p>
        )}
        {manualInvite && <InviteLinkNotice link={manualInvite.link} notice={manualInvite.notice} />}
        {inviteSuccess && <p className="text-sm text-green-700 font-semibold mt-3">Invite sent!</p>}
        <p className="text-xs text-stone-400 mt-3">
          New users start with &quot;Site editor&quot; access. Change their role below if needed — Staff can
          only manage the food &amp; drinks menu.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Staff accounts</h2>
        {actionError && (
          <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {actionError}
          </p>
        )}
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-stone-50">
              <div className="min-w-0">
                <p className="text-sm font-bold text-caffeine-dark truncate">{u.full_name || u.email || u.id}</p>
                {u.full_name && <p className="text-xs text-stone-400 truncate">{u.email}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  disabled={isPending || u.id === currentUserId}
                  className="text-xs font-semibold px-3 py-2 rounded-md border border-stone-300 disabled:opacity-60"
                >
                  <option value="admin">Site editor</option>
                  <option value="staff">Staff (Menu only)</option>
                  <option value="developer">Developer</option>
                </select>
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemove(u.id)}
                  disabled={isPending || u.id === currentUserId}
                >
                  Remove
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
