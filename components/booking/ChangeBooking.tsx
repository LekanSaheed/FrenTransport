"use client";
import React, { useEffect, useState } from "react";
import { HiMiniChevronDown } from "react-icons/hi2";
import Button from "@/components/Button";
import SeatMap from "./SeatMap";
import { Field, Input } from "@/components/ui/form";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { Card, SectionTitle } from "@/components/ui/layout";
import { api, type ApiError } from "@/libs/api";
import { durationLabel, formatDateTime, formatTime, naira, todayInLagos } from "@/libs/format";
import { cn } from "@/libs/utils";
import type { BookingDetails, DateChangeOption, TripDetails } from "@/libs/types";

type Section = "names" | "seats" | "date";

/**
 * Self-service changes to a seat booking: passenger names and seats (free,
 * instant) and a move to a later departure (with the charge set by the
 * operator). The API enforces every rule; this only guides the customer.
 */
export default function ChangeBooking({
  booking,
  token,
  onUpdated,
  onError,
}: {
  booking: BookingDetails;
  token?: string;
  onUpdated: (booking: BookingDetails, message: string) => void;
  onError: (err: unknown) => void;
}) {
  const [open, setOpen] = useState<Section | null>(null);
  const changes = booking.changes;
  if (!changes || booking.type !== "seat") return null;
  const { rules, pending } = changes;
  if (!rules.names.allowed && !rules.seats.allowed && !rules.dateChange.allowed && !pending) return null;

  const toggle = (s: Section) => setOpen(open === s ? null : s);
  const props = { booking, token, onUpdated, onError, close: () => setOpen(null) };

  return (
    <Card>
      <SectionTitle>Change your booking</SectionTitle>
      {pending && <PendingChange {...props} />}
      <div className="divide-y divide-border-stroke">
        <Row title="Passenger names" hint="Free · changes immediately" rule={rules.names} open={open === "names"} onToggle={() => toggle("names")}>
          <NamesForm {...props} />
        </Row>
        <Row title="Seats" hint="Free · if seats are available" rule={rules.seats} open={open === "seats"} onToggle={() => toggle("seats")}>
          <SeatsForm {...props} />
        </Row>
        <Row
          title="Travel date"
          hint={rules.dateChange.chargeMode === "percentage" ? `${rules.dateChange.feePercent}% of your fare` : "Pay any fare difference"}
          rule={rules.dateChange}
          open={open === "date"}
          onToggle={() => toggle("date")}
        >
          <DateForm {...props} />
        </Row>
      </div>
    </Card>
  );
}

function Row({ title, hint, rule, open, onToggle, children }: { title: string; hint: string; rule: { allowed: boolean; reason: string | null }; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={!rule.allowed}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-2.5 text-left disabled:cursor-not-allowed"
      >
        <span>
          <span className={cn("block text-[14px] font-bold", rule.allowed ? "text-ink" : "text-gray-400")}>{title}</span>
          <span className="block text-[12px] text-gray-500">{rule.allowed ? hint : rule.reason}</span>
        </span>
        {rule.allowed && <HiMiniChevronDown className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180")} size={18} />}
      </button>
      {open && rule.allowed && <div className="pb-3">{children}</div>}
    </div>
  );
}

interface FormProps {
  booking: BookingDetails;
  token?: string;
  onUpdated: (booking: BookingDetails, message: string) => void;
  onError: (err: unknown) => void;
  close: () => void;
}

/* --------------------------------- names --------------------------------- */

function NamesForm({ booking, token, onUpdated, onError, close }: FormProps) {
  const passengers = booking.passengers ?? [];
  const [names, setNames] = useState(() => Object.fromEntries(passengers.map((p) => [p.seat, p.fullName])));
  const [busy, setBusy] = useState(false);
  const changed = passengers.filter((p) => (names[p.seat] ?? "").trim() !== p.fullName);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api.manage.changeNames(booking.reference, token, changed.map((p) => ({ seat: p.seat, fullName: names[p.seat]!.trim() })));
      onUpdated(updated, "Passenger names updated. We've emailed you the new details.");
      close();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      {passengers.map((p) => (
        <Field key={p.seat} label={`Seat ${p.seat}`} htmlFor={`name-${p.seat}`}>
          <Input id={`name-${p.seat}`} value={names[p.seat] ?? ""} onChange={(e) => setNames({ ...names, [p.seat]: e.target.value })} required minLength={2} maxLength={100} />
        </Field>
      ))}
      <Button type="submit" fullWidth label="Save names" loading={busy} disabled={!changed.length || changed.some((p) => (names[p.seat] ?? "").trim().length < 2)} />
    </form>
  );
}

