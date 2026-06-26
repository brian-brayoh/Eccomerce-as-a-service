"use client";

import { useState } from "react";
import { updateStaffRole, resetStaffPassword, removeStaff } from "./actions";

type StaffMember = { id: string; name: string; email: string; role: string; joinedAt: string };
type RoleInfo = Record<string, { label: string; color: string }>;

export default function StaffRow({
  member, currentUserId, currentUserRole, roleInfo, canManage,
}: {
  member: StaffMember;
  currentUserId: string;
  currentUserRole: string;
  roleInfo: RoleInfo;
  canManage: boolean;
}) {
  const [role, setRole] = useState(member.role);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const isSelf = member.id === currentUserId;
  const isSuperAdmin = member.role === "SUPER_ADMIN";
  const canChangeRole = canManage && !isSelf && !isSuperAdmin && (currentUserRole === "SUPER_ADMIN" || role !== "ADMIN");

  if (hidden) return null;

  const ri = roleInfo[role] ?? roleInfo.STAFF;

  async function handleRoleChange(newRole: string) {
    setLoading(true); setError("");
    const result = await updateStaffRole(member.id, newRole as "ADMIN" | "STAFF");
    if (result?.error) { setError(result.error); } else { setRole(newRole); }
    setLoading(false);
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData();
    fd.set("newPassword", newPassword);
    const result = await resetStaffPassword(member.id, fd);
    if (result?.error) { setError(result.error); } else { setResetSuccess(true); setShowReset(false); setNewPassword(""); }
    setLoading(false);
  }

  async function handleRemove() {
    if (!confirm(`Remove ${member.name} from this store?`)) return;
    setLoading(true);
    const result = await removeStaff(member.id);
    if (result?.error) { setError(result.error); setLoading(false); } else { setHidden(true); }
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">{member.name}</span>
            {isSelf && <span className="text-xs text-gray-400">(you)</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-gray-500 text-xs">{member.email}</td>
        <td className="px-4 py-3">
          {canChangeRole ? (
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={loading}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer ${ri.color}`}
            >
              <option value="STAFF">Staff</option>
              {currentUserRole === "SUPER_ADMIN" && <option value="ADMIN">Admin</option>}
            </select>
          ) : (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ri.color}`}>{ri.label}</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">{member.joinedAt}</td>
        {canManage && (
          <td className="px-4 py-3 text-right">
            {!isSelf && !isSuperAdmin && (
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowReset((v) => !v)} className="text-xs font-medium text-brand-500 hover:underline">
                  Reset password
                </button>
                <button onClick={handleRemove} disabled={loading} className="text-xs text-gray-400 hover:text-danger-500">
                  Remove
                </button>
              </div>
            )}
          </td>
        )}
      </tr>

      {/* Inline error */}
      {error && (
        <tr>
          <td colSpan={5} className="px-4 pb-2">
            <p className="text-xs text-danger-600">{error}</p>
          </td>
        </tr>
      )}

      {/* Password reset row */}
      {showReset && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-4 py-3">
            <form onSubmit={handlePasswordReset} className="flex items-center gap-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 chars)"
                minLength={8}
                required
                className="!w-56"
              />
              <button type="submit" disabled={loading} className="btn-primary text-xs py-1.5 px-3">
                {loading ? "Saving…" : "Set password"}
              </button>
              <button type="button" onClick={() => setShowReset(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </form>
            {resetSuccess && <p className="text-xs text-brand-600 mt-1">✓ Password updated</p>}
          </td>
        </tr>
      )}
    </>
  );
}
