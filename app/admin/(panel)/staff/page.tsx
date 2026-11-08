"use client";
import React, { useState } from "react";
import { HiMiniCheck } from "react-icons/hi2";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, Modal, Panel, SmallButton } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/access";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi, useAdminData, type Permission, type StaffMember, type StaffRole, type StaffRoleInfo } from "@/libs/admin";
import { formatDateTime } from "@/libs/format";
import { cn } from "@/libs/utils";
import type { ApiError } from "@/libs/api";

interface StaffData {
  staff: StaffMember[];
  roles: StaffRoleInfo[];
  permissions: Record<Permission, string>;
}

export default function StaffPage() {
  const me = useAdmin();
  const { data, error, loading, reload } = useAdminData<StaffData>("/staff");
  const [modal, setModal] = useState<{ kind: "invite" } | { kind: "role"; member: StaffMember } | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function act(fn: () => Promise<unknown>, text: string) {
    setNotice(null);
    try {
      await fn();
      setNotice({ tone: "success", text });
      reload();
    } catch (e) {
      setNotice({ tone: "error", text: (e as ApiError).message });
    }
  }

  return (
    <AdminPage
      title="Staff"
      description="Who can use the admin site and what each person can do. Changes apply immediately, even to people who are signed in. Every change is recorded in the activity log."
      actions={<Button label="Invite staff" onClick={() => setModal({ kind: "invite" })} />}
    >
      {notice && (
        <Alert tone={notice.tone} className="mb-4">
          {notice.text}
        </Alert>
      )}
      <DataState loading={loading} error={error} hasData={!!data}>
        {data && (
          <>
            <DataTable
              rows={data.staff}
              rowKey={(s) => s.id}
              empty="No staff yet"
              columns={[
                {
                  header: "Name",
                  cell: (s) => (
                    <div>
                      <strong className={s.status === "disabled" ? "text-gray-400" : ""}>{s.fullName}</strong>
                      {s.id === me?.id && <span className="ml-2 rounded-full bg-tertiary px-2 py-0.5 text-[10.5px] font-extrabold text-primary">You</span>}
                      <p className="text-[12px] text-gray-500">{s.email}</p>
                    </div>
                  ),
                },
                { header: "Role", cell: (s) => <span className="font-semibold">{s.roleLabel}</span> },
                {
                  header: "Status",
                  cell: (s) =>
                    s.status === "disabled" ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">Disabled</span>
                    ) : s.invitePending ? (
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">Invite sent</span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Active</span>
                    ),
                },
                { header: "Last sign-in", cell: (s) => (s.lastLoginAt ? formatDateTime(s.lastLoginAt) : <span className="text-gray-400">Never</span>) },
                {
                  header: "",
                  className: "text-right",
                  cell: (s) =>
                    s.id === me?.id ? (
                      <span className="text-[12px] text-gray-400">Another owner can change your access</span>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        {s.status === "active" && <SmallButton onClick={() => setModal({ kind: "role", member: s })}>Change role</SmallButton>}
                        {s.status === "active" && s.invitePending && (
                          <SmallButton onClick={() => act(() => adminApi.post(`/staff/${s.id}/resend-invite`), `A new invitation was emailed to ${s.email}.`)}>Resend invite</SmallButton>
                        )}
                        {s.status === "active" ? (
                          <SmallButton
                            tone="danger"
                            onClick={() =>
                              window.confirm(`Disable ${s.fullName}? They'll be signed out immediately${s.invitePending ? " and their invitation cancelled" : ""}.`) &&
                              act(() => adminApi.patch(`/staff/${s.id}`, { status: "disabled" }), `${s.fullName} was disabled and signed out.`)
                            }
                          >
                            Disable
                          </SmallButton>
                        ) : (
                          <SmallButton onClick={() => act(() => adminApi.patch(`/staff/${s.id}`, { status: "active" }), `${s.fullName} can sign in again.`)}>Re-enable</SmallButton>
                        )}
                      </div>
                    ),
                },
              ]}
            />
            <RoleMatrix roles={data.roles} permissions={data.permissions} />
          </>
        )}
      </DataState>

      {data && modal?.kind === "invite" && (
        <InviteModal roles={data.roles} onClose={() => setModal(null)} onDone={(text) => (setModal(null), setNotice({ tone: "success", text }), reload())} />
      )}
      {data && modal?.kind === "role" && (
        <RoleModal
          member={modal.member}
          roles={data.roles}
          onClose={() => setModal(null)}
          onDone={(text) => (setModal(null), setNotice({ tone: "success", text }), reload())}
        />
      )}
    </AdminPage>
  );
}

