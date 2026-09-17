"use client";

import { useState, useTransition } from "react";
import { addTeamMember, removeTeamMember, transferMainAdmin } from "@/lib/actions/staff";
import SaveButton from "@/components/admin/SaveButton";
import AdminButton from "@/components/admin/AdminButton";

interface TeamUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "staff";
  is_main_admin: boolean;
}

export default function StaffManager({
  team,
  currentUserId,
  currentUserIsMainAdmin,
}: {
  team: TeamUser[];
  currentUserId: string;
  currentUserIsMainAdmin: boolean;
}) {
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
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

  function handleRemove(userId: string, userName: string) {
    if (!confirm(`Remove ${userName || "this account"}? They will lose access immediately.`)) return;
    startTransition(async () => {
      const result = await removeTeamMember(userId);
      if (result?.error) alert(result.error);
    });
  }

  function handleTransfer() {
    if (!transferTarget) return;
    if (!confirm("Transfer the Main Admin role? You will still keep your admin access.")) return;
    setTransferError(null);
    setTransferSuccess(false);
    startTransition(async () => {
      const result = await transferMainAdmin(transferTarget);
      if (result.error) setTransferError(result.error);
      else {
        setTransferSuccess(true);
        setShowTransfer(false);
      }
    });
  }

  const admins = team.filter((u) => u.role === "admin");
  const staff = team.filter((u) => u.role === "staff");
  // Other admins the current main admin can transfer to
  const transferableAdmins = admins.filter((u) => !u.is_main_admin);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Main Admin Transfer Panel — only visible to the current main admin */}
      {currentUserIsMainAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">You are the Main Admin</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your account cannot be deleted until you transfer the Main Admin role to another admin.
              </p>
              {transferableAdmins.length > 0 && (
                <button
                  onClick={() => setShowTransfer((v) => !v)}
                  className="text-xs font-semibold text-amber-800 underline underline-offset-2 mt-2 hover:text-amber-900"
                >
                  {showTransfer ? "Cancel transfer" : "Transfer Main Admin role →"}
                </button>
              )}
              {showTransfer && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                  >
                    <option value="">— Select an admin —</option>
                    {transferableAdmins.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email || u.id}
                      </option>
                    ))}
                  </select>
                  <AdminButton
                    variant="primary"
                    size="sm"
                    onClick={handleTransfer}
                    disabled={!transferTarget || isPending}
                  >
                    Transfer
                  </AdminButton>
                </div>
              )}
              {transferError && <p className="text-xs text-red-700 font-semibold mt-2">{transferError}</p>}
              {transferSuccess && <p className="text-xs text-green-700 font-semibold mt-2">Main Admin role transferred successfully.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-1">Add a team member</h2>
        <p className="text-xs text-stone-400 mb-5">
          They&apos;ll receive an email to set their own password.
        </p>
        <form action={handleAdd} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Full name</label>
              <input
                name="full_name"
                type="text"
                placeholder="Jamie Rivera"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Email address *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="jamie@example.com"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Access level</label>
            <select
              name="role"
              defaultValue="staff"
              className="w-full sm:w-72 px-4 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            >
              <option value="staff">Staff — Menu, Messages & Analytics only</option>
              <option value="admin">Admin — Full access</option>
            </select>
          </div>
          <SaveButton pending={isPending} label="Send invite" />
        </form>
        {inviteError && <p className="text-sm text-red-600 font-semibold mt-3">{inviteError}</p>}
        {inviteSuccess && (
          <p className="text-sm text-green-700 font-semibold mt-3">✓ Invite sent successfully!</p>
        )}
      </div>

      {/* Admins list */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">
          Admins{" "}
          {admins.length > 0 && (
            <span className="text-sm font-normal text-stone-400">({admins.length})</span>
          )}
        </h2>
        {admins.length === 0 ? (
          <p className="text-sm text-stone-400">No other admin accounts yet.</p>
        ) : (
          <div className="space-y-2">
            {admins.map((u) => (
              <TeamRow
                key={u.id}
                user={u}
                onRemove={handleRemove}
                disabled={isPending}
                isSelf={u.id === currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Staff list */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">
          Staff{" "}
          {staff.length > 0 && (
            <span className="text-sm font-normal text-stone-400">({staff.length})</span>
          )}
        </h2>
        {staff.length === 0 ? (
          <p className="text-sm text-stone-400">No staff accounts yet.</p>
        ) : (
          <div className="space-y-2">
            {staff.map((u) => (
              <TeamRow
                key={u.id}
                user={u}
                onRemove={handleRemove}
                disabled={isPending}
                isSelf={u.id === currentUserId}
              />
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
  isSelf,
}: {
  user: TeamUser;
  onRemove: (id: string, name: string) => void;
  disabled: boolean;
  isSelf: boolean;
}) {
  const displayName = user.full_name || user.email || user.id;
  const canRemove = !isSelf && !user.is_main_admin;

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-stone-50 border border-stone-100">
      <div className="min-w-0 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-caffeine-dark/10 text-caffeine-dark flex items-center justify-center text-xs font-bold shrink-0 uppercase">
          {displayName.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-caffeine-dark truncate">{displayName}</p>
            {user.is_main_admin && (
              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                Main Admin
              </span>
            )}
            {isSelf && (
              <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-500 px-2 py-0.5 rounded-md">
                You
              </span>
            )}
          </div>
          {user.full_name && <p className="text-xs text-stone-400 truncate">{user.email}</p>}
        </div>
      </div>
      {canRemove ? (
        <AdminButton
          variant="danger"
          size="sm"
          className="shrink-0"
          onClick={() => onRemove(user.id, displayName)}
          disabled={disabled}
        >
          Remove
        </AdminButton>
      ) : (
        <span className="text-xs text-stone-300 shrink-0 pr-1">
          {isSelf ? "—" : "Protected"}
        </span>
      )}
    </div>
  );
}
