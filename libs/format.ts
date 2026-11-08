import type { BookingStatus, BookingType, PaymentStatus } from "./types";

const TZ = "Africa/Lagos";

export function naira(kobo: number | null | undefined): string {
  if (kobo == null) return "—";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: kobo % 100 ? 2 : 0 }).format(
    kobo / 100,
  );
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function durationLabel(fromIso: string, toIso: string): string {
  const mins = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Today's date (YYYY-MM-DD) in Nigeria, for date input minimums. */
export function todayInLagos(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Combines date + time inputs (entered in Nigerian time) into an ISO string with offset. */
export function lagosDateTime(date: string, time: string): string {
  return `${date}T${time}:00+01:00`;
}

export const BOOKING_TYPE_LABEL: Record<BookingType, string> = {
  seat: "Seat booking",
  car_hire: "Car hire",
  bus_hire: "Bus hire",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_approval: "Pending approval",
  pending_payment: "Pending payment",
  payment_processing: "Payment processing",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Completed",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

/** Same rule as the backend: "obr 7k3m9q", "OBR-7K3M9Q" and "7K3M9Q" all become "OBR-7K3M9Q". */
export function normalizeReference(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[\s_-]+/g, "");
  return `OBR-${cleaned.startsWith("OBR") ? cleaned.slice(3) : cleaned}`;
}
