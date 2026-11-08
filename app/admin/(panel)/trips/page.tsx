"use client";
import React, { useEffect, useState } from "react";
import { useCan } from "@/components/admin/access";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, FilterBar, Modal, Pagination } from "@/components/admin/ui";
import { TripPhaseBadge, tripVehicleOptions } from "@/components/admin/trips";
import { ScheduleIssuesBanner } from "@/components/admin/schedule";
import Link from "next/link";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi, toKobo, useAdminData, type Paged, type RouteRow, type ScheduleIssues, type TripRow, type VehicleRow } from "@/libs/admin";
import { formatDateTime, naira, todayInLagos } from "@/libs/format";
import type { ApiError } from "@/libs/api";

export default function TripsPage() {
  const can = useCan();
  const [routeId, setRouteId] = useState("");
  const [date, setDate] = useState("");
  const [view, setView] = useState<"upcoming" | "departed" | "cancelled" | "completed" | "all">("upcoming");
  const [page, setPage] = useState(1);
  const [scheduling, setScheduling] = useState(false);
  useEffect(() => setPage(1), [routeId, date, view]);

  const routes = useAdminData<RouteRow[]>("/routes");
  const issues = useAdminData<ScheduleIssues>("/schedule/issues");
  const trips = useAdminData<Paged<TripRow>>("/trips", {
    routeId: routeId || undefined,
    date: date || undefined,
    view,
    page,
    pageSize: 25,
  });
  const activeRoutes = (routes.data ?? []).filter((r) => r.active).sort((a, b) => a.origin.city.localeCompare(b.origin.city) || a.destination.city.localeCompare(b.destination.city));

  return (
    <AdminPage title="Trips" description="Click a trip to see its seats and passengers. Upcoming trips can be rescheduled, moved to another vehicle or have seats blocked." actions={can("trips.manage") ? <Button label="Schedule trips" onClick={() => setScheduling(true)} /> : undefined}>
      <ScheduleIssuesBanner data={issues.data} />
      <FilterBar>
        <Select aria-label="Route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          <option value="">All routes</option>
          {activeRoutes.map((r) => (
            <option key={r._id} value={r._id}>
              {r.origin.city} → {r.destination.city}
            </option>
          ))}
        </Select>
        <Input aria-label="Departure date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select
          aria-label="Show"
          value={view}
          onValueChange={(v) => setView(v as typeof view)}
          options={[
            { value: "upcoming", label: "Upcoming (can be changed)" },
            { value: "departed", label: "Departed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "completed", label: "Completed" },
            { value: "all", label: "All trips" },
          ]}
        />
      </FilterBar>

      <DataState loading={trips.loading} error={trips.error} hasData={!!trips.data}>
        {trips.data && (
          <>
            <DataTable
              rows={trips.data.items}
              rowKey={(t) => t.id}
              href={(t) => `/admin/trips/${t.id}`}
              empty="No trips match"
              columns={[
                { header: "Departure", cell: (t) => formatDateTime(t.departureAt) },
                { header: "Route", cell: (t) => `${t.origin.city} → ${t.destination.city}` },
                { header: "Vehicle", cell: (t) => (t.vehicle ? `${t.vehicle.plateNumber} · ${t.category?.name ?? ""}` : "—") },
                { header: "Fare", cell: (t) => naira(t.priceKobo) },
                {
                  header: "Seats",
                  cell: (t) => (
                    <span>
                      <strong>{t.seats.booked}</strong>/{t.seats.total} sold
                      {t.seats.held ? <span className="text-gray-500"> · {t.seats.held} held</span> : null}
                      {t.seats.blocked ? <span className="text-orange-600"> · {t.seats.blocked} blocked</span> : null}
                    </span>
                  ),
                },
                { header: "Status", cell: (t) => <TripPhaseBadge phase={t.phase} /> },
              ]}
            />
            <Pagination page={trips.data.page} pageSize={trips.data.pageSize} total={trips.data.total} onPage={setPage} />
          </>
        )}
      </DataState>

      <ScheduleModal open={scheduling} routes={activeRoutes} onClose={() => setScheduling(false)} onDone={() => (setScheduling(false), trips.reload())} />
    </AdminPage>
  );
}

function ScheduleModal({ open, routes, onClose, onDone }: { open: boolean; routes: RouteRow[]; onClose: () => void; onDone: () => void }) {
  const vehicles = useAdminData<VehicleRow[]>(open ? "/vehicles" : null, { status: "active" });
  const [form, setForm] = useState({ routeId: "", vehicleId: "", fromDate: todayInLagos(1), toDate: todayInLagos(1), times: "07:00", price: "", allowReposition: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: { departureAt: string; reason: string; message: string }[] } | null>(null);
  const route = routes.find((r) => r._id === form.routeId);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const times = form.times.split(/[,\s]+/).filter(Boolean);
      const r = await adminApi.post<{ created: number; skipped: { departureAt: string; reason: string; message: string }[] }>("/trips/generate", {
        routeId: form.routeId,
        vehicleId: form.vehicleId,
        fromDate: form.fromDate,
        toDate: form.toDate,
        times,
        ...(form.price && { priceKobo: toKobo(form.price) }),
        ...(form.allowReposition && { allowReposition: true }),
      });
      setResult(r);
    } catch (err) {
      const e2 = err as ApiError;
      const fields = Object.values(e2.fieldErrors);
      setError(fields.length ? fields.join("; ") : e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Schedule trips" onClose={() => (setResult(null), onClose())} wide>
      {result ? (
        <div className="space-y-4">
          <Alert tone={result.skipped.length ? "warning" : "success"} title={`${result.created} trip(s) scheduled`}>
            {result.skipped.length > 0 && (
              <>
                <p>{result.skipped.length} skipped:</p>
                <ul className="mt-1 max-h-[180px] list-disc space-y-0.5 overflow-y-auto pl-4">
                  {result.skipped.map((s) => (
                    <li key={s.departureAt}>
                      <strong>{formatDateTime(s.departureAt)}</strong>: {s.reason === "VEHICLE_BUSY" ? "the vehicle is on another trip then." : s.message}
                    </li>
                  ))}
                </ul>
                {result.skipped.some((s) => s.reason === "LOCATION_MISMATCH") && (
                  <p className="mt-2">
                    A vehicle can&apos;t run the same one-way route every day. Use a <Link href="/admin/timetables" className="font-bold underline">timetable</Link> with the return trip, or tick &quot;repositions empty&quot;.
                  </p>
                )}
              </>
            )}
          </Alert>
          <Button fullWidth label="Done" onClick={() => (setResult(null), onDone())} />
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Route" htmlFor="route" hint="Only active routes can be scheduled.">
              <Select id="route" value={form.routeId} onChange={set("routeId")} required>
                <option value="">Choose a route</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.origin.city} → {r.destination.city}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Vehicle" htmlFor="vehicle" hint="Its seat layout becomes the trip's seat map.">
              <Select
                id="vehicle"
                value={form.vehicleId}
                onValueChange={(vehicleId) => setForm({ ...form, vehicleId })}
                placeholder={vehicles.loading ? "Loading vehicles…" : "Choose a vehicle"}
                options={tripVehicleOptions(vehicles.data ?? [])}
                required
              />
            </Field>
            <Field label="From date" htmlFor="from">
              <Input id="from" type="date" min={todayInLagos()} value={form.fromDate} onChange={set("fromDate")} required />
            </Field>
            <Field label="To date" htmlFor="to" hint="Up to 90 days at a time.">
              <Input id="to" type="date" min={form.fromDate} value={form.toDate} onChange={set("toDate")} required />
            </Field>
            <Field label="Departure times (WAT)" htmlFor="times" hint="One or more, e.g. 07:00, 14:30">
              <Input id="times" value={form.times} onChange={set("times")} required />
            </Field>
            <label className="flex items-start gap-2 text-[13px] sm:col-span-2">
              <input type="checkbox" className="mt-0.5" checked={form.allowReposition} onChange={(e) => setForm({ ...form, allowReposition: e.target.checked })} />
              <span>
                <strong>The vehicle repositions empty when needed.</strong> Without this, departures where the vehicle won&apos;t be in the starting city are skipped.
              </span>
            </label>
            <Field label="Fare (₦)" htmlFor="price" hint={route?.defaultFareKobo ? `Leave empty to use the route fare (${naira(route.defaultFareKobo)})` : "Required: this route has no default fare"}>
              <Input id="price" type="number" min={1} step="0.01" value={form.price} onChange={set("price")} required={!route?.defaultFareKobo} />
            </Field>
          </div>
          <Button type="submit" fullWidth label="Schedule" loading={busy} />
        </form>
      )}
    </Modal>
  );
}
