"use client";
import React, { useState } from "react";
import { useCan } from "@/components/admin/access";
import Link from "next/link";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, Modal, SmallButton, TabPanel, Tabs, useTabState } from "@/components/admin/ui";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi, toKobo, toNaira, useAdminData, type RouteRow, type StateCities, type TerminalRow } from "@/libs/admin";
import { naira } from "@/libs/format";
import type { ApiError } from "@/libs/api";

const hm = (mins: number) => `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}`;

export default function RoutesPage() {
  const can = useCan();
  const routes = useAdminData<RouteRow[]>("/routes");
  const terminals = useAdminData<TerminalRow[]>("/locations");
  const [showInactive, setShowInactive] = useState(false);
  const [editRoute, setEditRoute] = useState<RouteRow | "new" | null>(null);
  const [editTerminal, setEditTerminal] = useState<TerminalRow | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useTabState(["routes", "terminals"] as const);

  const rows = (routes.data ?? [])
    .filter((r) => showInactive || r.active)
    .sort((a, b) => Number(b.active) - Number(a.active) || a.origin.city.localeCompare(b.origin.city) || a.destination.city.localeCompare(b.destination.city));
  const activeCount = (routes.data ?? []).filter((r) => r.active).length;

  return (
    <AdminPage title="Routes & terminals" description="Each route is one direction. Customers can only search and book active routes; deactivating a route keeps its existing bookings.">
      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}
      <Tabs
        label="Routes and terminals"
        idBase="network"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "routes", label: "Routes", count: routes.data ? activeCount : null },
          { id: "terminals", label: "Terminals", count: terminals.data?.length ?? null },
        ]}
        actions={
          tab === "routes" ? (
            <>
              <label className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
              </label>
              {can("network.manage") && (
                <SmallButton tone="primary" onClick={() => setEditRoute("new")}>
                  Add route
                </SmallButton>
              )}
            </>
          ) : (
            can("network.manage") && (
              <SmallButton tone="primary" onClick={() => setEditTerminal("new")}>
                Add terminal
              </SmallButton>
            )
          )
        }
      />

      {tab === "routes" ? (
        <TabPanel id="routes" idBase="network">
          <DataState loading={routes.loading} error={routes.error} hasData={!!routes.data}>
            <DataTable
              rows={rows}
              rowKey={(r) => r._id}
              empty="No routes"
              columns={[
                { header: "Route", cell: (r) => <strong className={r.active ? "" : "text-gray-400"}>{r.origin.city} → {r.destination.city}</strong> },
                { header: "Terminals", cell: (r) => <span className="text-gray-500">{r.origin.name} → {r.destination.name}</span> },
                { header: "Typical duration", cell: (r) => hm(r.durationMinutes) },
                { header: "Default fare", cell: (r) => (r.defaultFareKobo ? naira(r.defaultFareKobo) : <span className="text-gray-400">Not set</span>) },
                { header: "Status", cell: (r) => (r.active ? <span className="font-semibold text-emerald-700">Active</span> : <span className="text-gray-400">Inactive</span>) },
                { header: "", cell: (r) => (can("network.manage") ? <SmallButton onClick={() => setEditRoute(r)}>Edit</SmallButton> : null), className: "text-right" },
              ]}
            />
          </DataState>
        </TabPanel>
      ) : (
        <TabPanel id="terminals" idBase="network">
          <DataState loading={terminals.loading} error={terminals.error} hasData={!!terminals.data}>
            <DataTable
              rows={terminals.data ?? []}
              rowKey={(t) => t.id}
              empty="No terminals"
              columns={[
                { header: "City", cell: (t) => <strong className={t.active ? "" : "text-gray-400"}>{t.city}</strong> },
                { header: "Terminal", cell: (t) => t.name },
                { header: "Address", cell: (t) => t.address || <span className="text-orange-600">Add address</span> },
                { header: "State", cell: (t) => t.state },
                { header: "Active routes", cell: (t) => t.activeRoutes },
                { header: "", cell: (t) => (can("network.manage") ? <SmallButton onClick={() => setEditTerminal(t)}>Edit</SmallButton> : null), className: "text-right" },
              ]}
            />
          </DataState>
        </TabPanel>
      )}

      {editRoute && (
        <RouteModal
          route={editRoute === "new" ? null : editRoute}
          terminals={(terminals.data ?? []).filter((t) => t.active)}
          onClose={() => setEditRoute(null)}
          onSaved={(m) => (setEditRoute(null), setNotice(m), routes.reload(), terminals.reload())}
        />
      )}
      {editTerminal && <TerminalModal terminal={editTerminal === "new" ? null : editTerminal} onClose={() => setEditTerminal(null)} onSaved={(m) => (setEditTerminal(null), setNotice(m), terminals.reload(), routes.reload())} />}
    </AdminPage>
  );
}

