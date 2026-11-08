"use client";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { Field, Input } from "@/components/ui/form";
import { Alert, PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { api, type ApiError } from "@/libs/api";
import { customerApi, type AccountBooking, type CustomerUser } from "@/libs/customer";
import { BOOKING_TYPE_LABEL, formatDateTime, naira, normalizeReference } from "@/libs/format";

/** Nudge to confirm the email: needed before earlier guest bookings appear here. */
export function VerifyEmailBanner({ user }: { user: CustomerUser }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  if (user.emailVerified) return null;
  return (
    <Alert tone="warning" title="Please confirm your email" className="mb-5">
      We sent a link to {user.email}. Confirming it adds any earlier bookings made with this email to your account.{" "}
      {state === "sent" ? (
        <strong>New link sent.</strong>
      ) : (
        <button
          className="font-semibold underline disabled:opacity-50"
          disabled={state === "sending"}
          onClick={async () => {
            setState("sending");
            try {
              await customerApi.resendVerification();
              setState("sent");
            } catch {
              setState("error");
            }
          }}
        >
          {state === "error" ? "Couldn't send — try again" : "Resend the link"}
        </button>
      )}
    </Alert>
  );
}

export function BookingRow({ b }: { b: AccountBooking }) {
  return (
    <Link
      href={`/account/bookings/${b.reference}`}
      className="flex flex-col gap-3 rounded-[10px] border border-border-stroke bg-white p-4 transition hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-bold tracking-n-3 text-black">{b.title}</p>
        <p className="mt-0.5 text-[13px] text-gray-500">
          {formatDateTime(b.travelDate)} · {BOOKING_TYPE_LABEL[b.type]}
          {b.seats?.length ? ` · seat ${b.seats.join(", ")}` : ""}
        </p>
        <p className="mt-0.5 text-[12px] font-semibold text-primary">{b.reference}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <span className="text-[15px] font-bold">{b.amountKobo != null ? naira(b.amountKobo) : "Awaiting quote"}</span>
        <div className="flex gap-1.5">
          <StatusBadge status={b.status} />
          <PaymentBadge status={b.paymentStatus} />
        </div>
        {b.cancellationRequested && <span className="text-[11px] font-semibold text-orange-600">Cancellation requested</span>}
      </div>
    </Link>
  );
}

/**
 * "Add a booking made with another email": the customer proves control of that
 * email with the same one-time code Manage Booking uses.
 */
export function ClaimBooking({ onClaimed }: { onClaimed: (reference: string) => void }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"details" | "code">("details");
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] font-semibold text-primary">
        + Add a booking made with another email
      </button>
    );
  }

  return (
    <Card className="mb-4">
      <p className="mb-3 text-[14px] font-bold tracking-n-3">Add a booking to your account</p>
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      {stage === "details" ? (
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api.requestCode(reference, email);
              setStage("code");
            });
          }}
        >
          <Field label="Booking reference" htmlFor="claim-ref">
            <Input id="claim-ref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="OBR-XXXXXX" required />
          </Field>
          <Field label="Email used for the booking" htmlFor="claim-email">
            <Input id="claim-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" label="Send code" loading={loading} />
        </form>
      ) : (
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await customerApi.claim(normalizeReference(reference), email, code.trim());
              setOpen(false);
              setStage("details");
              setCode("");
              onClaimed(r.reference);
            });
          }}
        >
          <Field label={`Code sent to ${email}`} htmlFor="claim-code">
            <Input
              id="claim-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="tracking-[0.3em]"
              required
            />
          </Field>
          <Button type="submit" label="Add booking" loading={loading} disabled={code.length !== 6} />
        </form>
      )}
      <button onClick={() => setOpen(false)} className="mt-3 text-[12px] text-gray-500">
        Cancel
      </button>
    </Card>
  );
}
