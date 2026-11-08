"use client";
import React, { useMemo, useState } from "react";
import { HiMiniMagnifyingGlass, HiMiniXMark } from "react-icons/hi2";
import { DataState, Panel, SmallButton } from "@/components/admin/ui";
import { Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { adminApi, useAdminData, type StateCities } from "@/libs/admin";
import { cn } from "@/libs/utils";
import type { ApiError } from "@/libs/api";

const stateLabel = (s: string) => (s === "FCT" ? "FCT (Abuja)" : s);

/**
 * Settings → States & cities. Admins list the cities in each state; terminals
 * can then only be placed in a listed (state, city). A city with terminals
 * can't be removed.
 */
export default function CitiesManager() {
  const { data, error, loading, reload } = useAdminData<StateCities[]>("/cities");
  const [state, setState] = useState("Lagos");
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const states = useMemo(() => (data ?? []).filter((s) => stateLabel(s.state).toLowerCase().includes(filter.trim().toLowerCase())), [data, filter]);
  const current = data?.find((s) => s.state === state);
  const totalCities = (data ?? []).reduce((n, s) => n + s.cities.length, 0);

  async function act(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ tone: "success", text: success });
      await reload();
      return true;
    } catch (e) {
      setMessage({ tone: "error", text: (e as ApiError).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const city = name.trim();
    if (!city) return;
    if (await act(() => adminApi.post("/cities", { state, name: city }), `${city} added to ${stateLabel(state)}.`)) setName("");
  }

  return (
    <DataState loading={loading} error={error} hasData={!!data}>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* State picker: a list on wide screens, a dropdown on small ones */}
        <Panel title={`States (${data?.length ?? 0})`} className="hidden lg:block">
          <label className="relative mb-3 block">
            <HiMiniMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={16} />
            <Input aria-label="Filter states" placeholder="Filter states" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 pl-9" />
          </label>
          <ul className="-mx-2 max-h-[460px] overflow-y-auto" aria-label="States">
            {states.map((s) => (
              <li key={s.state}>
                <button
                  type="button"
                  onClick={() => (setState(s.state), setMessage(null))}
                  aria-current={s.state === state || undefined}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[13.5px] font-semibold transition",
                    s.state === state ? "bg-tertiary text-primary" : "text-gray-700 hover:bg-canvas",
                  )}
                >
                  {stateLabel(s.state)}
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-extrabold", s.cities.length ? "bg-white text-primary" : "text-gray-300")}>{s.cities.length}</span>
                </button>
              </li>
            ))}
            {states.length === 0 && <li className="px-3 py-2 text-[13px] text-gray-400">No state matches.</li>}
          </ul>
        </Panel>

        <Panel title={`Cities in ${stateLabel(state)}`} actions={<span className="text-[12px] text-gray-500">{totalCities} cities listed across all states</span>}>
          <div className="mb-4 lg:hidden">
            <Select
              aria-label="State"
              value={state}
              onValueChange={(s) => (setState(s), setMessage(null))}
              options={(data ?? []).map((s) => ({ value: s.state, label: `${stateLabel(s.state)}${s.cities.length ? ` (${s.cities.length})` : ""}` }))}
            />
          </div>

          {message && (
            <Alert tone={message.tone} className="mb-4">
              {message.text}
            </Alert>
          )}

          <form onSubmit={add} className="flex gap-2">
            <Input aria-label={`New city in ${stateLabel(state)}`} placeholder={`Add a city in ${stateLabel(state)}, e.g. ${state === "Lagos" ? "Ikeja" : "city name"}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <button
              type="submit"
              disabled={busy || name.trim().length < 2}
              className="h-12 shrink-0 rounded-[12px] bg-primary px-5 text-[14px] font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              Add city
            </button>
          </form>

          {current && current.cities.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Cities in ${stateLabel(state)}`}>
              {current.cities.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-full border border-border-stroke bg-white py-1.5 pr-1.5 pl-4 text-[13.5px] font-bold text-ink">
                  {c.name}
                  {c.terminals > 0 && (
                    <span className="rounded-full bg-tertiary px-2 py-0.5 text-[11px] font-extrabold text-primary" title="Terminals in this city">
                      {c.terminals} terminal{c.terminals > 1 ? "s" : ""}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={busy || c.terminals > 0}
                    onClick={() => act(() => adminApi.del(`/cities/${c.id}`), `${c.name} removed from ${stateLabel(state)}.`)}
                    aria-label={`Remove ${c.name}`}
                    title={c.terminals > 0 ? "Has terminals, so it can't be removed" : `Remove ${c.name}`}
                    className="rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <HiMiniXMark size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-[12px] border-2 border-dashed border-border-stroke px-4 py-8 text-center text-[13.5px] text-gray-500">
              No cities listed in {stateLabel(state)} yet. Add one above to place terminals there.
            </p>
          )}
          <p className="mt-5 text-[12px] text-gray-500">
            Terminals can only be added in a listed city. A city with terminals can&apos;t be removed; move its terminals first.
          </p>
          <div className="mt-2 lg:hidden">
            <SmallButton onClick={() => reload()}>Refresh</SmallButton>
          </div>
        </Panel>
      </div>
    </DataState>
  );
}
