"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { BookingRow, VerifyEmailBanner } from "@/components/account/AccountWidgets";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { customerApi, useCustomer, type AccountBooking, type AccountSummary } from "@/libs/customer";
import type { ApiError } from "@/libs/api";

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-[10px] border border-border-stroke bg-white p-4 transition hover:border-primary/50">
      <p className="text-[12px] font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-[24px] font-bold tracking-n-4 text-black">{value}</p>
    </Link>
  );
}

export default function AccountOverview() {
  const { user } = useCustomer();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recent, setRecent] = useState<AccountBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcome] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("welcome"));

  useEffect(() => {
    Promise.all([customerApi.summary(), customerApi.bookings("all", 1)])
      .then(([s, b]) => {
        setSummary(s);
        setRecent(b.items.slice(0, 3));
      })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {welcome && <Alert tone="success" title="Welcome to Obere Transport!">Your account is ready. Check your email to confirm your address.</Alert>}
      <VerifyEmailBanner user={user} />
      {error && <Alert tone="error">{error}</Alert>}
      {!summary && !error && <LoadingBlock />}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Upcoming trips" value={summary.upcoming} href="/account/bookings?scope=upcoming" />
            <Stat label="Awaiting payment" value={summary.awaitingPayment} href="/account/bookings?scope=upcoming" />
            <Stat label="Completed" value={summary.completed} href="/account/bookings?scope=past" />
            <Stat label="All bookings" value={summary.total} href="/account/bookings?scope=all" />
          </div>

          <section>
            <h2 className="mb-3 text-[16px] font-bold tracking-n-3">Your next trip</h2>
            {summary.nextTrip ? (
              <BookingRow b={summary.nextTrip} />
            ) : (
              <EmptyState title="No upcoming trips">
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Button href="/book" label="Book a seat" />
                  <Button href="/hire/car" variant="secondary" label="Hire a car" />
                  <Button href="/hire/bus" variant="secondary" label="Hire a bus" />
                </div>
              </EmptyState>
            )}
          </section>

          {recent && recent.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-bold tracking-n-3">Recent bookings</h2>
                <Link href="/account/bookings" className="text-[13px] font-semibold text-primary">
                  See all
                </Link>
              </div>
              <div className="space-y-2">
                {recent.map((b) => (
                  <BookingRow key={b.reference} b={b} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
