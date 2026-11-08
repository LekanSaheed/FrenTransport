"use client";
import React, { useState } from "react";
import { useCan } from "@/components/admin/access";
import ImageField from "@/components/media/ImageField";
import Link from "next/link";
import MediaThumb from "@/components/media/MediaThumb";
import { VehicleWhere } from "@/components/admin/schedule";
import SeatGrid from "@/components/seatmap/SeatGrid";
import SeatLayoutBuilder, { defaultDraft, draftProblems, draftToLayout, layoutToDraft, type LayoutDraft } from "@/components/admin/SeatLayoutBuilder";
import Button from "@/components/Button";
import { AdminPage, DataState, DataTable, FilterBar, Modal, Panel, SmallButton, TabPanel, Tabs, useTabState } from "@/components/admin/ui";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi, toKobo, toNaira, useAdminData, type CategoryRow, type VehicleRow, type TerminalRow } from "@/libs/admin";
import { formatDateTime, naira } from "@/libs/format";
import type { ApiError } from "@/libs/api";

const STATUS_STYLE = { active: "bg-emerald-50 text-emerald-700", maintenance: "bg-orange-50 text-orange-700", retired: "bg-gray-100 text-gray-500" };

function useForm<T>() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<T>) => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const err = e as ApiError;
      const fields = Object.values(err.fieldErrors);
      setError(fields.length ? `${err.message}: ${fields.join("; ")}` : err.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export default function VehiclesPage() {
  const [tab, setTab] = useTabState(["vehicles", "types"] as const);
  return (
    <AdminPage title="Vehicles" description="Your fleet and vehicle types. A vehicle on upcoming trips can't be taken out of service until those trips use another vehicle.">
      <Tabs
        label="Fleet"
        idBase="fleet"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "vehicles", label: "Vehicles" },
          { id: "types", label: "Vehicle types" },
        ]}
      />
      <TabPanel id={tab} idBase="fleet">
        {tab === "vehicles" ? <VehiclesTab /> : <TypesTab />}
      </TabPanel>
    </AdminPage>
  );
}

/* ------------------------------ vehicles ------------------------------ */

