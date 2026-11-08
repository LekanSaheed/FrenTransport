"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useCan } from "@/components/admin/access";
import SeatGrid, { Legend, type GridSeat } from "@/components/seatmap/SeatGrid";
import { TripPhaseBadge, tripVehicleOptions } from "@/components/admin/trips";
import { RepositionPrompt, continuityProblems } from "@/components/admin/schedule";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, Modal, Panel, SmallButton } from "@/components/admin/ui";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert, PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { DetailList } from "@/components/ui/layout";
import { adminApi, toKobo, toNaira, useAdminData, type ContinuityProblem, type TripDetail, type VehicleRow } from "@/libs/admin";
import { durationLabel, formatDateTime, lagosDateTime, naira } from "@/libs/format";
import type { ApiError } from "@/libs/api";

const SEAT_STYLE = {
  available: "border-border-stroke bg-white text-black",
  held: "border-primary/30 bg-primary/10 text-primary",
  booked: "border-gray-300 bg-gray-200 text-gray-500",
  blocked: "border-orange-300 bg-orange-100 text-orange-700",
} as const;

/** Splits an ISO time into date + time inputs in Nigerian time. */
function lagosParts(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3_600_000).toISOString();
  return { date: d.slice(0, 10), time: d.slice(11, 16) };
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, error, loading, reload } = useAdminData<TripDetail>(`/trips/${id}`);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"edit" | "cancel" | null>(null);

  // Only trips that haven't left yet can be changed (the API enforces the same rule).
  const can = useCan();
  const upcoming = trip?.phase === "upcoming";
  // Changes need an upcoming trip and a role that can manage trips.
  const editable = upcoming && can("trips.manage");
  const selectedStates = useMemo(() => new Set(selected.map((l) => trip?.seatMap.find((s) => s.label === l)?.state)), [selected, trip]);

  async function act(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(message);
      setSelected([]);
      await reload();
    } catch (e) {
      setActionError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage
      title={trip ? `${trip.origin.city} → ${trip.destination.city}` : "Trip"}
      description={trip ? `${formatDateTime(trip.departureAt)} · ${trip.vehicle?.plateNumber ?? "no vehicle"} · ${trip.category?.name ?? ""}` : undefined}
      back={{ href: "/admin/trips", label: "Trips" }}
    >
      <DataState loading={loading} error={error} hasData={!!trip}>
        {trip && (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {notice && <Alert tone="success">{notice}</Alert>}
              {actionError && <Alert tone="error">{actionError}</Alert>}

              <Panel title="Seats">
                <AdminSeatMap
                  trip={trip}
                  selected={selected}
                  editable={editable}
                  onToggle={(label) => setSelected((sel) => (sel.includes(label) ? sel.filter((x) => x !== label) : [...sel, label]))}
                />
                {editable && selected.length > 0 && (
                  <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-between gap-2 rounded-[12px] border border-accent/30 bg-accent-soft px-4 py-2.5" aria-live="polite">
                    <p className="text-[13px] font-bold text-ink">
                      {selected.length} seat{selected.length > 1 ? "s" : ""} selected: {selected.join(", ")}
                    </p>
                    <div className="flex gap-2">
                      {selectedStates.has("available") && (
                        <SmallButton tone="primary" disabled={busy} onClick={() => act(() => adminApi.post(`/trips/${trip.id}/seats`, { seats: selected.filter((l) => trip.seatMap.find((x) => x.label === l)?.state === "available"), blocked: true }), "Seats blocked.")}>
                          Block{selectedStates.has("blocked") ? " free ones" : ""}
                        </SmallButton>
                      )}
                      {selectedStates.has("blocked") && (
                        <SmallButton disabled={busy} onClick={() => act(() => adminApi.post(`/trips/${trip.id}/seats`, { seats: selected.filter((l) => trip.seatMap.find((x) => x.label === l)?.state === "blocked"), blocked: false }), "Seats released.")}>
                          Release{selectedStates.has("available") ? " blocked ones" : ""}
                        </SmallButton>
                      )}
                      <SmallButton onClick={() => setSelected([])}>Clear</SmallButton>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-4 text-[12px] text-gray-500">
                  <span>{trip.seats.available} free</span>
                  <span>{trip.seats.booked} sold</span>
                  <span>{trip.seats.held} held (awaiting payment)</span>
                  <span className="text-orange-600">{trip.seats.blocked} blocked</span>
                </div>
                <p className="mt-2 text-center text-[12px] text-gray-500">
                  {editable
                    ? "Click free seats to select them for blocking (takes them off sale), or blocked seats to release them. Sold or held seats can't be blocked."
                    : upcoming
                      ? "Your role can view seats but not block or release them."
                      : "Seats can't be blocked or released because this trip is no longer upcoming."}
                </p>
              </Panel>

              <Panel title={`Passengers (${trip.passengers.length})`}>
                <DataTable
                  rows={trip.passengers}
                  rowKey={(p) => `${p.bookingReference}-${p.seat}`}
                  empty="No passengers yet"
                  columns={[
                    { header: "Seat", cell: (p) => <strong>{p.seat}</strong> },
                    { header: "Name", cell: (p) => p.fullName },
                    { header: "Booking", cell: (p) => <Link href={`/admin/bookings/${p.bookingReference}`} className="text-primary">{p.bookingReference}</Link> },
                    { header: "Phone", cell: (p) => p.contactPhone },
                    { header: "Status", cell: (p) => <div className="flex flex-col items-start gap-1"><StatusBadge status={p.bookingStatus} /><PaymentBadge status={p.paymentStatus} /></div> },
                  ]}
                />
              </Panel>
            </div>

            <aside className="space-y-3">
              <Panel title="Details">
                <DetailList
                  rows={[
                    ["Departure", formatDateTime(trip.departureAt)],
                    ["Arrival (est.)", formatDateTime(trip.arrivalAt)],
                    ["Duration", durationLabel(trip.departureAt, trip.arrivalAt)],
                    ["Vehicle", trip.vehicle ? `${trip.vehicle.plateNumber}` : "—"],
                    ["Type", trip.category?.name ?? "—"],
                    ["Fare", naira(trip.priceKobo)],
                    ["Status", <TripPhaseBadge key="s" phase={trip.phase} />],
                    [
                      "Scheduled by",
                      trip.timetableId ? (
                        <Link key="tt" href={`/admin/timetables?open=${trip.timetableId}`} className="text-primary hover:underline">
                          Timetable
                        </Link>
                      ) : (
                        "One-off"
                      ),
                    ],
                    ...(trip.repositioned ? ([["Before this trip", <span key="rp" className="text-orange-600">Vehicle travels here empty</span>]] as [string, React.ReactNode][]) : []),
                  ]}
                />
              </Panel>
              {!upcoming && (
                <Panel title="Changes closed">
                  <p className="text-[13px] leading-[160%] text-gray-600">
                    {trip.phase === "cancelled"
                      ? "This trip was cancelled, so it can't be rescheduled, moved to another vehicle or have seats blocked."
                      : trip.phase === "completed"
                        ? "This trip is completed. Its seat map and passenger list are kept for your records."
                        : "This trip has already departed, so it can't be rescheduled, moved to another vehicle or have seats blocked. The passenger list stays available."}
                  </p>
                  <Link href="/admin/trips" className="mt-3 inline-block text-[13px] font-bold text-primary hover:underline">
                    See upcoming trips →
                  </Link>
                </Panel>
              )}
              {editable && (
                <Panel title="Manage">
                  <div className="flex flex-col gap-2">
                    <Button label="Edit time, fare or vehicle" onClick={() => setModal("edit")} />
                    <Button variant="secondary" className="!border-red-300 !text-red-600" label="Cancel trip" onClick={() => setModal("cancel")} />
                    {trip.passengers.length === 0 && (
                      <Button
                        variant="secondary"
                        label="Delete trip"
                        loading={busy}
                        onClick={() =>
                          window.confirm("Delete this trip? This can't be undone.") &&
                          act(async () => {
                            await adminApi.del(`/trips/${trip.id}`);
                            router.replace("/admin/trips");
                          }, "Trip deleted.")
                        }
                      />
                    )}
                  </div>
                </Panel>
              )}
            </aside>

            <EditTripModal open={modal === "edit"} trip={trip} onClose={() => setModal(null)} onSaved={(msg) => (setModal(null), setNotice(msg), reload())} />
            <CancelTripModal open={modal === "cancel"} trip={trip} onClose={() => setModal(null)} onDone={(msg) => (setModal(null), setNotice(msg), reload())} />
          </div>
        )}
      </DataState>
    </AdminPage>
  );
}

function EditTripModal({ open, trip, onClose, onSaved }: { open: boolean; trip: TripDetail; onClose: () => void; onSaved: (message: string) => void }) {
  const start = lagosParts(trip.departureAt);
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [price, setPrice] = useState(toNaira(trip.priceKobo));
  const [vehicleId, setVehicleId] = useState(trip.vehicle?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<ContinuityProblem[] | null>(null);
  const [allowReposition, setAllowReposition] = useState(false);
  const vehicles = useAdminData<VehicleRow[]>(open ? "/vehicles" : null);
  const hasPassengers = trip.passengers.length > 0;

  // Start from the trip's current values every time the form opens.
  useEffect(() => {
    if (!open) return;
    const now = lagosParts(trip.departureAt);
    setDate(now.date);
    setTime(now.time);
    setPrice(toNaira(trip.priceKobo));
    setVehicleId(trip.vehicle?.id ?? "");
    setError(null);
    setProblems(null);
    setAllowReposition(false);
  }, [open, trip]);

  // A different time or vehicle needs a fresh location check.
  useEffect(() => {
    setProblems(null);
    setAllowReposition(false);
  }, [date, time, vehicleId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    const departureAt = lagosDateTime(date, time);
    if (new Date(departureAt).getTime() !== new Date(trip.departureAt).getTime()) body.departureAt = departureAt;
    if (toKobo(price) !== trip.priceKobo) body.priceKobo = toKobo(price);
    if (vehicleId && vehicleId !== trip.vehicle?.id) body.vehicleId = vehicleId;
    if (allowReposition) body.allowReposition = true;
    if (!Object.keys(body).length) return onClose();
    if (body.departureAt && hasPassengers && !window.confirm(`Move this departure? ${trip.passengers.length} passenger(s) will be emailed the new time.`)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await adminApi.patch<{ notifiedPassengers: number }>(`/trips/${trip.id}`, body);
      onSaved(r.notifiedPassengers ? `Trip updated. ${r.notifiedPassengers} passenger booking(s) moved and emailed.` : "Trip updated.");
    } catch (err) {
      const found = continuityProblems(err);
      if (found) setProblems(found);
      else setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Edit trip" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {problems && <RepositionPrompt problems={problems} accepted={allowReposition} onAccept={setAllowReposition} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="d">
            <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time (WAT)" htmlFor="t">
            <Input id="t" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Fare (₦)" htmlFor="p" hint="Applies to new bookings only; existing passengers keep their fare.">
          <Input id="p" type="number" min={1} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Vehicle" htmlFor="v" hint="Must be free at this time and keep every sold seat.">
          <Select
            id="v"
            value={vehicleId}
            onValueChange={setVehicleId}
            placeholder={vehicles.loading ? "Loading vehicles…" : "Choose a vehicle"}
            options={tripVehicleOptions(vehicles.data ?? [], trip.vehicle?.id)}
          />
        </Field>
        {hasPassengers && <Alert tone="info">Changing the time moves {trip.passengers.length} passenger(s) with the trip and emails them.</Alert>}
        <Button type="submit" fullWidth label={problems && allowReposition ? "Save anyway" : "Save"} loading={busy} disabled={!!problems && !allowReposition} />
      </form>
    </Modal>
  );
}

function CancelTripModal({ open, trip, onClose, onDone }: { open: boolean; trip: TripDetail; onClose: () => void; onDone: (m: string) => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paid = new Set(trip.passengers.filter((p) => p.paymentStatus === "paid").map((p) => p.bookingReference)).size;
  const all = new Set(trip.passengers.map((p) => p.bookingReference)).size;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await adminApi.post<{ cancelled: number; refunded: number; failed: string[] }>(`/trips/${trip.id}/cancel`, { reason: reason.trim() });
      onDone(`Trip cancelled. ${r.cancelled} booking(s) cancelled, ${r.refunded} refunded in full.${r.failed.length ? ` Check: ${r.failed.join(", ")}` : ""}`);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Cancel trip" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Alert tone="warning">
          This cancels {all} booking(s) on this trip. {paid} paid booking(s) will be refunded in full, and every passenger is emailed the reason. This can&apos;t be undone.
        </Alert>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Reason (shown to passengers)" htmlFor="r">
          <Textarea id="r" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} placeholder="e.g. Vehicle breakdown" />
        </Field>
        <Button type="submit" fullWidth className="!bg-red-600" label="Cancel trip and refund" loading={busy} disabled={reason.trim().length < 5} />
      </form>
    </Modal>
  );
}

const STATE_TONE = { available: "available", booked: "booked", held: "held", blocked: "blocked" } as const;

/** The trip's real seat layout; free and blocked seats can be selected to block or release them. */
function AdminSeatMap({ trip, selected, editable, onToggle }: { trip: TripDetail; selected: string[]; editable: boolean; onToggle: (label: string) => void }) {
  const { rows, columns, driver } = trip.seatLayout;
  const positioned = !!rows && !!columns && trip.seatMap.every((s) => s.row != null && s.column != null);
  const seats: GridSeat[] = trip.seatMap.map((s, i) => {
    const selectable = editable && (s.state === "available" || s.state === "blocked");
    const describe = `Seat ${s.label}, ${s.state}${s.bookingReference ? `, booking ${s.bookingReference}` : ""}`;
    return {
      key: s.label,
      label: s.label,
      row: positioned ? s.row! : Math.floor((i + 1) / 4),
      column: positioned ? s.column! : (i + 1) % 4,
      tone: STATE_TONE[s.state],
      onClick: selectable ? () => onToggle(s.label) : undefined,
      pressed: selectable ? selected.includes(s.label) : undefined,
      ring: selected.includes(s.label),
      ariaLabel: describe,
      title: describe,
    };
  });
  const geometry = positioned
    ? { rows: rows!, columns: columns!, driver: driver ?? { row: 0, column: 0 } }
    : { rows: Math.ceil((trip.seatMap.length + 1) / 4), columns: 4, driver: { row: 0, column: 0 } };
  return (
    <div className="py-2">
      <SeatGrid geometry={geometry} seats={seats} label="Trip seat map" />
      <Legend
        items={[
          { tone: "available", label: "Free" },
          { tone: "booked", label: "Sold" },
          { tone: "held", label: "Held" },
          { tone: "blocked", label: "Blocked" },
        ]}
      />
    </div>
  );
}
