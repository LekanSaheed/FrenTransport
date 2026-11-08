"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import BookingView from "./BookingView";
import { StatusNotice } from "./BookingStatusCheck";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { Card, DetailList, SectionTitle } from "@/components/ui/layout";
import { api, ApiError } from "@/libs/api";
import { BOOKING_STATUS_LABEL, formatDateTime, naira, normalizeReference } from "@/libs/format";
import { startPayment } from "@/libs/payment";
import type { BookingDetails, CancellationQuote } from "@/libs/types";

/*
 * Tokens are booking-scoped and short-lived. They're kept in sessionStorage
 * (cleared when the tab closes) and stripped from the URL when they arrive via
 * an email link, so they don't linger in browser history.
 */
const storageKey = (ref: string) => `obere:manage:${ref.toUpperCase()}`;

function readToken(ref: string): string | null {
  try {
    const raw = sessionStorage.getItem(storageKey(ref));
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: string };
    if (new Date(expiresAt).getTime() <= Date.now()) return null;
    return token;
  } catch {
    return null;
  }
}

function saveToken(ref: string, token: string, expiresAt?: string) {
  try {
    // Email-link tokens carry their own expiry; the backend enforces it either way.
    const exp = expiresAt ?? tokenExpiry(token) ?? new Date(Date.now() + 30 * 60_000).toISOString();
    sessionStorage.setItem(storageKey(ref), JSON.stringify({ token, expiresAt: exp }));
  } catch {
    /* storage unavailable: the token still works for this page view */
  }
}

function tokenExpiry(token: string): string | null {
  try {
    const body = token.split(".")[0]!.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(body)) as { exp: number };
    return new Date(exp * 1000).toISOString();
  } catch {
    return null;
  }
}

function clearToken(ref: string) {
  try {
    sessionStorage.removeItem(storageKey(ref));
  } catch {
    /* ignore */
  }
}

type Stage = "lookup" | "code" | "manage";

