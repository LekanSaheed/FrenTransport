"use client";
import React, { useCallback, useEffect, useState } from "react";
import { BookingRow, ClaimBooking } from "@/components/account/AccountWidgets";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import Button from "@/components/Button";
import { customerApi, type AccountBooking } from "@/libs/customer";
import { cn } from "@/libs/utils";
import type { ApiError } from "@/libs/api";

type Scope = "upcoming" | "past" | "all";
const TABS: { scope: Scope; label: string }[] = [
  { scope: "upcoming", label: "Upcoming" },
  { scope: "past", label: "Past & cancelled" },
  { scope: "all", label: "All" },
];

export default function AccountBookings() {
  const [scope, setScope] = useState<Scope>(() => {
    const s = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("scope") : null;
    return s === "past" || s === "all" ? s : "upcoming";
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AccountBooking[]; total: number; pageSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return customerApi
      .bookings(scope, page)
      .then(setData)
      .catch((e: ApiError) => setError(e.message));
  }, [scope, page]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[10px] border border-border-stroke bg-white p-1 text-[13px] font-semibold" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.scope}
              role="tab"
              aria-selected={scope === t.scope}
              onClick={() => (setScope(t.scope), setPage(1))}
              className={cn("rounded-[8px] px-3.5 py-1.5", scope === t.scope ? "bg-black text-white" : "text-gray-600")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ClaimBooking
          onClaimed={(ref) => {
            setNotice(`Booking ${ref} added to your account.`);
            setScope("all");
            setPage(1);
          }}
        />
      </div>

      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {!data && !error && <LoadingBlock />}

      {data && data.items.length === 0 && (
        <EmptyState title={scope === "upcoming" ? "No upcoming trips" : "No bookings here yet"}>
          {scope === "upcoming" && (
            <div className="mt-3">
              <Button href="/book" label="Book a seat" />
            </div>
          )}
          <p className="mt-3">Booked as a guest before you signed up? Confirm your email, or add the booking with its reference.</p>
        </EmptyState>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((b) => (
            <BookingRow key={b.reference} b={b} />
          ))}
        </div>
      )}

      {data && pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-gray-500">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" label="Previous" disabled={page <= 1} onClick={() => setPage(page - 1)} />
            <Button variant="secondary" label="Next" disabled={page >= pages} onClick={() => setPage(page + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}