function VehiclesTab() {
  const can = useCan();
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<VehicleRow | "new" | null>(null);
  const categories = useAdminData<CategoryRow[]>("/vehicle-categories");
  const vehicles = useAdminData<VehicleRow[]>("/vehicles", { status: status || undefined, categoryId: categoryId || undefined, q: q || undefined });

  return (
    <>
      <FilterBar>
        <Input aria-label="Search registration" placeholder="Registration number" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Type" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All types</option>
          {(categories.data ?? []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </Select>
        {can("fleet.manage") && <Button label="Add vehicle" onClick={() => setEditing("new")} />}
      </FilterBar>
      <DataState loading={vehicles.loading} error={vehicles.error} hasData={!!vehicles.data}>
        <DataTable
          rows={vehicles.data ?? []}
          rowKey={(v) => v.id}
          empty="No vehicles"
          columns={[
            { header: "Image", cell: (v) => <MediaThumb src={v.category.imageUrl} alt={v.category.name} />, className: "w-[88px]" },
            { header: "Registration", cell: (v) => <strong>{v.plateNumber}</strong> },
            { header: "Type", cell: (v) => `${v.category.name} · ${v.category.capacity} seats` },
            { header: "Status", cell: (v) => <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLE[v.status]}`}>{v.status}</span> },
            { header: "Where now", cell: (v) => <VehicleWhere v={v} /> },
            {
              header: "Next trip",
              cell: (v) =>
                v.nextTrip ? (
                  <Link href={`/admin/trips/${v.nextTrip.id}`} className="block leading-tight hover:underline">
                    <span className="font-semibold">
                      {v.nextTrip.from?.city} → {v.nextTrip.to?.city}
                    </span>
                    <span className="block text-[11.5px] text-gray-500">
                      {formatDateTime(v.nextTrip.departureAt)} · {v.upcomingTrips} upcoming
                    </span>
                  </Link>
                ) : (
                  <span className="text-gray-400">None</span>
                ),
            },
            { header: "Home", cell: (v) => (v.home ? v.home.city : <span className="text-gray-400">Not set</span>) },
            { header: "Notes", cell: (v) => <span className="text-gray-500">{v.description || "—"}</span> },
            { header: "", cell: (v) => (can("fleet.manage") ? <SmallButton onClick={() => setEditing(v)}>Edit</SmallButton> : null), className: "text-right" },
          ]}
        />
      </DataState>
      {editing && <VehicleModal vehicle={editing === "new" ? null : editing} categories={categories.data ?? []} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), vehicles.reload())} />}
    </>
  );
}

function VehicleModal({ vehicle, categories, onClose, onSaved }: { vehicle: VehicleRow | null; categories: CategoryRow[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    plateNumber: vehicle?.plateNumber ?? "",
    categoryId: vehicle?.category.id ?? "",
    status: vehicle?.status ?? "active",
    description: vehicle?.description ?? "",
    homeLocationId: vehicle?.home?.id ?? "",
  });
  const terminals = useAdminData<TerminalRow[]>("/locations");
  const { busy, error, run } = useForm<unknown>();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      if (vehicle) {
        const patch = Object.fromEntries(
          Object.entries(form)
            .filter(([k, v]) => v !== ({ plateNumber: vehicle.plateNumber, categoryId: vehicle.category.id, status: vehicle.status, description: vehicle.description, homeLocationId: vehicle.home?.id ?? "" } as Record<string, string>)[k])
            .map(([k, v]) => [k, k === "homeLocationId" && !v ? null : v]),
        );
        if (Object.keys(patch).length) await adminApi.patch(`/vehicles/${vehicle.id}`, patch);
      } else {
        await adminApi.post("/vehicles", {
          plateNumber: form.plateNumber,
          categoryId: form.categoryId,
          ...(form.description && { description: form.description }),
          ...(form.homeLocationId && { homeLocationId: form.homeLocationId }),
        });
      }
      onSaved();
    });
  }

  return (
    <Modal open title={vehicle ? `Edit ${vehicle.plateNumber}` : "Add vehicle"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Registration number" htmlFor="plate">
          <Input id="plate" value={form.plateNumber} onChange={set("plateNumber")} required minLength={4} />
        </Field>
        <Field label="Vehicle type" htmlFor="cat" hint={vehicle?.upcomingTrips ? "Can't change while it has upcoming trips." : undefined}>
          <Select id="cat" value={form.categoryId} onChange={set("categoryId")} required>
            <option value="">Choose a type</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.capacity} seats)
              </option>
            ))}
          </Select>
        </Field>
        {vehicle && (
          <Field label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </Select>
          </Field>
        )}
        <Field label="Home terminal" htmlFor="home" hint="Where it's based. Its first scheduled trip must start in this city.">
          <Select
            id="home"
            value={form.homeLocationId}
            onValueChange={(homeLocationId) => setForm({ ...form, homeLocationId })}
            placeholder={terminals.loading ? "Loading terminals…" : "Not set"}
            options={[
              { value: "", label: "Not set" },
              ...[...new Set((terminals.data ?? []).filter((t) => t.active).map((t) => t.state))].sort().map((state) => ({
                label: state,
                options: (terminals.data ?? [])
                  .filter((t) => t.active && t.state === state)
                  .map((t) => ({ value: t.id, label: `${t.city} — ${t.name}`, selectedLabel: `${t.city} — ${t.name}` })),
              })),
            ]}
          />
        </Field>
        <Field label="Notes" htmlFor="desc">
          <Textarea id="desc" value={form.description} onChange={set("description")} placeholder="Colour, features, service notes…" />
        </Field>
        <Button type="submit" fullWidth label={vehicle ? "Save" : "Add vehicle"} loading={busy} />
      </form>
    </Modal>
  );
}

/* ---------------------------- vehicle types --------------------------- */

function TypesTab() {
  const can = useCan();
  const categories = useAdminData<CategoryRow[]>("/vehicle-categories");
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [copying, setCopying] = useState<CategoryRow | null>(null);
  return (
    <DataState loading={categories.loading} error={categories.error} hasData={!!categories.data}>
      <div className="mb-3 flex justify-end">
        {can("fleet.manage") && <Button label="Add vehicle type" onClick={() => setEditing("new")} />}
      </div>
      <DataTable
        rows={categories.data ?? []}
        rowKey={(c) => c._id}
        empty="No vehicle types"
        columns={[
          { header: "Image", cell: (c) => <MediaThumb src={c.imageUrl} alt={c.name} />, className: "w-[88px]" },
          { header: "Name", cell: (c) => <div><strong>{c.name}</strong><p className="text-[12px] text-gray-500">{c.code}</p></div> },
          { header: "Kind", cell: (c) => <span className="capitalize">{c.kind}</span> },
          { header: "Seats", cell: (c) => `${c.capacity}${c.layout?.seats?.length ? " · seat map" : " · no seat map"}` },
          {
            header: "Hire",
            cell: (c) =>
              c.hire?.enabled ? (c.hire.pricingMode === "instant" ? `Instant · ${naira(c.hire.dailyRateKobo ?? 0)}/day` : "By quotation") : <span className="text-gray-400">Not for hire</span>,
          },
          { header: "Active", cell: (c) => (c.active ? "Yes" : "No") },
          {
            header: "",
            cell: (c) => (
              <div className="flex justify-end gap-2">
                {can("fleet.manage") && (
                  <>
                    <SmallButton onClick={() => setCopying(c)}>Duplicate</SmallButton>
                    <SmallButton onClick={() => setEditing(c)}>Edit</SmallButton>
                  </>
                )}
              </div>
            ),
            className: "text-right",
          },
        ]}
      />
      <Panel className="mt-4" title="About seat layouts">
        <p className="text-[13px] text-gray-600">
          Trips copy their vehicle type&apos;s seat map, so a type&apos;s layout and capacity can&apos;t be changed after creation. To change them, use{" "}
          <strong>Duplicate</strong>, adjust the copy&apos;s layout, then move vehicles to the new type.
        </p>
      </Panel>
      {editing && <TypeModal category={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), categories.reload())} />}
      {copying && <TypeModal category={null} copyFrom={copying} onClose={() => setCopying(null)} onSaved={() => (setCopying(null), categories.reload())} />}
    </DataState>
  );
}

function TypeModal({
  category,
  copyFrom,
  onClose,
  onSaved,
}: {
  category: CategoryRow | null;
  /** Prefills a new type from an existing one ("Duplicate"). */
  copyFrom?: CategoryRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const src = category ?? copyFrom;
  const [form, setForm] = useState({
    name: copyFrom ? `${copyFrom.name} (copy)` : (category?.name ?? ""),
    code: copyFrom ? `${copyFrom.code}_2` : (category?.code ?? ""),
    kind: src?.kind ?? "bus",
    capacity: String(src?.capacity ?? 14),
    seatMap: copyFrom ? !!copyFrom.layout?.seats?.length : true,
    description: src?.description ?? "",
    amenities: (src?.amenities ?? []).join(", "),
    imageUrl: src?.imageUrl ?? "",
    active: category?.active ?? true,
    hireEnabled: src?.hire?.enabled ?? false,
    pricingMode: src?.hire?.pricingMode ?? "quote",
    dailyRate: toNaira(src?.hire?.dailyRateKobo ?? null),
  });
  const [draft, setDraft] = useState<LayoutDraft>(() => (copyFrom?.layout?.seats?.length ? layoutToDraft(copyFrom.layout) : defaultDraft()));
  const layoutProblems = form.seatMap ? draftProblems(draft) : [];
  const { busy, error, run } = useForm<unknown>();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amenities = form.amenities.split(",").map((a) => a.trim()).filter(Boolean);
    const hire = { enabled: form.hireEnabled, pricingMode: form.pricingMode, ...(form.pricingMode === "instant" && form.dailyRate && { dailyRateKobo: toKobo(form.dailyRate) }) };
    run(async () => {
      if (category) {
        await adminApi.patch(`/vehicle-categories/${category._id}`, { name: form.name, description: form.description, amenities, imageUrl: form.imageUrl, active: form.active, hire });
      } else {
        const layout = form.seatMap ? draftToLayout(draft) : undefined;
        const capacity = layout ? layout.seats.length : Number(form.capacity);
        await adminApi.post("/vehicle-categories", {
          code: form.code,
          name: form.name,
          kind: form.kind,
          capacity,
          description: form.description,
          amenities,
          ...(form.imageUrl && { imageUrl: form.imageUrl }),
          ...(layout && { layout }),
          hire,
        });
      }
      onSaved();
    });
  }

  return (
    <Modal open title={category ? `Edit ${category.name}` : "Add vehicle type"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" value={form.name} onChange={set("name")} required />
          </Field>
          {!category && (
            <Field label="Code" htmlFor="code" hint="Short unique id, e.g. HIACE_ECONOMY">
              <Input id="code" value={form.code} onChange={set("code")} required />
            </Field>
          )}
          {!category && (
            <>
              <Field label="Kind" htmlFor="kind">
                <Select id="kind" value={form.kind} onChange={set("kind")}>
                  <option value="bus">Bus</option>
                  <option value="car">Car</option>
                </Select>
              </Field>
              {form.seatMap ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12.5px] font-bold text-gray-700">Passenger seats</span>
                  <p className="flex h-12 items-center rounded-[12px] bg-canvas px-3.5 text-[14.5px] font-bold text-ink">
                    {draftToLayout(draft).seats.length} <span className="ml-1.5 font-medium text-gray-500">from the seat layout</span>
                  </p>
                </div>
              ) : (
                <Field label="Passenger seats" htmlFor="cap">
                  <Input id="cap" type="number" min={1} max={100} value={form.capacity} onChange={set("capacity")} required />
                </Field>
              )}
            </>
          )}
        </div>
        {category?.layout?.seats?.length ? (
          <div className="rounded-[14px] border border-border-stroke bg-canvas/50 p-4">
            <p className="mb-3 text-[12.5px] font-bold text-gray-700">Seat layout (locked: trips use it). Use Duplicate to make a changed copy.</p>
            <SeatGrid
              size="sm"
              geometry={{ rows: category.layout.rows, columns: category.layout.columns, driver: category.layout.driver ?? { row: 0, column: 0 } }}
              seats={category.layout.seats.map((st) => ({ key: st.label, label: st.label, row: st.row, column: st.column, tone: "available" }))}
            />
          </div>
        ) : null}
        {!category && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              <input type="checkbox" checked={form.seatMap} onChange={set("seatMap")} /> Seat layout (needed for scheduled trips)
            </label>
            {form.seatMap && <SeatLayoutBuilder value={draft} onChange={setDraft} />}
          </div>
        )}
        <Field label="Description" htmlFor="desc">
          <Textarea id="desc" value={form.description} onChange={set("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amenities (comma-separated)" htmlFor="am">
            <Input id="am" value={form.amenities} onChange={set("amenities")} placeholder="Air conditioning, Wi-Fi" />
          </Field>
          <Field label="Image" htmlFor="img" hint="Shown on trip results and the hire pages.">
            <ImageField id="img" value={form.imageUrl} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} pickerTitle="Choose a vehicle image" />
          </Field>
        </div>
        <div className="rounded-[8px] border border-border-stroke p-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={form.hireEnabled} onChange={set("hireEnabled")} /> Available for private hire
          </label>
          {form.hireEnabled && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Pricing" htmlFor="pm">
                <Select id="pm" value={form.pricingMode} onChange={set("pricingMode")}>
                  <option value="quote">By quotation</option>
                  <option value="instant">Instant (daily rate)</option>
                </Select>
              </Field>
              {form.pricingMode === "instant" && (
                <Field label="Daily rate (₦)" htmlFor="rate">
                  <Input id="rate" type="number" min={1} value={form.dailyRate} onChange={set("dailyRate")} required />
                </Field>
              )}
            </div>
          )}
        </div>
        {category && (
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.active} onChange={set("active")} /> Active
          </label>
        )}
        <Button type="submit" fullWidth label={category ? "Save" : "Add type"} loading={busy} disabled={layoutProblems.length > 0} />
      </form>
    </Modal>
  );
}
