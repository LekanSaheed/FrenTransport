"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, request } from "./api";
import type { BookingStatus, BookingType, PaymentStatus } from "./types";

/**
 * Admin API client. Calls go to the same-origin /api/v1/admin/* with the admin
 * session cookie. Authorization is enforced by the backend on every call; the
 * frontend only reacts to 401 (send to sign-in) and 403 (show "no access").
 */

type Query = Record<string, string | number | boolean | undefined>;

function onAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/admin/login")) {
    location.assign(`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`);
  }
  throw err;
}

export const adminApi = {
  get: <T>(path: string, query?: Query) => request<T>(`/admin${path}`, { query }).catch(onAuthError) as Promise<T>,
  post: <T>(path: string, body: unknown = {}) => request<T>(`/admin${path}`, { method: "POST", body }).catch(onAuthError) as Promise<T>,
  patch: <T>(path: string, body: unknown) => request<T>(`/admin${path}`, { method: "PATCH", body }).catch(onAuthError) as Promise<T>,
  del: <T>(path: string) => request<T>(`/admin${path}`, { method: "DELETE" }).catch(onAuthError) as Promise<T>,

  me: () => request<{ user: AdminUser | null }>("/auth/admin/me"),
  login: (email: string, password: string) => request<{ user: AdminUser }>("/auth/admin/login", { method: "POST", body: { email, password } }),
  logout: () => request<{ signedOut: boolean }>("/auth/admin/logout", { method: "POST" }),
  acceptInvite: (token: string, password: string) => request<{ user: AdminUser }>("/auth/admin/accept-invite", { method: "POST", body: { token, password } }),
};