/** Role cards to pick from (shared by invite and change-role). */
function RolePicker({ roles, value, onChange }: { roles: StaffRoleInfo[]; value: StaffRole; onChange: (r: StaffRole) => void }) {
  return (
    <div role="radiogroup" aria-label="Role" className="grid gap-2">
      {roles.map((r) => (
        <button
          key={r.id}
          type="button"
          role="radio"
          aria-checked={value === r.id}
          onClick={() => onChange(r.id)}
          className={cn(
            "flex items-start gap-3 rounded-[12px] border-2 px-4 py-3 text-left transition",
            value === r.id ? "border-primary bg-tertiary/50" : "border-border-stroke hover:border-primary/40",
          )}
        >
          <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", value === r.id ? "border-primary bg-primary text-white" : "border-gray-300")}>
            {value === r.id && <HiMiniCheck size={12} />}
          </span>
          <span>
            <span className="block text-[14px] font-extrabold text-ink">{r.label}</span>
            <span className="block text-[12.5px] leading-[150%] text-gray-500">{r.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function InviteModal({ roles, onClose, onDone }: { roles: StaffRoleInfo[]; onClose: () => void; onDone: (text: string) => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", role: "bookings" as StaffRole });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await adminApi.post<StaffMember>("/staff", form);
      onDone(`Invitation emailed to ${s.email}. The link lets them set a password and expires in 3 days.`);
    } catch (err) {
      const e2 = err as ApiError;
      const fields = Object.values(e2.fieldErrors);
      setError(fields.length ? fields.join(" ") : e2.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open title="Invite staff" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="s-name">
            <Input id="s-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} />
          </Field>
          <Field label="Work email" htmlFor="s-email" hint="Not an address used for a customer account.">
            <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
        </div>
        <RolePicker roles={roles} value={form.role} onChange={(role) => setForm({ ...form, role })} />
        <Button type="submit" fullWidth label="Send invitation" loading={busy} />
      </form>
    </Modal>
  );
}

function RoleModal({ member, roles, onClose, onDone }: { member: StaffMember; roles: StaffRoleInfo[]; onClose: () => void; onDone: (text: string) => void }) {
  const [role, setRole] = useState<StaffRole>(member.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (role === member.role) return onClose();
    setBusy(true);
    setError(null);
    try {
      const s = await adminApi.patch<StaffMember>(`/staff/${member.id}`, { role });
      onDone(`${s.fullName} is now ${s.roleLabel}. This applies immediately.`);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open title={`Change ${member.fullName}'s role`} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <RolePicker roles={roles} value={role} onChange={setRole} />
        <Button type="submit" fullWidth label={role === member.role ? "No change" : "Save role"} loading={busy} disabled={role === member.role} />
      </form>
    </Modal>
  );
}

/** What each role can do, at a glance. */
function RoleMatrix({ roles, permissions }: { roles: StaffRoleInfo[]; permissions: Record<Permission, string> }) {
  return (
    <Panel className="mt-5" title="What each role can do">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-border-stroke text-[10.5px] uppercase tracking-[0.08em] text-gray-500">
              <th className="py-2 pr-3 font-extrabold">Permission</th>
              {roles.map((r) => (
                <th key={r.id} className="px-2 py-2 text-center font-extrabold">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(permissions) as Permission[]).map((p) => (
              <tr key={p} className="border-b border-border-stroke last:border-0">
                <td className="py-2 pr-3 text-gray-700">{permissions[p]}</td>
                {roles.map((r) => (
                  <td key={r.id} className="px-2 py-2 text-center">
                    {r.permissions.includes(p) ? <HiMiniCheck className="mx-auto text-emerald-600" size={16} aria-label="Yes" /> : <span className="text-gray-300" aria-label="No">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
