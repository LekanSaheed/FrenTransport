"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ManagePanel } from "@/components/booking/ManageBooking";

/**
 * A booking the customer owns. Same panel as guest Manage Booking (pay, cancel,
 * request a change, accept a quote) but authorised by the session — no code.
 * A booking the customer doesn't own answers 404 from the backend.
 */
export default function AccountBookingPage() {
  const { reference } = useParams<{ reference: string }>();
  const router = useRouter();
  const ref = decodeURIComponent(reference);
  return (
    <div>
      <Link href="/account/bookings" className="mb-3 inline-block text-[13px] font-semibold text-primary">
        ← My bookings
      </Link>
      <ManagePanel reference={ref} onExpired={() => router.replace(`/login?next=${encodeURIComponent(`/account/bookings/${ref}`)}`)} />
    </div>
  );
}
