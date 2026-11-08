"use client";
import { useEffect, useSyncExternalStore } from "react";
import { request } from "./api";
import type { BookingStatus, BookingType, PaymentStatus } from "./types";

/**
 * Customer accounts. The session lives in an HttpOnly cookie the browser sends
 * automatically; this module only mirrors "who is signed in" for the UI so the
 * header and account pages stay in sync. The backend decides access every time.
 */

export interface CustomerUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "customer";
  emailVerified: boolean;
}

type State = { status: "loading" | "ready"; user: CustomerUser | null };
let state: State = { status: "loading", user: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function refreshCustomer(): Promise<void> {
  inflight ??= request<{ user: CustomerUser | null }>("/auth/me")
    .then((r) => set({ status: "ready", user: r.user }))
    .catch(() => set({ status: "ready", user: null }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Current customer (null when signed out). Loads once per page load. */
export function useCustomer() {
  const snapshot = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state,
  );
  useEffect(() => {
    if (state.status === "loading") void refreshCustomer();
  }, []);
  return { user: snapshot.user, loading: snapshot.status === "loading" };
}

export const customerApi = {
  async register(input: { fullName: string; email: string; phone?: string; password: string }) {
    const r = await request<{ user: CustomerUser }>("/auth/register", { method: "POST", body: input });
    set({ status: "ready", user: r.user });
    return r.user;
  },
  async login(email: string, password: string) {
    const r = await request<{ user: CustomerUser }>("/auth/login", { method: "POST", body: { email, password } });
    set({ status: "ready", user: r.user });
    return r.user;
  },
  async logout() {
    await request("/auth/logout", { method: "POST" }).catch(() => undefined);
    set({ status: "ready", user: null });
  },
  async updateProfile(input: { fullName?: string; phone?: string | null }) {
    const r = await request<{ user: CustomerUser }>("/auth/me", { method: "PATCH", body: input });
    set({ status: "ready", user: r.user });
    return r.user;
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>("/auth/me/password", { method: "POST", body: { currentPassword, newPassword } }),
  forgotPassword: (email: string) => request<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", { method: "POST", body: { token, password } }),
  async verifyEmail(token: string) {
    const r = await request<{ user: CustomerUser & { linkedBookings: number } }>("/auth/verify-email", { method: "POST", body: { token } });
    void refreshCustomer();
    return r.user;
  },
  resendVerification: () => request<{ alreadyVerified: boolean }>("/auth/verify-email/resend", { method: "POST" }),

  summary: () => request<AccountSummary>("/account/summary"),
  bookings: (scope: "upcoming" | "past" | "all", page: number) =>
    request<{ items: AccountBooking[]; page: number; pageSize: number; total: number }>("/account/bookings", { query: { scope, page, pageSize: 10 } }),
  claim: (reference: string, email: string, code: string) =>
    request<{ reference: string }>("/account/bookings/claim", { method: "POST", body: { reference, email, code } }),
};

export interface AccountBooking {
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
}

export interface AccountSummary {
  upcoming: number;
  completed: number;
  awaitingPayment: number;
  total: number;
  nextTrip: AccountBooking | null;
}

/** Only follow `next` to a page on this site (no open redirects, never into admin). */
export function safeNext(next: string | null, fallback = "/account") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/admin")) return fallback;
  return next;
}