export default function ManageBooking() {
  const router = useRouter();
  const params = useSearchParams();
  const [stage, setStage] = useState<Stage>("lookup");
  const [reference, setReference] = useState((params.get("ref") ?? "").toUpperCase());
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Arriving from an email link (?ref=…&token=…) or with a still-valid session.
  useEffect(() => {
    const rawRef = params.get("ref") ?? "";
    const ref = rawRef ? normalizeReference(rawRef) : "";
    const linkToken = params.get("token");
    if (ref && linkToken) {
      saveToken(ref, linkToken);
      router.replace(`/manage?ref=${encodeURIComponent(ref)}`, { scroll: false });
    }
    const existing = ref ? linkToken ?? readToken(ref) : null;
    if (ref && existing) {
      setReference(ref);
      setToken(existing);
      setStage("manage");
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.requestCode(reference, email);
      setInfo(res.message);
      setStage("code");
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.confirmCode(reference, email, code.trim());
      const ref = normalizeReference(reference);
      saveToken(ref, res.token, res.expiresAt);
      setReference(ref);
      setToken(res.token);
      setStage("manage");
      router.replace(`/manage?ref=${encodeURIComponent(ref)}`, { scroll: false });
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  const expired = useCallback(() => {
    clearToken(reference);
    setToken(null);
    setCode("");
    setStage("lookup");
    setError("Your session has expired. Please verify your email again.");
  }, [reference]);

  if (!ready) return <LoadingBlock />;

  if (stage === "manage" && token) return <ManagePanel reference={reference} token={token} onExpired={expired} />;

  return (
    <Card className="mx-auto max-w-md">
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {stage === "lookup" && (
        <form onSubmit={requestCode} className="space-y-4">
          <Field label="Booking reference" htmlFor="ref">
            <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="OBR-XXXXXX" autoComplete="off" required />
          </Field>
          <Field label="Email address" htmlFor="email" hint="We'll send a 6-digit code to the email on the booking.">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" fullWidth label="Send code" loading={loading} />
        </form>
      )}
      {stage === "code" && (
        <form onSubmit={confirmCode} className="space-y-4">
          {info && <Alert tone="info">{info}</Alert>}
          <Field label="Verification code" htmlFor="code">
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-[20px] font-bold tracking-[0.4em]"
              required
            />
          </Field>
          <Button type="submit" fullWidth label="Verify" loading={loading} disabled={code.length !== 6} />
          <div className="flex justify-between text-[13px]">
            <button type="button" className="font-semibold text-primary" onClick={() => setStage("lookup")}>
              Change details
            </button>
            <button type="button" className="font-semibold text-primary disabled:opacity-50" disabled={loading} onClick={() => requestCode()}>
              Resend code
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

/** Booking details and actions. `token` for guests; omitted for signed-in owners (session cookie). */
export function ManagePanel({ reference, token, onExpired }: { reference: string; token?: string; onExpired: () => void }) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const handle = useCallback(
    (err: unknown) => {
      const e = err as ApiError;
      if (e.status === 401 || e.status === 403) return onExpired();
      setError(e.message);
    },
    [onExpired],
  );

  const load = useCallback(() => api.manage.get(reference, token).then(setBooking).catch(handle), [reference, token, handle]);
  useEffect(() => {
    load();
  }, [load]);

  // Results of an action are shown at the top; bring them into view.
  useEffect(() => {
    if (notice || error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [notice, error]);

  if (!booking) return error ? <Alert tone="error">{error}</Alert> : <LoadingBlock label="Loading your booking…" />;

  const b = booking;
  const payable = (b.status === "pending_payment" || b.status === "payment_processing") && b.amountKobo != null && !!b.paymentDueAt && new Date(b.paymentDueAt) > new Date();
  const quote = b.quotation?.status === "pending" || b.quotation?.status === "accepted" ? b.quotation : null;
  const active = !["cancelled", "expired", "completed"].includes(b.status);

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      handle(err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        <StatusNotice booking={b} inManage />
        <BookingView booking={b} />
        <Activity booking={b} />
      </div>

      <aside className="space-y-4">
        {quote && payable && (
          <Card>
            <SectionTitle>Your quotation</SectionTitle>
            <DetailList
              rows={[
                ...(quote.breakdown ?? []).map((l) => [l.label, naira(l.amountKobo)] as [string, string]),
                ["Total", naira(quote.amountKobo)],
                ["Valid until", formatDateTime(quote.validUntil)],
              ]}
            />
            {quote.notes && <p className="mt-3 text-[13px] text-gray-500">{quote.notes}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                fullWidth
                label={`Accept and pay ${naira(quote.amountKobo)}`}
                loading={busy === "pay"}
                onClick={() => run("pay", () => startPayment(b.reference, b.contact.email))}
              />
              {quote.status === "pending" && (
                <Button
                  fullWidth
                  variant="secondary"
                  label="Decline quotation"
                  loading={busy === "decline"}
                  onClick={() =>
                    window.confirm("Decline this quotation? Your request will be cancelled.") &&
                    run("decline", async () => {
                      setBooking(await api.manage.declineQuote(b.reference, token));
                      setNotice("Quotation declined. Your request has been cancelled.");
                    })
                  }
                />
              )}
            </div>
          </Card>
        )}

        {payable && !quote && (
          <Card>
            <SectionTitle>Payment</SectionTitle>
            <p className="text-[13px] text-gray-500">Pay before {formatDateTime(b.paymentDueAt!)} to keep your reservation.</p>
            <Button
              fullWidth
              className="mt-4"
              label={`Pay ${naira(b.amountKobo)}`}
              loading={busy === "pay"}
              onClick={() => run("pay", () => startPayment(b.reference, b.contact.email))}
            />
          </Card>
        )}

        {active && <RequestChange reference={b.reference} token={token} onDone={async (msg) => { setNotice(msg); await load(); }} onError={handle} />}
        {active && b.cancellation?.status !== "requested" && (
          <CancelBooking reference={b.reference} token={token} onDone={(updated, msg) => { setBooking(updated); setNotice(msg); }} onError={handle} />
        )}
      </aside>
    </div>
  );
}

function RequestChange({ reference, token, onDone, onError }: { reference: string; token?: string; onDone: (msg: string) => void; onError: (e: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.manage.requestChange(reference, token, message.trim());
      setMessage("");
      setOpen(false);
      onDone("Change request sent. Our team will reply by email.");
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Need to change something?</SectionTitle>
      {!open ? (
        <>
          <p className="text-[13px] text-gray-500">Change of date, time, seat or passenger name — tell us and we&apos;ll sort it out.</p>
          <Button fullWidth variant="secondary" className="mt-4" label="Request a change" onClick={() => setOpen(true)} />
        </>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field label="What would you like to change?" htmlFor="change">
            <Textarea id="change" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="E.g. Please move me to Friday's 7:00 departure." minLength={10} required />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" label="Cancel" onClick={() => setOpen(false)} />
            <Button type="submit" label="Send request" loading={loading} disabled={message.trim().length < 10} />
          </div>
        </form>
      )}
    </Card>
  );
}

function CancelBooking({
  reference,
  token,
  onDone,
  onError,
}: {
  reference: string;
  token?: string;
  onDone: (b: BookingDetails, msg: string) => void;
  onError: (e: unknown) => void;
}) {
  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function preview() {
    setLoading(true);
    try {
      setQuote(await api.manage.cancellationQuote(reference, token));
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    setLoading(true);
    try {
      const res = await api.manage.cancel(reference, token, reason.trim() || undefined);
      setQuote(null);
      onDone(
        res.booking,
        res.outcome === "requested"
          ? "Cancellation request sent. We'll email you once it's reviewed."
          : res.refundAmountKobo > 0
            ? `Booking cancelled. A refund of ${naira(res.refundAmountKobo)} is on its way.`
            : "Booking cancelled.",
      );
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Cancel booking</SectionTitle>
      {!quote ? (
        <Button fullWidth variant="secondary" className="!border-red-300 !text-red-600" label="Cancel this booking" loading={loading} onClick={preview} />
      ) : !quote.allowed ? (
        <Alert tone="warning">{quote.message}</Alert>
      ) : (
        <div className="space-y-3">
          <Alert tone={quote.refundAmountKobo > 0 ? "info" : "warning"}>{quote.message}</Alert>
          <Field label="Reason (optional)" htmlFor="reason">
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" label="Keep booking" onClick={() => setQuote(null)} />
            <Button
              className="!bg-red-600"
              label={quote.mode === "review" ? "Request cancellation" : "Confirm cancellation"}
              loading={loading}
              onClick={confirm}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

function Activity({ booking }: { booking: BookingDetails }) {
  const b = booking;
  const hasPayments = b.payments.some((p) => p.status !== "initialized");
  return (
    <>
      {hasPayments && (
        <Card>
          <SectionTitle>Payments</SectionTitle>
          <DetailList
            rows={b.payments.flatMap((p) => [
              [
                `${naira(p.amountKobo)}${p.channel ? ` · ${p.channel}` : ""}`,
                p.status === "success" ? `Paid ${p.paidAt ? formatDateTime(p.paidAt) : ""}` : p.status === "failed" ? "Failed" : "Pending",
              ] as [string, string],
              ...p.refunds.map((r) => [`Refund ${naira(r.amountKobo)}`, r.status === "processed" ? "Refunded" : "Processing"] as [string, string]),
            ])}
          />
        </Card>
      )}
      {b.modificationRequests.length > 0 && (
        <Card>
          <SectionTitle>Change requests</SectionTitle>
          <ul className="space-y-3 text-[13px]">
            {b.modificationRequests.map((m) => (
              <li key={m.id} className="rounded-[8px] border border-border-stroke p-3">
                <p className="text-black">{m.message}</p>
                <p className="mt-1 text-[12px] text-gray-500">
                  {formatDateTime(m.requestedAt)} · {m.status === "open" ? "Awaiting reply" : m.status === "resolved" ? "Resolved" : "Declined"}
                </p>
                {m.resolutionNote && <p className="mt-1 text-[12px] font-semibold text-primary">{m.resolutionNote}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <SectionTitle>History</SectionTitle>
        <ol className="space-y-2 text-[13px]">
          {[...b.statusHistory].reverse().map((h, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span className="text-black">
                {BOOKING_STATUS_LABEL[h.status]}
                {h.note && <span className="text-gray-500"> — {h.note}</span>}
              </span>
              <span className="shrink-0 text-gray-500">{formatDateTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