function RouteModal({ route, terminals, onClose, onSaved }: { route: RouteRow | null; terminals: TerminalRow[]; onClose: () => void; onSaved: (m: string) => void }) {
  const [form, setForm] = useState({
    originId: route?.origin._id ?? "",
    destinationId: route?.destination._id ?? "",
    hours: String(Math.floor((route?.durationMinutes ?? 60) / 60)),
    minutes: String((route?.durationMinutes ?? 60) % 60),
    fare: toNaira(route?.defaultFareKobo ?? null),
    active: route?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const durationMinutes = Number(form.hours) * 60 + Number(form.minutes);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (route) {
        await adminApi.patch(`/routes/${route._id}`, { active: form.active, durationMinutes, defaultFareKobo: form.fare ? toKobo(form.fare) : null });
        onSaved(`${route.origin.city} → ${route.destination.city} updated.`);
      } else {
        await adminApi.post("/routes", { originId: form.originId, destinationId: form.destinationId, durationMinutes, ...(form.fare && { defaultFareKobo: toKobo(form.fare) }) });
        onSaved("Route added. Schedule trips on it from the Trips page.");
      }
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.code === "DUPLICATE" ? "That route already exists (it may be inactive — show inactive routes to find it)." : e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title={route ? `${route.origin.city} → ${route.destination.city}` : "Add route"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {!route && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="o">
              <Select id="o" value={form.originId} onChange={set("originId")} required>
                <option value="">Choose</option>
                {terminals.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} — {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="To" htmlFor="d">
              <Select id="d" value={form.destinationId} onChange={set("destinationId")} required>
                <option value="">Choose</option>
                {terminals.filter((t) => t.id !== form.originId).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} — {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        {!route && <p className="text-[12px] text-gray-500">This adds one direction only. Add the return route separately if you run it.</p>}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Hours" htmlFor="h">
            <Input id="h" type="number" min={0} max={48} value={form.hours} onChange={set("hours")} />
          </Field>
          <Field label="Minutes" htmlFor="m">
            <Input id="m" type="number" min={0} max={59} value={form.minutes} onChange={set("minutes")} />
          </Field>
          <Field label="Default fare (₦)" htmlFor="f">
            <Input id="f" type="number" min={1} value={form.fare} onChange={set("fare")} />
          </Field>
        </div>
        {route && (
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.active} onChange={set("active")} /> Active — customers can search and book this route
          </label>
        )}
        {route && route.active && !form.active && <Alert tone="warning">Deactivating hides this route from search. Existing trips and bookings are kept.</Alert>}
        <Button type="submit" fullWidth label={route ? "Save" : "Add route"} loading={busy} disabled={durationMinutes < 10} />
      </form>
    </Modal>
  );
}

function TerminalModal({ terminal, onClose, onSaved }: { terminal: TerminalRow | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [form, setForm] = useState({
    name: terminal?.name ?? "",
    city: terminal?.city ?? "",
    state: terminal?.state ?? "",
    address: terminal?.address ?? "",
    code: terminal?.code ?? "",
    active: terminal?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const places = useAdminData<StateCities[]>("/cities");
  const citiesInState = places.data?.find((p) => p.state === form.state)?.cities ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (terminal) {
        const moved = form.state !== terminal.state || form.city !== terminal.city;
        await adminApi.patch(`/locations/${terminal.id}`, { name: form.name, address: form.address, active: form.active, ...(moved && { state: form.state, city: form.city }) });
        onSaved(`${terminal.city} terminal updated.`);
      } else {
        await adminApi.post("/locations", { code: form.code, name: form.name, city: form.city, state: form.state, address: form.address });
        onSaved("Terminal added.");
      }
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title={terminal ? `${terminal.city} terminal` : "Add terminal"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Terminal name" htmlFor="n">
          <Input id="n" value={form.name} onChange={set("name")} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="State" htmlFor="s">
            <Select
              id="s"
              value={form.state}
              placeholder={places.loading ? "Loading states…" : "Choose a state"}
              options={(places.data ?? []).map((p) => ({ value: p.state, label: `${p.state === "FCT" ? "FCT (Abuja)" : p.state}${p.cities.length ? "" : " · no cities yet"}` }))}
              onValueChange={(state) => setForm((f) => ({ ...f, state, city: "" }))}
              required
            />
          </Field>
          <Field
            label="City"
            htmlFor="c"
            hint={
              form.state && !citiesInState.length ? (
                <>
                  No cities listed for {form.state}.{" "}
                  <Link href="/admin/settings?tab=places" className="font-bold text-primary">
                    Add one in Settings
                  </Link>
                </>
              ) : undefined
            }
          >
            <Select
              id="c"
              value={form.city}
              placeholder={form.state ? (citiesInState.length ? "Choose a city" : "No cities listed") : "Choose a state first"}
              options={citiesInState.map((c) => ({ value: c.name, label: c.name }))}
              onValueChange={(city) => setForm((f) => ({ ...f, city }))}
              disabled={!form.state || !citiesInState.length}
              required
            />
          </Field>
        </div>
        {!terminal && (
          <Field label="Code" htmlFor="code" hint="Short unique id, e.g. OWR-MAIN">
            <Input id="code" value={form.code} onChange={set("code")} required />
          </Field>
        )}
        {terminal && (form.state !== terminal.state || form.city !== terminal.city) && terminal.activeRoutes > 0 && (
          <Alert tone="warning">This terminal is on {terminal.activeRoutes} active route(s). Moving it changes where customers see those routes.</Alert>
        )}
        <Field label="Address" htmlFor="a" hint="Shown to customers.">
          <Input id="a" value={form.address} onChange={set("address")} />
        </Field>
        {terminal && (
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.active} onChange={set("active")} /> Active
          </label>
        )}
        <Button type="submit" fullWidth label={terminal ? "Save" : "Add terminal"} loading={busy} />
      </form>
    </Modal>
  );
}
