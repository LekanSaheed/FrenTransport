"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Alert, LoadingBlock, PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { Card, DetailList } from "@/components/ui/layout";
import { api, ApiError } from "@/libs/api";
import { BOOKING_TYPE_LABEL, naira } from "@/libs/format";
import type { PaymentStatusView } from "@/libs/types";

const POLL_MS = 3000;
const MAX_POLLS = 8;

/**
 * Landing page after Paystack. The `reference` query parameter only tells us
 * which payment to ask about — the backend verifies it with Paystack before
 * anything is confirmed.
 */
export default function PaymentResult() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const [view, setView] = useState<PaymentStatusView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const polls = useRef(0);

  useEffect(() => {
    if (!reference) {
      setError("This page is missing a payment reference.");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const v = await api.verifyPayment(reference);
        if (cancelled) return;
        setView(v);
        setError(null);
        if (v.payment.status === "pending" || v.payment.status === "initialized") {
          if (++polls.current < MAX_POLLS) timer = setTimeout(check, POLL_MS);
          else setGaveUp(true);
        }
      } catch (e) {
        if (cancelled) return;
        const err = e as ApiError;
        // Transient verification failures: keep trying a few times.
        if (err.status >= 500 && ++polls.current < MAX_POLLS) timer = setTimeout(check, POLL_MS);
        else setError(err.status === 404 ? "We couldn't find this payment." : err.message);
      }
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reference]);

  if (error) {
    return (
      <Card className="mx-auto max-w-xl">
        <Alert tone="error" title="We couldn't check your payment">{error}</Alert>
        <p className="mt-4 text-[13px] text-gray-500">
          If you were charged, your booking will be confirmed automatically and you&apos;ll receive an email. You can also check
          your booking status at any time.
        </p>
        <div className="mt-5 flex gap-3">
          <Button href="/booking-status" label="Check booking status" />
        </div>
      </Card>
    );
  }
  if (!view) return <LoadingBlock label="Confirming your payment…" />;

  const b = view.booking;
  const status = view.payment.status;
  const isChange = view.payment.purpose === "amendment";
  const isBags = view.payment.purpose === "baggage";
  const confirmed = b?.status === "confirmed" && !view.payment.refunding;
  const refunding = status === "success" && (!confirmed || !!view.payment.refunding);

  return (
    <Card className="mx-auto max-w-xl text-center">
      {confirmed && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[28px] text-emerald-600">✓</div>
          <h2 className="mt-4 text-[22px] font-bold tracking-n-4">{isBags ? "Extra bags added" : isChange ? "Travel date changed" : "Booking confirmed"}</h2>
          <p className="mt-1 text-[14px] text-gray-500">
            {isBags
              ? "Your extra bags are on your booking. We've emailed your updated details and receipt."
              : isChange
                ? "Your booking is now on the new trip. We've emailed your updated details and receipt."
                : "We've emailed your confirmation and receipt."}
          </p>
        </>
      )}
      {refunding && (
        <>
          <h2 className="text-[20px] font-bold tracking-n-4">{isBags ? "We're refunding your baggage payment" : isChange ? "We're refunding your change charge" : "We're refunding your payment"}</h2>
          <Alert tone="warning" className="mt-3 text-left">
            {isBags
              ? "We received your payment, but the booking was no longer active when it arrived, so the bags couldn't be added. A full refund has been started."
              : isChange
              ? "We received your payment, but the seats on the new trip were taken before it arrived. Your booking stays on its original trip, and a full refund of the change charge has been started."
              : "We received your payment but couldn't apply it: the reservation had expired and was taken, or the booking changed while you were paying. A full refund has been started and we've emailed you the details."}
          </Alert>
        </>
      )}
      {status === "failed" && (
        <>
          <h2 className="text-[20px] font-bold tracking-n-4">Payment unsuccessful</h2>
          <p className="mt-1 text-[14px] text-gray-500">You have not been charged. You can try again while your reservation is held.</p>
        </>
      )}
      {(status === "pending" || status === "initialized") && (
        <>
          <h2 className="text-[20px] font-bold tracking-n-4">{gaveUp ? "Payment still processing" : "Confirming your payment…"}</h2>
          <p className="mt-1 text-[14px] text-gray-500">
            {gaveUp
              ? "Your bank hasn't confirmed this payment yet. We'll email you as soon as it does — no need to pay again."
              : "This usually takes a few seconds."}
          </p>
        </>
      )}

      {b && (
        <DetailList
          className="mt-6 text-left"
          rows={[
            ["Booking reference", <span key="r" className="text-primary">{b.reference}</span>],
            ["Booking type", BOOKING_TYPE_LABEL[b.type]],
            ["Amount", naira(view.payment.amountKobo)],
            ["Booking status", <StatusBadge key="s" status={b.status} />],
            ["Payment status", <PaymentBadge key="p" status={b.paymentStatus} />],
          ]}
        />
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {status === "failed" && b && <Button href={`/manage?ref=${encodeURIComponent(b.reference)}`} label="Try payment again" />}
        <Button href={`/manage${b ? `?ref=${encodeURIComponent(b.reference)}` : ""}`} variant="secondary" label="Manage booking" />
        <Button href="/" variant="secondary" label="Home" />
      </div>
    </Card>
  );
}
