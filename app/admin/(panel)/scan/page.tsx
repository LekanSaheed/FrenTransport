"use client";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HiMiniCheckCircle, HiMiniExclamationTriangle, HiMiniXCircle } from "react-icons/hi2";
import Button from "@/components/Button";
import { AdminPage, Panel } from "@/components/admin/ui";
import { useCan } from "@/components/admin/access";
import QrScanner from "@/components/admin/QrScanner";
import BookingView from "@/components/booking/BookingView";
import { Field, Input } from "@/components/ui/form";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { adminApi, type TicketScan } from "@/libs/admin";
import { formatDateTime } from "@/libs/format";
import { cn } from "@/libs/utils";
import type { ApiError } from "@/libs/api";

const TONE = {
  valid: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: HiMiniCheckCircle, iconCls: "text-emerald-600" },
  warning: { box: "border-orange-200 bg-orange-50 text-orange-900", icon: HiMiniExclamationTriangle, iconCls: "text-orange-500" },
  invalid: { box: "border-red-200 bg-red-50 text-red-900", icon: HiMiniXCircle, iconCls: "text-red-600" },
} as const;

export default function ScanPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Scanner />
    </Suspense>
  );
}

function Scanner() {
  const can = useCan();
  const router = useRouter();
  const params = useSearchParams();
  const [result, setResult] = useState<TicketScan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"scan" | "checkin" | null>(null);
  const [typed, setTyped] = useState("");

  const lookup = useCallback(async (code: string) => {
    setBusy("scan");
    setError(null);
    try {
      setResult(await adminApi.get<TicketScan>("/tickets/scan", { code }));
    } catch (e) {
      setResult(null);
      setError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  }, []);

  // Opened from a phone's own camera app: the QR link carries ?code=.
  const linked = params.get("code");
  useEffect(() => {
    if (linked) lookup(linked);
  }, [linked, lookup]);

  function next() {
    setResult(null);
    setError(null);
    setTyped("");
    if (linked) router.replace("/admin/scan");
  }

  async function checkIn() {
    if (!result) return;
    setBusy("checkin");
    setError(null);
    try {
      const r = await adminApi.post<TicketScan>(`/bookings/${result.booking.reference}/check-in`);
      setResult(r); // its verdict says "Checked in"
    } catch (e) {
      setError((e as ApiError).message);
      lookup(result.booking.reference); // show the current state (e.g. someone else just checked it in)
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage title="Scan tickets" description="Scan a customer's boarding pass QR code (from their email or Manage Booking), check the details, then check them in.">
      <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          <Panel>
            {/* A fresh scanner per lookup: it stops after one code. */}
            {!result && busy !== "scan" ? <QrScanner key={error ?? "scanner"} onResult={lookup} /> : <ScanAgain onClick={next} />}
          </Panel>
          <Panel title="No QR code?">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim()) lookup(typed.trim());
              }}
              className="flex items-end gap-2"
            >
              <Field label="Booking reference" htmlFor="ref" className="flex-1">
                <Input id="ref" placeholder="OBR-XXXXXX" value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" />
              </Field>
              <Button type="submit" label="Look up" loading={busy === "scan"} />
            </form>
          </Panel>
        </div>

        {/* On phones the result comes first once there is one. */}
        <div className={cn("space-y-4", (result || error) && "order-first lg:order-none")}>
          {error && <Alert tone="error">{error}</Alert>}
          {busy === "scan" && <LoadingBlock label="Checking ticket…" />}
          {!result && !busy && !error && (
            <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border-2 border-dashed border-border-stroke p-8 text-center text-[13.5px] text-gray-500">
              The booking appears here after a scan.
            </div>
          )}
          {result && busy !== "scan" && (
            <>
              <Verdict result={result} />
              {result.booking.trip && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border-stroke bg-white px-4 py-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-500">Vehicle</p>
                    <p className="text-[14px] font-bold text-ink">
                      {result.booking.trip.vehicle} · {formatDateTime(result.booking.trip.departureAt)}
                    </p>
                  </div>
                  {result.booking.trip.plateNumber && (
                    <span className="rounded-[10px] border-2 border-ink bg-white px-3 py-1.5 font-mono text-[18px] font-black tracking-[0.12em] text-ink">
                      {result.booking.trip.plateNumber}
                    </span>
                  )}
                </div>
              )}
              {result.canCheckIn &&
                (can("bookings.checkin") ? (
                  <Button fullWidth label={`Check in ${result.booking.passengers?.length ? `${result.booking.passengers.length} passenger${result.booking.passengers.length > 1 ? "s" : ""}` : "booking"}`} loading={busy === "checkin"} onClick={checkIn} />
                ) : (
                  <p className="text-[13px] text-gray-500">Your role can look up tickets but not check passengers in.</p>
                ))}
              <BookingView booking={result.booking} />
              <p className="text-right text-[13px]">
                <Link href={`/admin/bookings/${result.booking.reference}`} className="font-bold text-primary hover:underline">
                  Open booking {result.booking.reference} →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AdminPage>
  );
}

function Verdict({ result }: { result: TicketScan }) {
  const t = TONE[result.verdict.state];
  const Icon = t.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-[16px] border p-4", t.box)} role="status">
      <Icon size={30} className={cn("shrink-0", t.iconCls)} />
      <div>
        <p className="font-display text-[19px] font-black">{result.verdict.title}</p>
        <p className="mt-0.5 text-[13.5px] leading-[150%]">{result.verdict.detail}</p>
        {result.checkIn && result.verdict.title === "Checked in" && (
          <p className="mt-1 text-[12.5px]">Checked in {formatDateTime(result.checkIn.at)}{result.checkIn.byName ? ` by ${result.checkIn.byName}` : ""}.</p>
        )}
      </div>
    </div>
  );
}

function ScanAgain({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-[13.5px] text-gray-500">Done with this passenger?</p>
      <Button label="Scan next ticket" onClick={onClick} />
    </div>
  );
}
