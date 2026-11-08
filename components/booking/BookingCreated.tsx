"use client";
import React, { useState } from "react";
import Button from "@/components/Button";
import { Alert } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { ApiError } from "@/libs/api";
import { formatDateTime, naira } from "@/libs/format";
import { startPayment } from "@/libs/payment";
import type { BookingSummary } from "@/libs/types";

/**
 * Shown when a booking exists but the customer is not (yet) on the payment page:
 * a quote-based hire request, or a payment that failed to start.
 */
export default function BookingCreated({ booking, email }: { booking: BookingSummary; email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const needsQuote = booking.status === "pending_approval";

  async function retry() {
    setLoading(true);
    setError(null);
    try {
      await startPayment(booking.reference, email);
    } catch (e) {
      setError((e as ApiError).message);
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl text-center">
      <p className="text-[12px] font-semibold uppercase tracking-n-1 text-gray-500">Booking reference</p>
      <p className="mt-1 text-[32px] font-bold tracking-n-4 text-primary">{booking.reference}</p>
      {needsQuote ? (
        <>
          <h2 className="mt-4 text-[18px] font-bold tracking-n-3">Request received</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-[160%] text-gray-500">
            We&apos;ve emailed a copy to {email}. Our team will send your quotation shortly — usually within one working day. Nothing
            is charged until you accept it.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button href="/booking-status" variant="secondary" label="Check status" />
            <Button href="/" label="Back to home" />
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-[18px] font-bold tracking-n-3">Complete your payment</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-[160%] text-gray-500">
            Your reservation is held
            {booking.paymentDueAt ? ` until ${formatDateTime(booking.paymentDueAt)}` : ""}. Pay {naira(booking.amountKobo)} to confirm it.
            We&apos;ve also emailed you a payment link.
          </p>
          <Alert tone="warning" className="mt-4 text-left">
            We couldn&apos;t open the payment page. Please try again.
          </Alert>
          {error && <Alert tone="error" className="mt-3 text-left">{error}</Alert>}
          <div className="mt-6 flex justify-center">
            <Button label={`Pay ${naira(booking.amountKobo)}`} onClick={retry} loading={loading} />
          </div>
        </>
      )}
    </Card>
  );
}