/* --------------------------------- seats --------------------------------- */

function SeatsForm({ booking, token, onUpdated, onError, close }: FormProps) {
  const own = booking.seats ?? [];
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [selected, setSelected] = useState<string[]>(own);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.trip(booking.trip!.id).then(setTrip).catch(onError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.trip?.id]);

  if (!trip) return <LoadingBlock label="Loading seats…" />;

  // The booking's own seats show as chosen and can be swapped; others as on the normal map.
  const seats = trip.seatMap.seats.map((s) => ({ ...s, available: s.available || own.includes(s.label) }));
  const othersFree = seats.some((s) => s.available && !own.includes(s.label));
  const added = selected.filter((s) => !own.includes(s));
  const removed = own.filter((s) => !selected.includes(s));
  const ready = selected.length === own.length && added.length > 0;

  function toggle(label: string) {
    setSelected((sel) => (sel.includes(label) ? sel.filter((s) => s !== label) : sel.length < own.length ? [...sel, label] : sel));
  }

  async function save() {
    setBusy(true);
    try {
      const updated = await api.manage.changeSeats(booking.reference, token, removed.map((from, i) => ({ from, to: added[i]! })));
      onUpdated(updated, `Seats changed: ${removed.map((f, i) => `${f} → ${added[i]}`).join(", ")}.`);
      close();
    } catch (err) {
      onError(err);
      api.trip(booking.trip!.id).then(setTrip).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  if (!othersFree) return <Alert tone="warning">No more available seats on this trip. Your current seats are unchanged.</Alert>;

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-gray-500">
        Tap one of your seats to free it, then tap a new seat. You have {own.length} seat{own.length > 1 ? "s" : ""}.
      </p>
      <SeatMap {...trip.seatMap} seats={seats} selected={selected} max={own.length} onToggle={toggle} />
      {selected.length < own.length && <p className="text-center text-[12.5px] font-semibold text-orange-700">Choose {own.length - selected.length} more seat{own.length - selected.length > 1 ? "s" : ""}.</p>}
      <Button fullWidth label={ready ? `Move to seat${added.length > 1 ? "s" : ""} ${added.join(", ")}` : "Choose a new seat"} loading={busy} disabled={!ready} onClick={save} />
    </div>
  );
}

/* --------------------------------- date ---------------------------------- */

