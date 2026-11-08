"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiMiniArrowsRightLeft } from "react-icons/hi2";
import Button from "@/components/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { locationGroups } from "@/components/booking/TripSearch";
import { api } from "@/libs/api";
import { todayInLagos } from "@/libs/format";
import { cn } from "@/libs/utils";
import type { Location } from "@/libs/types";

const TABS = [
  { id: "seat", label: "Book a seat" },
  { id: "car", label: "Hire a car" },
  { id: "bus", label: "Hire a bus" },
] as const;

type Tab = (typeof TABS)[number]["id"];

/** Homepage booking widget: seat search goes straight to /book with the query filled in. */
export default function HeroSearch() {
  const [tab, setTab] = useState<Tab>("seat");
  return (
    <div className="rounded-[24px] border border-border-stroke bg-white p-2 shadow-lift">
      <div role="tablist" aria-label="What would you like to book?" className="flex gap-1 rounded-[18px] bg-canvas p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-[14px] px-3 py-2.5 text-[13px] font-extrabold transition sm:text-[14px]",
              tab === t.id ? "bg-white text-primary shadow-card" : "text-gray-500 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 pt-4 md:p-4">{tab === "seat" ? <SeatSearch /> : <HirePrompt kind={tab} />}</div>
    </div>
  );
}

function SeatSearch() {
  const router = useRouter();
  const [origins, setOrigins] = useState<Location[]>([]);
  const [destinations, setDestinations] = useState<Location[]>([]);
  const [form, setForm] = useState({ from: "", to: "", date: todayInLagos(1), pax: 1 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.locations().then(setOrigins).catch(() => setError("Routes couldn't be loaded. Please refresh the page."));
  }, []);

  useEffect(() => {
    if (!form.from) return setDestinations([]);
    api
      .destinations(form.from)
      .then((d) => {
        setDestinations(d);
        setForm((f) => (f.to && !d.some((x) => x.id === f.to) ? { ...f, to: "" } : f));
      })
      .catch(() => setDestinations([]));
  }, [form.from]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.from || !form.to) return setError("Choose where you're travelling from and to.");
    const qs = new URLSearchParams({ from: form.from, to: form.to, date: form.date, pax: String(form.pax) });
    router.push(`/book?${qs}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto_1fr] lg:grid-cols-[1fr_auto_1fr_160px_110px_auto] lg:items-end">
      <Field label="From" htmlFor="hero-from">
        <Select
          id="hero-from"
          value={form.from}
          onValueChange={(from) => setForm({ ...form, from })}
          placeholder="Departure city"
          options={locationGroups(origins)}
          required
        />
      </Field>
      <span aria-hidden className="hidden h-12 items-center justify-center self-end text-gray-300 md:flex">
        <HiMiniArrowsRightLeft size={18} />
      </span>
      <Field label="To" htmlFor="hero-to">
        <Select
          id="hero-to"
          value={form.to}
          onValueChange={(to) => setForm({ ...form, to })}
          placeholder={form.from ? "Destination" : "Choose departure first"}
          options={locationGroups(destinations)}
          disabled={!form.from}
          required
        />
      </Field>
      <div className="grid grid-cols-[1fr_110px] gap-3 md:col-span-3 lg:col-span-2 lg:grid-cols-[160px_110px]">
        <Field label="Date" htmlFor="hero-date">
          <Input
            id="hero-date"
            type="date"
            min={todayInLagos()}
            max={todayInLagos(90)}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </Field>
        <Field label="Passengers" htmlFor="hero-pax">
          <Select id="hero-pax" value={form.pax} onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button type="submit" variant="accent" label="Search trips" className="h-12 w-full md:col-span-3 lg:col-span-1 lg:w-auto" />
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-red-600 md:col-span-3 lg:col-span-6">
          {error}
        </p>
      )}
    </form>
  );
}

function HirePrompt({ kind }: { kind: "car" | "bus" }) {
  const copy =
    kind === "car"
      ? { title: "A private car with a driver", text: "Airport runs, business days or intercity trips, with a professional driver. Pick a car, check availability and book." }
      : { title: "A whole bus for your group", text: "Weddings, church trips, excursions and staff transport. Tell us about your trip and we'll send you a quotation." };
  return (
    <div className="flex flex-col gap-4 rounded-[16px] bg-tertiary/50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-[17px] font-extrabold text-ink">{copy.title}</p>
        <p className="mt-1 max-w-xl text-[14px] leading-[160%] text-gray-600">{copy.text}</p>
      </div>
      <Link
        href={`/hire/${kind}`}
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-[12px] bg-accent px-6 text-[14px] font-extrabold text-white hover:brightness-95"
      >
        {kind === "car" ? "Hire a car" : "Request a bus"} →
      </Link>
    </div>
  );
}
