"use client";
import React, { useState } from "react";
import { useCan } from "@/components/admin/access";
import { useParams } from "next/navigation";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, Modal, Panel } from "@/components/admin/ui";
import { Field, Textarea } from "@/components/ui/form";
import { Alert, PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { DetailList } from "@/components/ui/layout";
import { adminApi, useAdminData, type BookingRow } from "@/libs/admin";
import { BOOKING_TYPE_LABEL, formatDateTime, naira } from "@/libs/format";
import type { ApiError } from "@/libs/api";

interface CustomerDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: "active" | "disabled";
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  bookings: Omit<BookingRow, "customer" | "hasAccount" | "openModificationRequests" | "quotation">[];
}

export default function CustomerPage() {
  const can = useCan();
  const { id } = useParams<{ id: string }>();
  const { data: c, error, loading, reload } = useAdminData<CustomerDetail>(`/customers/${id}`);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function toggle() {
    if (!c) return;
    setBusy(true);
    setActionError(null);
    try {
      const next = c.status === "active" ? "disabled" : "active";
      await adminApi.post(`/customers/${c.id}/status`, { status: next, reason: reason.trim() });
      setOpen(false);
      setReason("");
      setNotice(next === "disabled" ? "Account disabled and signed out everywhere." : "Account re-enabled.");
      await reload();
    } catch (e) {
      setActionError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage title={c?.fullName ?? "Customer"} description={c?.email} back={{ href: "/admin/customers", label: "Customers" }}>
      <DataState loading={loading} error={error} hasData={!!c}>
        {c && (
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              {notice && <Alert tone="success">{notice}</Alert>}
              <Panel title={`Bookings (${c.bookings.length})`}>
                <DataTable
                  rows={c.bookings}
                  rowKey={(b) => b.reference}
                  href={(b) => `/admin/bookings/${b.reference}`}
                  empty="No bookings on this account"
                  columns={[
                    { header: "Reference", cell: (b) => b.reference },
                    { header: "Booking", cell: (b) => <div><p>{b.title}</p><p className="text-[12px] text-gray-500">{BOOKING_TYPE_LABEL[b.type]}</p></div> },
                    { header: "Travel", cell: (b) => formatDateTime(b.travelDate) },
                    { header: "Amount", cell: (b) => naira(b.amountKobo) },
                    { header: "Status", cell: (b) => <div className="flex flex-col items-start gap-1"><StatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} /></div> },
                  ]}
                />
              </Panel>
            </div>
            <aside className="space-y-3">
              <Panel title="Account">
                <DetailList
                  rows={[
                    ["Email", c.email],
                    ["Verified", c.emailVerified ? "Yes" : "No"],
                    ["Phone", c.phone ?? "—"],
                    ["Joined", formatDateTime(c.createdAt)],
                    ["Last sign-in", c.lastLoginAt ? formatDateTime(c.lastLoginAt) : "Never"],
                    ["Status", c.status === "active" ? "Active" : <span key="d" className="text-red-600">Disabled</span>],
                  ]}
                />
                {can("customers.manage") && (
                <Button
                  fullWidth
                  className={c.status === "active" ? "mt-4 !border-red-300 !text-red-600" : "mt-4"}
                  variant={c.status === "active" ? "secondary" : "primary"}
                  label={c.status === "active" ? "Disable account" : "Re-enable account"}
                  onClick={() => setOpen(true)}
                />
                )}
              </Panel>
            </aside>
            <Modal open={open} title={c.status === "active" ? "Disable account" : "Re-enable account"} onClose={() => setOpen(false)}>
              <div className="space-y-4">
                {c.status === "active" && <Alert tone="warning">The customer is signed out everywhere and can&apos;t sign in. Their bookings stay valid and can still be managed by email code.</Alert>}
                {actionError && <Alert tone="error">{actionError}</Alert>}
                <Field label="Reason (recorded in the audit log)" htmlFor="reason">
                  <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <Button fullWidth label="Confirm" loading={busy} disabled={reason.trim().length < 3} onClick={toggle} />
              </div>
            </Modal>
          </div>
        )}
      </DataState>
    </AdminPage>
  );
}