function DateForm({ booking, token, onUpdated, onError }: FormProps) {
  const departure = booking.trip!.departureAt;
  const firstDate = new Date(departure) > new Date() ? departure.slice(0, 10) : todayInLagos();
  const [date, setDate] = useState(todayInLagos(0) > firstDate ? todayInLagos() : firstDate);
  const [options, setOptions] = useState<DateChangeOption[] | null>(null);
  const [chosen, setChosen] = useState<DateChangeOption | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOptions(null);
    setChosen(null);
    api.manage
      .dateChangeOptions(booking.reference, token, date)
      .then((r) => setOptions(r.trips))
      .catch((err) => (onError(err), setOptions([])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function confirm() {
    if (!chosen) return;
    setBusy(true);
    try {
      const res = await api.manage.startDateChange(booking.reference, token, chosen.id);
      if (!res.paymentRequired) {
        onUpdated(res.booking, `Your trip has moved to ${formatDateTime(chosen.departureAt)}. No charge was needed.`);
        return;
      }
      const checkout = await api.manage.payDateChange(booking.reference, token);
      window.location.href = checkout.authorizationUrl;
    } catch (err) {
      onError(err);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field label="New travel date" htmlFor="new-date" hint="Same route, any departure after your current one.">
        <Input id="new-date" type="date" min={firstDate} max={todayInLagos(90)} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {!options ? (
        <LoadingBlock label="Finding later departures…" />
      ) : options.length === 0 ? (
        <p className="rounded-[12px] bg-canvas px-3 py-3 text-[13px] text-gray-600">No later departures with enough seats on this date. Try another day.</p>
      ) : (
        <ul className="space-y-2" role="radiogroup" aria-label="Later departures">
          {options.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="radio"
                aria-checked={chosen?.id === t.id}
                disabled={!t.bookable}
                onClick={() => setChosen(t)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[12px] border-2 px-3 py-2.5 text-left transition disabled:opacity-50",
                  chosen?.id === t.id ? "border-accent bg-accent-soft" : "border-border-stroke hover:border-primary/40",
                )}
              >
                <span>
                  <span className="block font-display text-[16px] font-black text-ink">{formatTime(t.departureAt)}</span>
                  <span className="block text-[11.5px] text-gray-500">
                    {durationLabel(t.departureAt, t.arrivalAt)} · {t.vehicle.category} · {t.availableSeats} left
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[14px] font-extrabold text-ink">{t.feeKobo ? naira(t.feeKobo) : "Free"}</span>
                  <span className="block text-[11px] text-gray-500">to change</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {chosen && (
        <div className="space-y-2 rounded-[12px] bg-canvas p-3 text-[12.5px] text-gray-600">
          <p>
            <strong className="text-ink">{formatDateTime(chosen.departureAt)}</strong> · seats are assigned automatically (you can change them afterwards).
          </p>
          {chosen.feeKobo > 0 && <p>Seats are held while you pay. The change charge isn&apos;t refundable.</p>}
          <Button fullWidth label={chosen.feeKobo ? `Pay ${naira(chosen.feeKobo)} and change date` : "Change date (no charge)"} loading={busy} onClick={confirm} />
        </div>
      )}
    </div>
  );
}

/** A move to a later trip that's reserved but not yet paid for. */
function PendingChange({ booking, token, onUpdated, onError }: FormProps) {
  const p = booking.changes!.pending!;
  const [busy, setBusy] = useState<"pay" | "cancel" | null>(null);
  return (
    <Alert tone="warning" className="mb-3" title={`Moving to ${formatDateTime(p.toDepartureAt)}`}>
      <p>
        Seats {p.seats.join(", ")} are held until {formatTime(p.holdExpiresAt)}. Pay {naira(p.feeKobo)} to complete the change.
      </p>
      <div className="mt-2 flex gap-2">
        <Button
          label={`Pay ${naira(p.feeKobo)}`}
          className="h-9"
          loading={busy === "pay"}
          onClick={async () => {
            setBusy("pay");
            try {
              window.location.href = (await api.manage.payDateChange(booking.reference, token)).authorizationUrl;
            } catch (err) {
              onError(err);
              setBusy(null);
            }
          }}
        />
        <Button
          variant="secondary"
          className="h-9"
          label="Keep current trip"
          loading={busy === "cancel"}
          onClick={async () => {
            setBusy("cancel");
            try {
              onUpdated(await api.manage.cancelDateChange(booking.reference, token), "Date change cancelled. You're still on your original trip.");
            } catch (err) {
              onError(err as ApiError);
            } finally {
              setBusy(null);
            }
          }}
        />
      </div>
    </Alert>
  );
}
