"use client";
import React, { useState } from "react";
import Button from "@/components/Button";
import BookingView from "./BookingView";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { api, ApiError } from "@/libs/api";
import { formatDateTime, naira } from "@/libs/format";
import type { BookingSummary } from "@/libs/types";

export default function BookingStatusCheck() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setBooking(await api.lookup(reference, email));
    } catch (err) {
      setBooking(null);
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Booking reference" htmlFor="ref" hint="E.g. OBR-7K3M9Q — it's in your booking email.">
            <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="OBR-XXXXXX" autoComplete="off" required />
          </Field>
          <Field label="Email address" htmlFor="email" hint="The email used when booking.">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" fullWidth label="Check status" loading={loading} />
        </form>
      </Card>

      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {!booking && !error && (
          <p className="text-[14px] leading-[160%] text-gray-500">
            Enter your booking reference and email to see your booking and payment status.
          </p>
        )}
        {booking && (
          <>
            <StatusNotice booking={booking} />
            <BookingView booking={booking} />
            <div className="flex flex-wrap gap-3">
              <Button href={`/manage?ref=${encodeURIComponent(booking.reference)}`} label="Manage this booking" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** One line telling the customer what happens next. */
export function StatusNotice({ booking, inManage }: { booking: BookingSummary; inManage?: boolean }) {
  const b = booking;
  if (b.status === "pending_approval") return <Alert tone="info" title="We're preparing your quotation">You'll receive it by email, usually within one working day.</Alert>;
  if (b.status === "pending_payment" && b.quotation?.status === "pending") {
    return (
      <Alert tone="info" title={`Quotation ready: ${naira(b.quotation.amountKobo)}`}>
        Valid until {formatDateTime(b.quotation.validUntil)}. {inManage ? "Review it below to accept and pay." : "Open Manage Booking to accept and pay."}
      </Alert>
    );
  }
  if (b.status === "pending_payment" || b.status === "payment_processing") {
    return (
      <Alert tone="warning" title="Awaiting payment">
        {b.paymentDueAt ? `Pay before ${formatDateTime(b.paymentDueAt)} to keep your reservation.` : "Complete payment to confirm your booking."}
      </Alert>
    );
  }
  if (b.cancellation?.status === "requested") return <Alert tone="info" title="Cancellation under review">We'll email you once our team has reviewed your request.</Alert>;
  if (b.status === "confirmed") return <Alert tone="success" title="You're all set">Your booking is confirmed.</Alert>;
  if (b.status === "cancelled") {
    return (
      <Alert tone="warning" title="This booking was cancelled">
        {b.cancellation?.refundAmountKobo ? `Refund: ${naira(b.cancellation.refundAmountKobo)}.` : "No refund was due."}
      </Alert>
    );
  }
  if (b.status === "expired") return <Alert tone="warning" title="This reservation expired">Payment wasn't completed in time. You can make a new booking.</Alert>;
  return null;
}
