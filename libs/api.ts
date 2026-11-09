import type { BookingDetails, BookingSummary, CancellationQuote, HireAvailability, HireCategory, Location, PaymentStatusView, TripDetails, TripSummary, BookingChanges, DateChangeOption, PendingDateChange } from "./types";

/**
 * Thin client for the Obere Transport API. Every response is
 * `{ success: true, data }` or `{ success: false, error: { code, message, details } }`.
 * No secrets live here: payment and email keys stay on the backend.
 */
/**
 * The browser calls the API directly (no proxy through this app), e.g. https://api.obere.ng/api/v1.
 * Session cookies are the API's own, sent with `credentials: "include"`.
 */
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field-level validation messages keyed by path, e.g. { "contact.email": "Enter a valid email address" }. */
  get fieldErrors(): Record<string, string> {
    if (this.code !== "VALIDATION_ERROR" || !Array.isArray(this.details)) return {};
    return Object.fromEntries((this.details as { path: string; message: string }[]).map((d) => [d.path, d.message]));
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  token?: string;
  idempotencyKey?: string;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      credentials: "include", // the API is on another origin; send and accept its session cookies
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "We couldn't reach our servers. Check your connection and try again.");
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error ?? {};
    throw new ApiError(res.status, err.code ?? "UNKNOWN", err.message ?? "Something went wrong. Please try again.", err.details);
  }
  return json.data as T;
}

export interface Contact {
  fullName: string;
  email: string;
  phone: string;
}

export interface PublicConfig {
  contact: { supportEmail: string; supportPhone: string };
  booking: { seatHoldMinutes: number; bookingCutoffMinutes: number };
  amendments: { dateChangeCharge: "percentage" | "fare_difference"; feePercent: number; dateChangeCutoffHours: number };
}

export const api = {
  config: () => request<PublicConfig>("/config"),
  locations: () => request<Location[]>("/locations"),
  destinations: (originId: string) => request<Location[]>("/locations/destinations", { query: { originId } }),
  searchTrips: (q: { originId: string; destinationId: string; date: string; passengers: number }) =>
    request<TripSummary[]>("/trips/search", { query: q }),
  trip: (id: string) => request<TripDetails>(`/trips/${encodeURIComponent(id)}`),

  hireCategories: (kind: "car" | "bus") => request<HireCategory[]>("/hire/categories", { query: { kind } }),
  hireAvailability: (q: { categoryId: string; kind: "car" | "bus"; pickupAt: string; durationDays: number }) =>
    request<HireAvailability>("/hire/availability", { query: q }),

  createSeatBooking: (
    body: {
      tripId: string;
      seats?: string[];
      passengers: { fullName: string; gender?: "male" | "female" }[];
      contact: Contact;
      nextOfKin?: { fullName: string; phone: string };
    },
    idempotencyKey: string,
  ) => request<BookingSummary>("/bookings/seat", { method: "POST", body, idempotencyKey }),

  createCarHire: (body: Record<string, unknown>, idempotencyKey: string) =>
    request<BookingSummary>("/bookings/car-hire", { method: "POST", body, idempotencyKey }),
  createBusHire: (body: Record<string, unknown>, idempotencyKey: string) =>
    request<BookingSummary>("/bookings/bus-hire", { method: "POST", body, idempotencyKey }),

  lookup: (reference: string, email: string) =>
    request<BookingSummary>("/bookings/lookup", { method: "POST", body: { reference, email } }),
  requestCode: (reference: string, email: string) =>
    request<{ message: string }>("/bookings/verification", { method: "POST", body: { reference, email } }),
  confirmCode: (reference: string, email: string, code: string) =>
    request<{ token: string; expiresAt: string }>("/bookings/verification/confirm", {
      method: "POST",
      body: { reference, email, code },
    }),

  initializePayment: (reference: string, email: string) =>
    request<{ reference: string; authorizationUrl: string }>("/payments/initialize", { method: "POST", body: { reference, email } }),
  verifyPayment: (paymentReference: string) => request<PaymentStatusView>(`/payments/${encodeURIComponent(paymentReference)}/verify`),

  /**
   * Manage Booking. `token` is the guest's booking-scoped token; signed-in
   * owners omit it and are authorised by their session cookie instead.
   */
  manage: {
    get: (ref: string, token: string | undefined) => request<BookingDetails>(`/manage/bookings/${encodeURIComponent(ref)}`, { token }),
    cancellationQuote: (ref: string, token: string | undefined) =>
      request<CancellationQuote>(`/manage/bookings/${encodeURIComponent(ref)}/cancellation`, { token }),
    cancel: (ref: string, token: string | undefined, reason?: string) =>
      request<{ outcome: "cancelled" | "requested"; refundAmountKobo: number; booking: BookingDetails }>(
        `/manage/bookings/${encodeURIComponent(ref)}/cancel`,
        { method: "POST", token, body: { reason } },
      ),
    requestChange: (ref: string, token: string | undefined, message: string) =>
      request<{ id: string }>(`/manage/bookings/${encodeURIComponent(ref)}/modification-requests`, {
        method: "POST",
        token,
        body: { message },
      }),
    acceptQuote: (ref: string, token: string | undefined) =>
      request<BookingDetails>(`/manage/bookings/${encodeURIComponent(ref)}/quotation/accept`, { method: "POST", token }),
    /* Self-service changes (seat bookings) */
    changeNames: (ref: string, token: string | undefined, passengers: { seat: string; fullName: string }[]) =>
      request<BookingDetails>(`/manage/bookings/${encodeURIComponent(ref)}/passengers`, { method: "PATCH", token, body: { passengers } }),
    changeSeats: (ref: string, token: string | undefined, moves: { from: string; to: string }[]) =>
      request<BookingDetails>(`/manage/bookings/${encodeURIComponent(ref)}/seats`, { method: "POST", token, body: { moves } }),
    dateChangeOptions: (ref: string, token: string | undefined, date: string) =>
      request<{ rules: BookingChanges["rules"]["dateChange"]; trips: DateChangeOption[] }>(`/manage/bookings/${encodeURIComponent(ref)}/date-change/options`, {
        token,
        query: { date },
      }),
    startDateChange: (ref: string, token: string | undefined, tripId: string) =>
      request<{ amendment: PendingDateChange; paymentRequired: boolean; booking: BookingDetails }>(`/manage/bookings/${encodeURIComponent(ref)}/date-change`, {
        method: "POST",
        token,
        body: { tripId },
      }),
    payDateChange: (ref: string, token: string | undefined) =>
      request<{ reference: string; authorizationUrl: string }>(`/manage/bookings/${encodeURIComponent(ref)}/date-change/pay`, { method: "POST", token }),
    cancelDateChange: (ref: string, token: string | undefined) =>
      request<BookingDetails>(`/manage/bookings/${encodeURIComponent(ref)}/date-change`, { method: "DELETE", token }),
    declineQuote: (ref: string, token: string | undefined, reason?: string) =>
      request<BookingDetails>(`/manage/bookings/${encodeURIComponent(ref)}/quotation/decline`, {
        method: "POST",
        token,
        body: { reason },
      }),
  },
};

/** A fresh key per checkout attempt so double-submits don't create two bookings. */
export function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
