"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SmartImage from "@/components/media/SmartImage";
import { PiPlugLight, PiWifiHigh } from "react-icons/pi";
import Button from "@/components/Button";
import { Field, Input, Select, type SelectGroup } from "@/components/ui/form";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";
import { api, ApiError } from "@/libs/api";
import { durationLabel, formatDate, formatTime, naira, todayInLagos } from "@/libs/format";
import type { Location, TripSummary } from "@/libs/types";

/** Terminals grouped by city: "Lagos" → Ikeja Terminal, Ojota Terminal… */
export function locationGroups(locations: Location[]): SelectGroup[] {
  const byCity = new Map<string, Location[]>();
  for (const l of locations) byCity.set(l.city, [...(byCity.get(l.city) ?? []), l]);
  return [...byCity.entries()].map(([city, items]) => ({
    label: city,
    options: items.map((l) => ({ value: l.id, label: l.name, selectedLabel: `${l.city} — ${l.name}`, textValue: `${l.city} ${l.name}` })),
  }));
}

export default function TripSearch() {
  const router = useRouter();
  const params = useSearchParams();

  const [origins, setOrigins] = useState<Location[]>([]);
  const [destinations, setDestinations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    date: params.get("date") ?? todayInLagos(1),
    pax: Number(params.get("pax") ?? 1),
  });
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.locations().then(setOrigins).catch((e: ApiError) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!form.from) return setDestinations([]);
    api
      .destinations(form.from)
      .then((d) => {
        setDestinations(d);
        if (form.to && !d.some((x) => x.id === form.to)) setForm((f) => ({ ...f, to: "" }));
      })
      .catch((e: ApiError) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.from]);

  // Search whenever the URL holds a complete query (also restores results on back navigation).
  // Route pages link with just from/to: search tomorrow (the form's default date) straight away.
  const query = {
    from: params.get("from"),
    to: params.get("to"),
    date: params.get("date") ?? (params.get("from") && params.get("to") ? todayInLagos(1) : null),
    pax: Number(params.get("pax") ?? 1),
  };
  useEffect(() => {
    if (!query.from || !query.to || !query.date) return;
    setLoading(true);
    setError(null);
    api
      .searchTrips({ originId: query.from, destinationId: query.to, date: query.date, passengers: query.pax })
      .then(setTrips)
      .catch((e: ApiError) => {
        setTrips(null);
        setError(e.message);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.from, query.to, query.date, query.pax]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.from || !form.to) return setError("Choose where you're travelling from and to.");
    const qs = new URLSearchParams({ from: form.from, to: form.to, date: form.date, pax: String(form.pax) });
    router.push(`/book?${qs}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_1fr_170px_120px_auto] md:items-end">
          <Field label="From" htmlFor="from">
            <Select
              id="from"
              value={form.from}
              onValueChange={(from) => setForm({ ...form, from })}
              placeholder="Select departure"
              options={locationGroups(origins)}
              required
            />
          </Field>
          <Field label="To" htmlFor="to">
            <Select
              id="to"
              value={form.to}
              onValueChange={(to) => setForm({ ...form, to })}
              placeholder={form.from ? "Select destination" : "Choose departure first"}
              options={locationGroups(destinations)}
              disabled={!form.from}
              required
            />
          </Field>
          <Field label="Travel date" htmlFor="date">
            <Input
              id="date"
              type="date"
              min={todayInLagos()}
              max={todayInLagos(90)}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </Field>
          <Field label="Passengers" htmlFor="pax">
            <Select id="pax" value={form.pax} onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" label="Search trips" className="w-full md:w-auto" />
        </form>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <LoadingBlock label="Finding available trips…" />}

      {!loading && trips && trips.length === 0 && (
        <EmptyState title="No trips on this date">Try another date — we run most routes daily.</EmptyState>
      )}

      {!loading && trips && trips.length > 0 && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">
            {trips.length} trip{trips.length > 1 ? "s" : ""} on {formatDate(trips[0]!.departureAt)}
          </p>
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} passengers={query.pax} />
          ))}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, passengers }: { trip: TripSummary; passengers: number }) {
  const few = trip.availableSeats > 0 && trip.availableSeats <= 3;
  return (
    <Card className="overflow-hidden p-0 transition hover:shadow-lift md:p-0">
      <div className="flex flex-col sm:flex-row">
        {trip.vehicle.imageUrl && (
          <div className="relative h-[120px] shrink-0 bg-white sm:h-auto sm:w-[170px]">
            <SmartImage src={trip.vehicle.imageUrl} alt={trip.vehicle.category} fill className="object-contain p-3" sizes="170px" />
          </div>
        )}
        <div className="flex flex-1 flex-col md:flex-row">
          <div className="flex-1 p-5 md:p-6">
            <div className="flex items-center gap-3 text-ink">
              <span className="font-display text-[24px] font-black tracking-n-2">{formatTime(trip.departureAt)}</span>
              <span className="flex flex-1 items-center gap-2 text-[11px] font-bold whitespace-nowrap text-gray-400 sm:max-w-[200px]">
                <span aria-hidden className="h-px flex-1 border-t-2 border-dashed border-border-stroke" />
                {durationLabel(trip.departureAt, trip.arrivalAt)}
                <span aria-hidden className="h-px flex-1 border-t-2 border-dashed border-border-stroke" />
              </span>
              <span className="font-display text-[17px] font-extrabold text-gray-500">{formatTime(trip.arrivalAt)}</span>
            </div>
            <p className="mt-1.5 text-[13.5px] font-semibold text-gray-500">
              {trip.origin.name}, {trip.origin.city} → {trip.destination.name}, {trip.destination.city}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
              <span className="rounded-full bg-tertiary px-2.5 py-1 font-bold text-primary">{trip.vehicle.category}</span>
              <span className="flex gap-2 text-gray-400">
                <PiWifiHigh size={15} aria-label="Wi-Fi" />
                <PiPlugLight size={15} aria-label="Charging ports" />
              </span>
              <span className={few ? "font-semibold text-orange-600" : ""}>
                {trip.availableSeats === 0 ? "Sold out" : `${trip.availableSeats} of ${trip.totalSeats} seats left`}
              </span>
            </div>
          </div>
          <div className="perforation flex items-center justify-between gap-4 border-l-0 border-t-2 p-5 max-md:before:hidden max-md:after:hidden md:w-[200px] md:flex-col md:items-stretch md:justify-center md:border-t-0 md:border-l-2 md:p-6">
            <div className="md:text-center">
              <p className="font-display text-[22px] font-black tracking-n-2 text-ink">{naira(trip.priceKobo)}</p>
              <p className="text-[11px] text-gray-500">per seat</p>
            </div>
            {trip.bookable ? (
              <Button href={`/book/${trip.id}?pax=${passengers}`} label="Select seats" variant="accent" />
            ) : (
              <span className="text-[12px] text-gray-500">{trip.availableSeats === 0 ? "Sold out" : `Not enough seats for ${passengers}`}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
