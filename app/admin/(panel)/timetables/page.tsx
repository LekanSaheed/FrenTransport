"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useCan } from "@/components/admin/access";
import { HiMiniCheckCircle, HiMiniExclamationTriangle, HiMiniPlus, HiMiniXMark } from "react-icons/hi2";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, Modal, SmallButton, TabPanel, Tabs, useTabState } from "@/components/admin/ui";
import { tripVehicleOptions } from "@/components/admin/trips";
import { LegsSummary, ScheduleIssuesPanel, cycleLabel } from "@/components/admin/schedule";
import { Field, Input, Select, type SelectGroup } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi, toKobo, toNaira, useAdminData, type RouteRow, type ScheduleIssues, type Timetable, type TimetableRun, type VehicleRow } from "@/libs/admin";
import { formatDateTime, naira, todayInLagos } from "@/libs/format";
import { cn } from "@/libs/utils";
import type { ApiError } from "@/libs/api";

const TURNAROUND_MINS = 120;

export default function TimetablesPage() {
  const can = useCan();
  const list = useAdminData<Timetable[]>("/timetables");
  const issues = useAdminData<ScheduleIssues>("/schedule/issues");
  const [tab, setTab] = useTabState(["timetables", "issues"] as const);
  const [editing, setEditing] = useState<Timetable | "new" | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  // Links from the issues list open a timetable directly (?open=<id>).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");
    if (id && list.data) {
      const t = list.data.find((x) => x.id === id);
      if (t) setEditing(t);
    }
  }, [list.data]);

  const reloadAll = () => (list.reload(), issues.reload());

  function announce(r: TimetableRun, verb: string) {
    const parts = [`${verb}. ${r.created} trip${r.created === 1 ? "" : "s"} scheduled`];
    if (r.removed) parts.push(`${r.removed} unbooked trip${r.removed === 1 ? "" : "s"} from the old plan removed`);
    if (r.kept) parts.push(`${r.kept} booked trip${r.kept === 1 ? "" : "s"} kept as they are`);
    setNotice({
      tone: r.issues ? "warning" : "success",
      text: `${parts.join("; ")}.${r.issues ? ` ${r.issues} slot${r.issues === 1 ? "" : "s"} couldn't be filled; see the Issues tab.` : ""}`,
    });
    reloadAll();
  }

  async function act(fn: () => Promise<TimetableRun | { name: string; removed: number; kept: number }>, verb: string) {
    setNotice(null);
    try {
      const r = await fn();
      if ("timetable" in r) announce(r, verb);
      else {
        setNotice({ tone: "success", text: `Timetable "${r.name}" deleted. ${r.removed} unbooked future trip(s) removed${r.kept ? `; ${r.kept} booked trip(s) kept as one-off trips` : ""}.` });
        reloadAll();
      }
    } catch (e) {
      setNotice({ tone: "error", text: (e as ApiError).message });
    }
  }

  return (
    <AdminPage
      title="Timetables"
      description={`Repeating plans for each vehicle. Trips are created automatically for the next 30 days and topped up every hour. Each trip must start where the vehicle's previous trip ended.`}
      actions={can("trips.manage") ? <Button label="Add timetable" onClick={() => setEditing("new")} /> : undefined}
    >
      <Tabs
        label="Timetables"
        idBase="tt"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "timetables", label: "Timetables", count: list.data?.length ?? null },
          { id: "issues", label: "Schedule issues", count: issues.data?.total ?? null },
        ]}
      />
      {notice && (
        <Alert tone={notice.tone} className="mb-4">
          {notice.text}
        </Alert>
      )}

      {tab === "issues" ? (
        <TabPanel id="issues" idBase="tt">
          <DataState loading={issues.loading} error={issues.error} hasData={!!issues.data}>
            {issues.data && <ScheduleIssuesPanel data={issues.data} />}
          </DataState>
        </TabPanel>
      ) : (
        <TabPanel id="timetables" idBase="tt">
          <DataState loading={list.loading} error={list.error} hasData={!!list.data}>
            <DataTable
              rows={list.data ?? []}
              rowKey={(t) => t.id}
              empty="No timetables yet. Add one to keep a vehicle's trips scheduled automatically."
              columns={[
                {
                  header: "Timetable",
                  cell: (t) => (
                    <div>
                      <strong className={t.active ? "" : "text-gray-400"}>{t.name}</strong>
                      <p className="text-[12px] text-gray-500">
                        {t.vehicle ? `${t.vehicle.plateNumber} · ${t.vehicle.type}` : "No vehicle"}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Pattern",
                  cell: (t) => (
                    <div>
                      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-gray-400">
                        {cycleLabel(t.cycleDays)} from {t.startDate}
                        {t.endDate ? ` to ${t.endDate}` : ""}
                      </p>
                      <LegsSummary legs={t.legs} cycleDays={t.cycleDays} returnsEmpty={t.returnsEmpty} />
                    </div>
                  ),
                },
                {
                  header: "Upcoming",
                  cell: (t) =>
                    t.active ? (
                      <div>
                        <strong>{t.upcomingTrips}</strong> trips
                        <p className="text-[12px] text-gray-500">{t.nextDepartureAt ? `next ${formatDateTime(t.nextDepartureAt)}` : "none scheduled"}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Paused</span>
                    ),
                },
                {
                  header: "Status",
                  cell: (t) =>
                    !t.active ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">Paused</span>
                    ) : t.issues.length ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700" title={t.issues[0]!.message}>
                        <HiMiniExclamationTriangle /> {t.issues.length} gap{t.issues.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        <HiMiniCheckCircle /> Running
                      </span>
                    ),
                },
                {
                  header: "",
                  className: "text-right",
                  cell: (t) =>
                    !can("trips.manage") ? null : (
                    <div className="flex justify-end gap-1.5">
                      <SmallButton onClick={() => setEditing(t)}>Edit</SmallButton>
                      <SmallButton onClick={() => act(() => adminApi.post<TimetableRun>(`/timetables/${t.id}/active`, { active: !t.active }), t.active ? "Timetable paused" : "Timetable resumed")}>
                        {t.active ? "Pause" : "Resume"}
                      </SmallButton>
                      <SmallButton
                        tone="danger"
                        onClick={() =>
                          window.confirm(`Delete "${t.name}"? Unbooked future trips are removed; booked trips stay as one-off trips.`) &&
                          act(() => adminApi.del<{ name: string; removed: number; kept: number }>(`/timetables/${t.id}`), "Deleted")
                        }
                      >
                        Delete
                      </SmallButton>
                    </div>
                  ),
                },
              ]}
            />
          </DataState>
        </TabPanel>
      )}

      {editing && (
        <TimetableModal
          timetable={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(r, verb) => (setEditing(null), setTab("timetables"), announce(r, verb))}
        />
      )}
    </AdminPage>
  );
}

