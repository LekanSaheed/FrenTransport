"use client";
import React, { useState } from "react";
import { useCan } from "@/components/admin/access";
import Link from "next/link";
import BookingView from "@/components/booking/BookingView";
import { AdminPage, DataState, Modal, Panel, SmallButton } from "@/components/admin/ui";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { DetailList } from "@/components/ui/layout";
import Button from "@/components/Button";
import { adminApi, toKobo, toNaira, useAdminData, type ActivityRow, type Paged, type PaymentRow } from "@/libs/admin";
import { formatDateTime, naira } from "@/libs/format";
import type { ApiError } from "@/libs/api";
import type { BookingDetails } from "@/libs/types";

interface AdminBooking extends BookingDetails {
  id: string;
  userId: string | null;
  quotations: { _id: string; amountKobo: number; status: string; validUntil: string; createdAt: string; notes?: string; breakdown?: { label: string; amountKobo: number }[] }[];
  payments: (Omit<PaymentRow, "bookingReference" | "email" | "failureReason" | "evidence"> & { refunds: PaymentRow["refunds"] })[];
}

type ActionKey = "quote" | "reject" | "offline" | "cancel" | "decision" | "edit" | "manualRefund" | null;

export default function AdminBookingDetail({ reference }: { reference: string }) {
  const can = useCan();
  const { data: b, error, loading, reload } = useAdminData<AdminBooking>(`/bookings/${encodeURIComponent(reference)}`);
  const activity = useAdminData<Paged<ActivityRow>>("/activity", { targetType: "booking", targetId: reference, pageSize: 50 });
  const [action, setAction] = useState<ActionKey>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const done = async (message: string) => {
    setAction(null);
    setNotice(message);
    await Promise.all([reload(), activity.reload()]);
  };

  const live = b && !["cancelled", "expired", "completed"].includes(b.status);
  const isHire = b && b.type !== "seat";
  const canQuote = isHire && b && ["pending_approval", "pending_payment"].includes(b.status);
  const awaitingPayment = b && ["pending_payment", "payment_processing"].includes(b.status) && b.amountKobo != null;

  return (
    <AdminPage title={reference} description={b ? `Created ${formatDateTime(b.createdAt)}${b.userId ? " · linked to a customer account" : " · guest booking"}` : undefined} back={{ href: isHire ? "/admin/hire-requests" : "/admin/bookings", label: isHire ? "Hire requests" : "Bookings" }}>
      <DataState loading={loading} error={error} hasData={!!b}>
        {b && (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {notice && <Alert tone="success">{notice}</Alert>}
              <BookingView booking={b} />

              {b.quotations.length > 0 && (
                <Panel title="Quotations">
                  <ul className="space-y-3 text-[13px]">
                    {b.quotations.map((q) => (
                      <li key={q._id} className="rounded-[8px] border border-border-stroke p-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{naira(q.amountKobo)}</span>
                          <span className="capitalize text-gray-500">{q.status}</span>
                        </div>
                        <p className="text-[12px] text-gray-500">
                          Sent {formatDateTime(q.createdAt)} · valid until {formatDateTime(q.validUntil)}
                        </p>
                        {q.breakdown?.length ? <p className="mt-1 text-[12px]">{q.breakdown.map((l) => `${l.label}: ${naira(l.amountKobo)}`).join(" · ")}</p> : null}
                        {q.notes && <p className="mt-1 text-[12px] text-gray-600">{q.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              <Panel title="Payments">
                {b.payments.length === 0 ? (
                  <p className="text-[13px] text-gray-500">No payment attempts yet.</p>
                ) : (
                  <ul className="space-y-2 text-[13px]">
                    {b.payments.map((p) => (
                      <li key={p.reference} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-border-stroke p-3">
                        <div>
                          <Link href={`/admin/payments/${p.reference}`} className="font-semibold text-primary">
                            {p.reference}
                          </Link>
                          <p className="text-[12px] text-gray-500">
                            {p.provider} · {p.channel ?? "—"} · {formatDateTime(p.paidAt ?? p.createdAt)}
                          </p>
                          {p.refunds.map((r, i) => (
                            <p key={i} className="text-[12px] text-orange-700">
                              Refund {naira(r.amountKobo)} ({r.reason.replace(/_/g, " ")}) — {r.status}
                            </p>
                          ))}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{naira(p.amountKobo)}</p>
                          <p className="text-[12px] capitalize text-gray-500">{p.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {b.modificationRequests.length > 0 && (
                <Panel title="Change requests">
                  <ul className="space-y-3">
                    {b.modificationRequests.map((m) => (
                      <ModificationItem key={m.id} reference={b.reference} request={m} onDone={done} />
                    ))}
                  </ul>
                </Panel>
              )}

              <Panel title="Activity">
                {activity.data?.items.length ? (
                  <ol className="space-y-2.5 text-[13px]">
                    {activity.data.items.map((a, i) => (
                      <li key={a._id ?? i}>
                        <p>{a.summary}</p>
                        <p className="text-[11px] text-gray-500">{formatDateTime(a.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-[13px] text-gray-500">No admin actions yet.</p>
                )}
                <p className="mt-3 border-t border-border-stroke pt-3 text-[12px] text-gray-500">
                  Status history:{" "}
                  {b.statusHistory.map((h) => `${h.status.replace(/_/g, " ")} (${formatDateTime(h.at)})`).join(" → ")}
                </p>
              </Panel>
            </div>

            <aside className="space-y-3">
              <Panel title="Actions">
                <div className="flex flex-col gap-2">
                  {b.cancellation?.status === "requested" && can("bookings.cancel") && <Button label="Review cancellation request" onClick={() => setAction("decision")} />}
                  {canQuote && can("hire.manage") && <Button label={b.quotation ? "Update quotation" : "Send quotation"} onClick={() => setAction("quote")} />}
                  {canQuote && can("hire.manage") && <Button variant="secondary" label="Reject request" onClick={() => setAction("reject")} />}
                  {awaitingPayment && can("payments.record_offline") && <Button variant="secondary" label="Record offline payment" onClick={() => setAction("offline")} />}
                  {b.paymentStatus === "refund_pending" && can("payments.refund") && <Button variant="secondary" label="Record manual refund" onClick={() => setAction("manualRefund")} />}
                  {live && can("bookings.edit") && <Button variant="secondary" label="Edit details" onClick={() => setAction("edit")} />}
                  {live && can("bookings.cancel") && <Button variant="secondary" className="!border-red-300 !text-red-600" label="Cancel booking" onClick={() => setAction("cancel")} />}
                  {!live && b.paymentStatus !== "refund_pending" && <p className="text-[13px] text-gray-500">No actions — this booking is {b.status}.</p>}
                </div>
              </Panel>
              <Panel title="Summary">
                <DetailList
                  rows={[
                    ["Amount", naira(b.amountKobo)],
                    ["Payment due", b.paymentDueAt ? formatDateTime(b.paymentDueAt) : "—"],
                    ["Account", b.userId ? <Link key="u" href={`/admin/customers/${b.userId}`} className="text-primary">View customer</Link> : "Guest"],
                  ]}
                />
              </Panel>
            </aside>

            <QuoteModal open={action === "quote"} booking={b} onClose={() => setAction(null)} onDone={done} />
            <ReasonModal open={action === "reject"} title="Reject hire request" label="Reason (sent to the customer)" submitLabel="Reject request" onClose={() => setAction(null)} onSubmit={(reason) => adminApi.post(`/bookings/${b.reference}/reject`, { reason }).then(() => done("Request rejected and the customer emailed."))} />
            <ReasonModal open={action === "manualRefund"} title="Record manual refund" label="How was the money returned? (e.g. transfer reference)" submitLabel="Record refund" onClose={() => setAction(null)} onSubmit={(note) => adminApi.post(`/bookings/${b.reference}/manual-refund`, { note }).then(() => done("Manual refund recorded."))} />
            <OfflinePaymentModal open={action === "offline"} booking={b} onClose={() => setAction(null)} onDone={done} />
            <CancelModal open={action === "cancel"} booking={b} onClose={() => setAction(null)} onDone={done} />
            <DecisionModal open={action === "decision"} booking={b} onClose={() => setAction(null)} onDone={done} />
            <EditModal open={action === "edit"} booking={b} onClose={() => setAction(null)} onDone={done} />
          </div>
        )}
      </DataState>
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ */
/* Action modals                                                      */
/* ------------------------------------------------------------------ */

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const err = e as ApiError;
      const fields = Object.values(err.fieldErrors ?? {});
      setError(fields.length ? `${err.message}: ${fields.join("; ")}` : err.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

interface ModalProps {
  open: boolean;
  booking: AdminBooking;
  onClose: () => void;
  onDone: (message: string) => Promise<void>;
}

function ReasonModal({
  open,
  title,
  label,
  submitLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  label: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e) => (e.preventDefault(), run(() => onSubmit(reason.trim())))} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label={label} htmlFor="reason">
          <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
        </Field>
        <Button type="submit" fullWidth label={submitLabel} loading={busy} disabled={reason.trim().length < 3} />
      </form>
    </Modal>
  );
}

function QuoteModal({ open, booking, onClose, onDone }: ModalProps) {
  const [amount, setAmount] = useState(toNaira(booking.quotation?.amountKobo ?? null));
  const [lines, setLines] = useState<{ label: string; amount: string }[]>([{ label: "", amount: "" }]);
  const [notes, setNotes] = useState("");
  const [validHours, setValidHours] = useState("48");
  const { busy, error, run } = useSubmit();
  const breakdown = lines.filter((l) => l.label.trim() && l.amount).map((l) => ({ label: l.label.trim(), amountKobo: toKobo(l.amount) }));
  const breakdownTotal = breakdown.reduce((s, l) => s + l.amountKobo, 0);

  return (
    <Modal open={open} title={booking.quotation ? "Update quotation" : "Send quotation"} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await adminApi.post(`/bookings/${booking.reference}/quotations`, {
              amountKobo: toKobo(amount),
              ...(breakdown.length && { breakdown }),
              ...(notes.trim() && { notes: notes.trim() }),
              validHours: Number(validHours),
            });
            await onDone("Quotation sent to the customer by email.");
          });
        }}
        className="space-y-4"
      >
        {error && <Alert tone="error">{error}</Alert>}
        {booking.quotation && <Alert tone="info">Sending a new quotation replaces the current one ({naira(booking.quotation.amountKobo)}).</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Total price (₦)" htmlFor="amount">
            <Input id="amount" type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Valid for (hours)" htmlFor="valid" hint="Capped at the pickup time.">
            <Input id="valid" type="number" min={1} max={336} value={validHours} onChange={(e) => setValidHours(e.target.value)} />
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-gray-600">Breakdown (optional)</p>
          {lines.map((l, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_130px] gap-2">
              <Input aria-label="Line item" placeholder="e.g. Coaster + driver" value={l.label} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <Input aria-label="Line amount (₦)" type="number" min={0} placeholder="₦" value={l.amount} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
            </div>
          ))}
          <SmallButton onClick={() => setLines((ls) => [...ls, { label: "", amount: "" }])}>+ Add line</SmallButton>
          {breakdown.length > 0 && breakdownTotal !== toKobo(amount) && (
            <p className="mt-2 text-[12px] text-orange-600">Breakdown adds up to {naira(breakdownTotal)}, not the total.</p>
          )}
        </div>
        <Field label="Notes for the customer (optional)" htmlFor="notes">
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button type="submit" fullWidth label="Send quotation" loading={busy} disabled={!amount || Number(amount) <= 0} />
      </form>
    </Modal>
  );
}

function OfflinePaymentModal({ open, booking, onClose, onDone }: ModalProps) {
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(toNaira(booking.amountKobo));
  const [note, setNote] = useState("");
  const { busy, error, run } = useSubmit();
  return (
    <Modal open={open} title="Record offline payment" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await adminApi.post(`/bookings/${booking.reference}/offline-payment`, { method, reference: reference.trim(), amountKobo: toKobo(amount), ...(note.trim() && { note: note.trim() }) });
            await onDone("Payment recorded and the booking confirmed.");
          });
        }}
        className="space-y-4"
      >
        <Alert tone="warning">Only record money you have actually received and can trace. This is logged with your name.</Alert>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Method" htmlFor="method">
          <Select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="bank_transfer">Bank transfer</option>
            <option value="pos">POS</option>
            <option value="cash">Cash (receipt)</option>
          </Select>
        </Field>
        <Field label="Bank, POS or receipt reference" htmlFor="ref">
          <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} required minLength={3} />
        </Field>
        <Field label="Amount received (₦)" htmlFor="amt" hint={`Must equal the amount due: ${naira(booking.amountKobo)}`}>
          <Input id="amt" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Note (optional)" htmlFor="note">
          <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button type="submit" fullWidth label="Record payment" loading={busy} disabled={reference.trim().length < 3} />
      </form>
    </Modal>
  );
}

function CancelModal({ open, booking, onClose, onDone }: ModalProps) {
  const paid = booking.status === "confirmed" ? (booking.amountKobo ?? 0) : 0;
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState(toNaira(paid));
  const { busy, error, run } = useSubmit();
  return (
    <Modal open={open} title={`Cancel ${booking.reference}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await adminApi.post(`/bookings/${booking.reference}/cancel`, { note: note.trim(), ...(paid > 0 && { refundAmountKobo: toKobo(refund || 0) }) });
            await onDone("Booking cancelled. The customer has been emailed.");
          });
        }}
        className="space-y-4"
      >
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Reason (internal)" htmlFor="note">
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} required minLength={3} />
        </Field>
        {paid > 0 ? (
          <Field label="Refund (₦)" htmlFor="refund" hint={`Paid: ${naira(paid)}. Online payments are refunded automatically; offline ones stay “refund pending”.`}>
            <Input id="refund" type="number" min={0} max={paid / 100} step="0.01" value={refund} onChange={(e) => setRefund(e.target.value)} />
          </Field>
        ) : (
          <p className="text-[13px] text-gray-500">Nothing has been paid, so there&apos;s nothing to refund.</p>
        )}
        <Button type="submit" fullWidth className="!bg-red-600" label="Cancel booking" loading={busy} disabled={note.trim().length < 3} />
      </form>
    </Modal>
  );
}

function DecisionModal({ open, booking, onClose, onDone }: ModalProps) {
  const [refund, setRefund] = useState(toNaira(booking.cancellation?.refundAmountKobo ?? 0));
  const [note, setNote] = useState("");
  const { busy, error, run } = useSubmit();
  const decide = (approve: boolean) =>
    run(async () => {
      await adminApi.post(`/bookings/${booking.reference}/cancellation-decision`, {
        approve,
        ...(approve && { refundAmountKobo: toKobo(refund || 0) }),
        ...(note.trim() && { note: note.trim() }),
      });
      await onDone(approve ? "Cancellation approved; refund started." : "Cancellation request rejected; the customer has been told.");
    });
  return (
    <Modal open={open} title="Cancellation request" onClose={onClose}>
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-[13px] text-gray-600">
          The customer asked to cancel{booking.cancellation?.reason ? `: “${booking.cancellation.reason}”` : "."} Policy suggests a refund of{" "}
          <strong>{naira(booking.cancellation?.refundAmountKobo ?? 0)}</strong> of {naira(booking.amountKobo)} paid.
        </p>
        <Field label="Refund if approved (₦)" htmlFor="refund">
          <Input id="refund" type="number" min={0} step="0.01" value={refund} onChange={(e) => setRefund(e.target.value)} />
        </Field>
        <Field label="Note to the customer (optional)" htmlFor="note">
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" label="Reject" onClick={() => decide(false)} disabled={busy} />
          <Button label="Approve" onClick={() => decide(true)} loading={busy} />
        </div>
      </div>
    </Modal>
  );
}

function EditModal({ open, booking, onClose, onDone }: ModalProps) {
  const [contact, setContact] = useState({ fullName: booking.contact.fullName, email: booking.contact.email, phone: booking.contact.phone });
  const [passengers, setPassengers] = useState((booking.passengers ?? []).map((p) => ({ seat: p.seat, fullName: p.fullName })));
  const [notes, setNotes] = useState(booking.hire?.notes ?? "");
  const [reason, setReason] = useState("");
  const { busy, error, run } = useSubmit();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const changedContact = Object.fromEntries(Object.entries(contact).filter(([k, v]) => v !== booking.contact[k as keyof typeof contact]));
    const changedPassengers = passengers.filter((p) => booking.passengers?.find((o) => o.seat === p.seat)?.fullName !== p.fullName);
    run(async () => {
      await adminApi.patch(`/bookings/${booking.reference}`, {
        reason: reason.trim(),
        ...(Object.keys(changedContact).length && { contact: changedContact }),
        ...(changedPassengers.length && { passengers: changedPassengers }),
        ...(booking.type !== "seat" && notes !== (booking.hire?.notes ?? "") && { notes }),
      });
      await onDone("Booking details updated.");
    });
  }

  return (
    <Modal open={open} title="Edit booking details" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-[13px] text-gray-500">Corrections only. Dates, seats and prices change through the trip, quotation or change-request flows.</p>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Contact name" htmlFor="c-name">
            <Input id="c-name" value={contact.fullName} onChange={(e) => setContact({ ...contact, fullName: e.target.value })} />
          </Field>
          <Field label="Contact email" htmlFor="c-email">
            <Input id="c-email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </Field>
          <Field label="Contact phone" htmlFor="c-phone">
            <Input id="c-phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </Field>
        </div>
        {passengers.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {passengers.map((p, i) => (
              <Field key={p.seat} label={`Passenger — seat ${p.seat}`} htmlFor={`p-${p.seat}`}>
                <Input id={`p-${p.seat}`} value={p.fullName} onChange={(e) => setPassengers((ps) => ps.map((x, j) => (j === i ? { ...x, fullName: e.target.value } : x)))} />
              </Field>
            ))}
          </div>
        )}
        {booking.type !== "seat" && (
          <Field label="Hire notes" htmlFor="notes">
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        )}
        <Field label="Reason for the change (recorded in the audit log)" htmlFor="reason">
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
        </Field>
        <Button type="submit" fullWidth label="Save changes" loading={busy} disabled={reason.trim().length < 3} />
      </form>
    </Modal>
  );
}

function ModificationItem({
  reference,
  request,
  onDone,
}: {
  reference: string;
  request: BookingDetails["modificationRequests"][number];
  onDone: (message: string) => Promise<void>;
}) {
  const can = useCan();
  const [note, setNote] = useState("");
  const { busy, error, run } = useSubmit();
  const resolve = (status: "resolved" | "rejected") =>
    run(async () => {
      await adminApi.post(`/bookings/${reference}/modification-requests/${request.id}/resolve`, { status, note: note.trim() });
      await onDone(`Change request ${status}; the customer has been emailed.`);
    });
  return (
    <li className="rounded-[8px] border border-border-stroke p-3 text-[13px]">
      <p>{request.message}</p>
      <p className="mt-1 text-[12px] text-gray-500">
        {formatDateTime(request.requestedAt)} · {request.status}
        {request.resolutionNote ? ` — ${request.resolutionNote}` : ""}
      </p>
      {request.status === "open" && can("bookings.edit") && (
        <div className="mt-2 space-y-2">
          {error && <Alert tone="error">{error}</Alert>}
          <Input aria-label="Reply to the customer" placeholder="Reply to the customer (required)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <SmallButton tone="primary" disabled={busy || note.trim().length < 3} onClick={() => resolve("resolved")}>
              Mark resolved
            </SmallButton>
            <SmallButton tone="danger" disabled={busy || note.trim().length < 3} onClick={() => resolve("rejected")}>
              Decline
            </SmallButton>
          </div>
        </div>
      )}
    </li>
  );
}