/** Loads admin data and reloads when `key` changes (e.g. filters). */
export function useAdminData<T>(path: string | null, query?: Query) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!!path);
  const key = JSON.stringify([path, query]);
  const latest = useRef(key);

  const load = useCallback(async () => {
    if (!path) return;
    latest.current = key;
    setLoading(true);
    try {
      const d = await adminApi.get<T>(path, query);
      if (latest.current === key) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (latest.current === key) setError(e as ApiError);
    } finally {
      if (latest.current === key) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

/** Naira in forms ↔ kobo in the API. */
export const toKobo = (naira: string | number) => Math.round(Number(naira) * 100);
export const toNaira = (kobo: number | null | undefined) => (kobo == null ? "" : String(kobo / 100));

/* ------------------------------------------------------------------ */
/* Response types                                                     */
/* ------------------------------------------------------------------ */

/** Mirrors the backend's config/permissions.ts. The backend enforces these; the UI only hides what a role can't use. */
export type Permission =
  | "overview.view"
  | "bookings.view"
  | "bookings.edit"
  | "bookings.cancel"
  | "hire.manage"
  | "payments.view"
  | "payments.refund"
  | "payments.record_offline"
  | "trips.view"
  | "trips.manage"
  | "fleet.view"
  | "fleet.manage"
  | "network.view"
  | "network.manage"
  | "customers.view"
  | "customers.manage"
  | "media.manage"
  | "settings.manage"
  | "activity.view"
  | "staff.manage";

export type StaffRole = "owner" | "operations" | "bookings" | "finance" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
  staffRole: StaffRole;
  permissions: Permission[];
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  roleLabel: string;
  status: "active" | "disabled";
  invitePending: boolean;
  invitedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StaffRoleInfo {
  id: StaffRole;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface BookingRow {
  reference: string;
  type: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountKobo: number | null;
  travelDate: string;
  title: string;
  seats?: string[];
  cancellationRequested: boolean;
  createdAt: string;
  customer: { fullName: string; email: string; phone: string };
  hasAccount: boolean;
  openModificationRequests: number;
  quotation: { amountKobo: number; status: string; validUntil: string } | null;
}

export interface ActivityRow {
  id?: string;
  _id?: string;
  action: string;
  summary: string;
  actor: string | { fullName: string; email: string } | null;
  actorRole?: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Overview {
  generatedAt: string;
  totals: { bookings: number; today: number; upcoming: number; completed: number; cancelled: number; expired: number; pending: number; awaitingQuote: number };
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  revenue: { grossKobo: number; refundedKobo: number; netKobo: number; payments: number };
  pendingPayments: { count: number; amountKobo: number };
  next24h: { trips: number; seatsSold: number; seats: number };
  series: { date: string; bookings: number; seat: number; carHire: number; busHire: number; revenueKobo: number }[];
  recentBookings: (Omit<BookingRow, "customer" | "hasAccount" | "openModificationRequests" | "quotation"> & { customerName: string })[];
  recentActivity: ActivityRow[];
}

export type TripPhase = "upcoming" | "departed" | "completed" | "cancelled";

export interface TripRow {
  id: string;
  routeId: string;
  origin: { id: string; city: string; name: string };
  destination: { id: string; city: string; name: string };
  departureAt: string;
  arrivalAt: string;
  priceKobo: number;
  status: "scheduled" | "departed" | "completed" | "cancelled";
  /** From the clock: a scheduled trip past its departure time is "departed" (locked). */
  phase: TripPhase;
  vehicle: { id: string; plateNumber: string } | null;
  category: { id: string; name: string } | null;
  seats: { total: number; booked: number; held: number; blocked: number; available: number };
  /** Created from a recurring timetable. */
  timetableId: string | null;
  /** The vehicle travels empty to the start of this trip (accepted by an admin or timetable). */
  repositioned: boolean;
}

export interface TripDetail extends TripRow {
  seatLayout: { rows: number | null; columns: number | null; driver: { row: number; column: number } | null };
  seatMap: { label: string; row: number | null; column: number | null; state: "available" | "held" | "booked" | "blocked"; bookingReference: string | null }[];
  passengers: { seat: string; fullName: string; bookingReference: string; bookingStatus: BookingStatus; paymentStatus: PaymentStatus; contactPhone: string }[];
}

export interface VehicleRow {
  id: string;
  plateNumber: string;
  status: "active" | "maintenance" | "retired";
  description: string;
  category: { id: string; name: string; kind: "car" | "bus"; capacity: number; imageUrl: string; hasSeatMap: boolean };
  upcomingTrips: number;
  nextDepartureAt: string | null;
  home: Place | null;
  location: VehicleLocation;
  nextTrip: { id: string; departureAt: string; from: Place | null; to: Place | null } | null;
  /** The next trip doesn't start where the vehicle is (or will be). */
  mismatch: boolean;
}

export interface Place {
  id: string;
  name: string;
  city: string;
  state: string;
}

export type VehicleLocation =
  | { status: "en_route"; place: Place | null; from: Place | null; until: string }
  | { status: "at"; place: Place | null; since: string | null; atHome?: boolean }
  | { status: "unknown"; place: null };

export interface CategoryRow {
  _id: string;
  code: string;
  name: string;
  kind: "car" | "bus";
  capacity: number;
  description: string;
  amenities: string[];
  imageUrl: string;
  active: boolean;
  layout?: SeatLayout;
  hire: { enabled: boolean; pricingMode: "instant" | "quote"; dailyRateKobo?: number | null };
}

export interface TerminalRow {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  active: boolean;
  activeRoutes: number;
}

export interface RouteRow {
  _id: string;
  origin: { _id: string; name: string; city: string };
  destination: { _id: string; name: string; city: string };
  durationMinutes: number;
  defaultFareKobo: number | null;
  active: boolean;
}

export interface CustomerRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: "active" | "disabled";
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  bookings: number;
  spentKobo: number;
  lastBookingAt: string | null;
}

export interface PaymentRow {
  reference: string;
  provider: string;
  amountKobo: number;
  currency: string;
  status: "initialized" | "pending" | "success" | "failed";
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
  bookingReference: string;
  email: string;
  failureReason: string | null;
  evidence: { method: string; reference: string; note?: string } | null;
  refunds: { amountKobo: number; reason: string; status: string; requestedAt: string; processedAt: string | null }[];
}

export interface SettingsData {
  booking: { seatHoldMinutes: number; bookingCutoffMinutes: number; quoteValidityHours: number };
  cancellation: { refundWindowHours: number; refundPercent: number };
  hire: { carMinLeadHours: number; busMinLeadHours: number };
  contact: { supportEmail: string; supportPhone: string; adminNotificationEmail: string };
  updatedAt?: string;
  payments: { provider: string; mode: "live" | "test" | "not_configured"; webhookPath: string };
  email: { provider: string; configured: boolean; from: string };
}

/** A vehicle type's seat layout: row 0 is the front; rows can hold different numbers of seats. */
export interface SeatLayout {
  rows: number;
  columns: number;
  driver?: { row: number; column: number };
  seats: { label: string; row: number; column: number }[];
}

/** A Nigerian state (36 + FCT) and the cities terminals can be placed in. */
export interface StateCities {
  state: string;
  cities: { id: string; name: string; terminals: number }[];
}

/* ------------------------------ scheduling ------------------------------ */

export interface TimetableLeg {
  day: number;
  time: string;
  routeId: string;
  from: string;
  to: string;
  durationMinutes: number;
  priceKobo: number | null;
  defaultFareKobo: number | null;
}

export interface Timetable {
  id: string;
  name: string;
  vehicle: { id: string; plateNumber: string; type: string } | null;
  cycleDays: number;
  startDate: string;
  endDate: string | null;
  returnsEmpty: boolean;
  active: boolean;
  legs: TimetableLeg[];
  upcomingTrips: number;
  nextDepartureAt: string | null;
  issues: { departureAt: string; routeId: string; code: string; message: string }[];
  lastGeneratedAt: string | null;
}

/** Result of creating/changing/pausing a timetable. */
export interface TimetableRun {
  timetable: Timetable;
  created: number;
  issues: number;
  removed?: number;
  kept?: number;
}

export interface ScheduleIssues {
  conflicts: { tripId: string; vehicle: string; departureAt: string; from: string; to: string; vehicleCity: string }[];
  gaps: { timetableId: string; timetable: string; departureAt: string; route: string; code: string; message: string }[];
  uncoveredRoutes: { routeId: string; from: string; to: string }[];
  coverageDays: number;
  total: number;
}

/** Problems placing a trip on a vehicle (API error LOCATION_MISMATCH → details.problems). */
export interface ContinuityProblem {
  kind: "start" | "end";
  message: string;
  expectedCity: string;
  actualCity: string;
}