/* --------------------------------- editor --------------------------------- */

interface LegDraft {
  key: number;
  day: number;
  time: string;
  routeId: string;
  fare: string;
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const clock = (m: number) => `${String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;
let legKey = 0;

function TimetableModal({ timetable, onClose, onSaved }: { timetable: Timetable | null; onClose: () => void; onSaved: (r: TimetableRun, verb: string) => void }) {
  const routes = useAdminData<RouteRow[]>("/routes");
  const vehicles = useAdminData<VehicleRow[]>("/vehicles");
  const [form, setForm] = useState({
    name: timetable?.name ?? "",
    vehicleId: timetable?.vehicle?.id ?? "",
    cycleDays: timetable?.cycleDays ?? 1,
    startDate: timetable?.startDate ?? todayInLagos(1),
    endDate: timetable?.endDate ?? "",
    returnsEmpty: timetable?.returnsEmpty ?? false,
  });
  const [legs, setLegs] = useState<LegDraft[]>(
    timetable?.legs.map((l) => ({ key: legKey++, day: l.day, time: l.time, routeId: l.routeId, fare: toNaira(l.priceKobo) })) ?? [{ key: legKey++, day: 0, time: "07:00", routeId: "", fare: "" }],
  );
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const active = (routes.data ?? []).filter((r) => r.active);
  const byId = useMemo(() => new Map((routes.data ?? []).map((r) => [r._id, r])), [routes.data]);
  const sorted = [...legs].sort((a, b) => a.day * 1440 + minutes(a.time) - (b.day * 1440 + minutes(b.time)));

  /** The same checks the server makes, so problems show while editing. */
  const checks = useMemo(() => {
    const out: { key: number; ok: boolean; text: string }[] = [];
    const ready = sorted.filter((l) => byId.get(l.routeId));
    if (ready.length !== sorted.length || !ready.length) return out;
    ready.forEach((l, i) => {
      const r = byId.get(l.routeId)!;
      const last = i === ready.length - 1;
      if (last && form.returnsEmpty) {
        out.push({ key: l.key, ok: true, text: `Ends in ${r.destination.city}, then returns empty to ${byId.get(ready[0]!.routeId)!.origin.city}.` });
        return;
      }
      const next = ready[(i + 1) % ready.length]!;
      const nr = byId.get(next.routeId)!;
      const arrives = l.day * 1440 + minutes(l.time) + r.durationMinutes;
      const nextStart = next.day * 1440 + minutes(next.time) + (last ? form.cycleDays * 1440 : 0);
      const placeOk = r.destination.city === nr.origin.city;
      const timeOk = nextStart >= arrives + TURNAROUND_MINS;
      const nextLabel = last ? "the next cycle" : "the next trip";
      out.push({
        key: l.key,
        ok: placeOk && timeOk,
        text: !placeOk
          ? `Ends in ${r.destination.city}, but ${nextLabel} starts in ${nr.origin.city}.${last ? ' Add a trip back, or tick "returns empty".' : ""}`
          : !timeOk
            ? `Arrives about ${clock(arrives)}; ${nextLabel} can't leave before ${clock(arrives + TURNAROUND_MINS)}.`
            : `Arrives about ${clock(arrives)} in ${r.destination.city}; ${nextLabel} leaves from there.`,
      });
    });
    return out;
  }, [sorted, byId, form.returnsEmpty, form.cycleDays]);

  /** Routes grouped by where they start; routes continuing from the previous leg first. */
  function routeOptions(after: LegDraft | undefined): SelectGroup[] {
    const from = after ? byId.get(after.routeId)?.destination.city : undefined;
    const groups = new Map<string, SelectGroup>();
    for (const r of [...active].sort((a, b) => a.origin.city.localeCompare(b.origin.city) || a.destination.city.localeCompare(b.destination.city))) {
      const label = r.origin.city === from ? `From ${r.origin.city} (where the vehicle will be)` : `From ${r.origin.city}`;
      const g = groups.get(label) ?? { label, options: [] };
      g.options.push({ value: r._id, label: `${r.origin.city} → ${r.destination.city} · ${Math.floor(r.durationMinutes / 60)}h${r.durationMinutes % 60 ? ` ${r.durationMinutes % 60}m` : ""}`, selectedLabel: `${r.origin.city} → ${r.destination.city}` });
      groups.set(label, g);
    }
    return [...groups.values()].sort((a, b) => Number(b.label.includes("where the vehicle")) - Number(a.label.includes("where the vehicle")));
  }

  function addLeg() {
    const last = sorted[sorted.length - 1];
    const r = last ? byId.get(last.routeId) : undefined;
    let start = last ? last.day * 1440 + minutes(last.time) + (r?.durationMinutes ?? 0) + TURNAROUND_MINS : 7 * 60;
    start = Math.ceil(start / 30) * 30;
    const day = Math.min(Math.floor(start / 1440), form.cycleDays - 1);
    // Prefer the trip back to where the cycle starts (closes the loop), else any route from here.
    const home = sorted[0] ? byId.get(sorted[0].routeId)?.origin.city : undefined;
    const fromHere = active.filter((x) => r && x.origin.city === r.destination.city);
    const next = fromHere.find((x) => x.destination.city === home) ?? fromHere[0];
    setLegs([...legs, { key: legKey++, day, time: clock(start), routeId: next?._id ?? "", fare: "" }]);
  }

  const patch = (key: number, p: Partial<LegDraft>) => setLegs(legs.map((l) => (l.key === key ? { ...l, ...p } : l)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    const body = {
      name: form.name.trim(),
      vehicleId: form.vehicleId,
      cycleDays: form.cycleDays,
      startDate: form.startDate,
      endDate: form.endDate || null,
      returnsEmpty: form.returnsEmpty,
      legs: legs.map((l) => ({ day: Math.min(l.day, form.cycleDays - 1), time: l.time, routeId: l.routeId, priceKobo: l.fare ? toKobo(l.fare) : null })),
    };
    try {
      const r = timetable ? await adminApi.patch<TimetableRun>(`/timetables/${timetable.id}`, body) : await adminApi.post<TimetableRun>("/timetables", body);
      onSaved(r, timetable ? "Timetable updated" : "Timetable created");
    } catch (err) {
      const e2 = err as ApiError;
      const problems = (e2.details as { problems?: string[] })?.problems;
      const fields = Object.entries(e2.fieldErrors).map(([k, m]) => `${k}: ${m}`);
      setErrors(problems?.length ? problems : fields.length ? fields : [e2.message]);
    } finally {
      setBusy(false);
    }
  }

  const allReady = legs.every((l) => l.routeId) && checks.length > 0;
  const allOk = allReady && checks.every((c) => c.ok);

  return (
    <Modal open title={timetable ? `Edit ${timetable.name}` : "Add timetable"} onClose={onClose} size="xl">
      <form onSubmit={save} className="space-y-5">
        {errors.length > 0 && (
          <Alert tone="error" title="This plan can't run">
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" htmlFor="tt-name" className="lg:col-span-2">
            <Input id="tt-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lagos ⇄ Owerri · Economy" required />
          </Field>
          <Field label="Vehicle" htmlFor="tt-vehicle" className="lg:col-span-2" hint="One active timetable per vehicle.">
            <Select
              id="tt-vehicle"
              value={form.vehicleId}
              onValueChange={(vehicleId) => setForm({ ...form, vehicleId })}
              placeholder={vehicles.loading ? "Loading vehicles…" : "Choose a vehicle"}
              options={tripVehicleOptions(vehicles.data ?? [], timetable?.vehicle?.id)}
              required
            />
          </Field>
          <Field label="Repeats" htmlFor="tt-cycle" hint={form.cycleDays > 1 ? "e.g. day 1 out, day 2 back" : undefined}>
            <Select
              id="tt-cycle"
              value={form.cycleDays}
              onValueChange={(v) => setForm({ ...form, cycleDays: Number(v) })}
              options={[1, 2, 3, 4, 5, 6, 7, 14].map((n) => ({ value: String(n), label: cycleLabel(n) }))}
            />
          </Field>
          <Field label="Starts" htmlFor="tt-start" hint={form.cycleDays > 1 ? "This date is day 1." : undefined}>
            <Input id="tt-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </Field>
          <Field label="Ends (optional)" htmlFor="tt-end">
            <Input id="tt-end" type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 text-[13px] font-semibold">
            <input type="checkbox" checked={form.returnsEmpty} onChange={(e) => setForm({ ...form, returnsEmpty: e.target.checked })} />
            Returns empty after the last trip
          </label>
        </div>

        <div>
          <p className="mb-2 font-display text-[15px] font-extrabold text-ink">Trips in each cycle</p>
          <div className="overflow-x-auto rounded-[14px] border border-border-stroke">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="bg-canvas text-[10.5px] uppercase tracking-[0.08em] text-gray-500">
                <tr>
                  {form.cycleDays > 1 && <th className="px-3 py-2.5 font-extrabold">Day</th>}
                  <th className="px-3 py-2.5 font-extrabold">Departs (WAT)</th>
                  <th className="px-3 py-2.5 font-extrabold">Route</th>
                  <th className="px-3 py-2.5 font-extrabold">Fare (₦, optional)</th>
                  <th className="px-3 py-2.5 font-extrabold">Check</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((l, i) => {
                  const check = checks.find((c) => c.key === l.key);
                  const r = byId.get(l.routeId);
                  return (
                    <tr key={l.key} className="border-t border-border-stroke align-top">
                      {form.cycleDays > 1 && (
                        <td className="w-[110px] px-3 py-2">
                          <Select
                            aria-label="Day"
                            value={Math.min(l.day, form.cycleDays - 1)}
                            onValueChange={(v) => patch(l.key, { day: Number(v) })}
                            options={Array.from({ length: form.cycleDays }, (_, d) => ({ value: String(d), label: `Day ${d + 1}` }))}
                            className="h-10"
                          />
                        </td>
                      )}
                      <td className="w-[130px] px-3 py-2">
                        <Input aria-label="Departure time" type="time" value={l.time} onChange={(e) => patch(l.key, { time: e.target.value })} className="h-10" required />
                      </td>
                      <td className="min-w-[230px] px-3 py-2">
                        <Select
                          aria-label="Route"
                          value={l.routeId}
                          onValueChange={(routeId) => patch(l.key, { routeId })}
                          placeholder="Choose a route"
                          options={routeOptions(sorted[i - 1])}
                          className="h-10"
                        />
                      </td>
                      <td className="w-[150px] px-3 py-2">
                        <Input
                          aria-label="Fare in naira"
                          type="number"
                          min={1}
                          value={l.fare}
                          onChange={(e) => patch(l.key, { fare: e.target.value })}
                          placeholder={r?.defaultFareKobo ? naira(r.defaultFareKobo).replace("₦", "") : "Required"}
                          className="h-10"
                        />
                      </td>
                      <td className="min-w-[220px] px-3 py-2.5 text-[12px]">
                        {check ? (
                          <span className={cn("flex items-start gap-1.5", check.ok ? "text-emerald-700" : "font-semibold text-orange-700")}>
                            {check.ok ? <HiMiniCheckCircle className="mt-0.5 shrink-0" /> : <HiMiniExclamationTriangle className="mt-0.5 shrink-0" />}
                            {check.text}
                          </span>
                        ) : (
                          <span className="text-gray-400">Choose a route</span>
                        )}
                      </td>
                      <td className="w-[44px] px-2 py-2">
                        {legs.length > 1 && (
                          <button type="button" aria-label="Remove this trip" onClick={() => setLegs(legs.filter((x) => x.key !== l.key))} className="rounded-[8px] p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                            <HiMiniXMark size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <SmallButton onClick={addLeg}>
              <span className="flex items-center gap-1">
                <HiMiniPlus /> Add trip
              </span>
            </SmallButton>
            {allReady && (
              <p className={cn("text-[13px] font-bold", allOk ? "text-emerald-700" : "text-orange-700")}>
                {allOk ? "The vehicle can run this every cycle." : "Fix the highlighted trips before saving."}
              </p>
            )}
          </div>
        </div>

        {timetable && (
          <Alert tone="info">
            Saving replaces this timetable&apos;s unbooked future trips with the new plan. Trips that already have bookings stay as they are; reschedule or cancel them from the Trips page if needed.
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" label="Cancel" onClick={onClose} />
          <Button type="submit" label={timetable ? "Save timetable" : "Create timetable"} loading={busy} disabled={!form.vehicleId || !allReady || !allOk} />
        </div>
      </form>
    </Modal>
  );
}
