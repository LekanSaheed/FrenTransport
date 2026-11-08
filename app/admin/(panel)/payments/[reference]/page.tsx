"use client";
import React, { useState } from "react";
import { Can } from "@/components/admin/access";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPage, DataState, Panel, SmallButton } from "@/components/admin/ui";
import { Alert, PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { DetailList } from "@/components/ui/layout";
import { adminApi, useAdminData, type BookingRow } from "@/libs/admin";
import { formatDateTime, naira } from "@/libs/format";
import type { ApiError } from "@/libs/api";

interface PaymentDetail {
  reference: string;
  provider: string;
  amountKobo: number;
  currency: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
  email: string;
  providerTransactionId: string | null;
  failureReason: string | null;
  verifiedAt: string | null;
  evidence: { method: string; reference: string; note?: string } | null;
  recordedBy: { fullName: string; email: string } | null;
  refunds: { id: string; amountKobo: number; reason: string; status: string; attempts: number; lastError?: string | null; requestedAt: string; processedAt?: string | null }[];
  booking: Pick<BookingRow, "reference" | "title" | "status" | "paymentStatus" | "amountKobo" | "travelDate"> | null;
}

export default function PaymentPage() {
  const { reference } = useParams<{ reference: string }>();
  const { data: p, error, loading, setData } = useAdminData<PaymentDetail>(`/payments/${reference}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function retry(refundId: string) {
    setBusy(refundId);
    setActionError(null);
    try {
      setData(await adminApi.post<PaymentDetail>(`/payments/${reference}/refunds/${refundId}/retry`));
    } catch (e) {
      setActionError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage title={reference} description={p ? `${p.provider} payment · ${p.status}` : undefined} back={{ href: "/admin/payments", label: "Payments" }}>
      <DataState loading={loading} error={error} hasData={!!p}>
        {p && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Payment">
              <DetailList
                rows={[
                  ["Amount", <strong key="a">{naira(p.amountKobo)}</strong>],
                  ["Status", <span key="s" className="capitalize">{p.status}</span>],
                  ["Provider", <span key="p" className="capitalize">{p.provider}</span>],
                  ["Channel", p.channel ?? "—"],
                  ["Customer email", p.email],
                  ["Started", formatDateTime(p.createdAt)],
                  ["Paid", p.paidAt ? formatDateTime(p.paidAt) : "—"],
                  ["Verified with provider", p.verifiedAt ? formatDateTime(p.verifiedAt) : "—"],
                  ["Provider transaction", p.providerTransactionId ?? "—"],
                  ...(p.failureReason ? [["Failure reason", p.failureReason] as [string, string]] : []),
                ]}
              />
            </Panel>
            <div className="space-y-4">
              {p.evidence && (
                <Panel title="Offline payment evidence">
                  <DetailList
                    rows={[
                      ["Method", p.evidence.method.replace("_", " ")],
                      ["Reference", p.evidence.reference],
                      ...(p.evidence.note ? [["Note", p.evidence.note] as [string, string]] : []),
                      ["Recorded by", p.recordedBy ? `${p.recordedBy.fullName} (${p.recordedBy.email})` : "—"],
                    ]}
                  />
                </Panel>
              )}
              <Panel title="Booking">
                {p.booking ? (
                  <div className="space-y-2 text-[13px]">
                    <Link href={`/admin/bookings/${p.booking.reference}`} className="font-semibold text-primary">
                      {p.booking.reference}
                    </Link>
                    <p>{p.booking.title}</p>
                    <p className="text-gray-500">Travel {formatDateTime(p.booking.travelDate)} · {naira(p.booking.amountKobo)}</p>
                    <div className="flex gap-2">
                      <StatusBadge status={p.booking.status} />
                      <PaymentBadge status={p.booking.paymentStatus} />
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-500">Booking not found.</p>
                )}
              </Panel>
              <Panel title="Refunds">
                {actionError && <Alert tone="error" className="mb-3">{actionError}</Alert>}
                {p.refunds.length === 0 ? (
                  <p className="text-[13px] text-gray-500">No refunds on this payment.</p>
                ) : (
                  <ul className="space-y-2 text-[13px]">
                    {p.refunds.map((r) => (
                      <li key={r.id} className="rounded-[8px] border border-border-stroke p-3">
                        <div className="flex items-center justify-between">
                          <strong>{naira(r.amountKobo)}</strong>
                          <span className="capitalize">{r.status}</span>
                        </div>
                        <p className="text-[12px] text-gray-500">
                          {r.reason.replace(/_/g, " ")} · requested {formatDateTime(r.requestedAt)} · {r.attempts} attempt(s)
                          {r.processedAt ? ` · refunded ${formatDateTime(r.processedAt)}` : ""}
                        </p>
                        {r.lastError && <p className="text-[12px] text-red-600">{r.lastError}</p>}
                        {r.status === "failed" && (
                          <div className="mt-2">
                            <Can perm="payments.refund">
                              <SmallButton tone="primary" disabled={busy === r.id} onClick={() => retry(r.id)}>
                                {busy === r.id ? "Retrying…" : "Retry refund"}
                              </SmallButton>
                            </Can>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        )}
      </DataState>
    </AdminPage>
  );
}
