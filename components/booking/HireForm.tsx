"use client";
import React, { useEffect, useRef, useState } from "react";
import SmartImage from "@/components/media/SmartImage";
import Button from "@/components/Button";
import BookingCreated from "./BookingCreated";
import { ContactFields, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Card, DetailList, SectionTitle } from "@/components/ui/layout";
import { api, ApiError, newIdempotencyKey } from "@/libs/api";
import { lagosDateTime, naira, todayInLagos } from "@/libs/format";
import { startPayment } from "@/libs/payment";
import { useCustomer } from "@/libs/customer";
import { cn } from "@/libs/utils";
import type { BookingSummary, HireAvailability, HireCategory } from "@/libs/types";

type Kind = "car" | "bus";

const COPY: Record<Kind, { vehicle: string; destination: string; destinationHint: string; submitQuote: string }> = {
  car: {
    vehicle: "Choose a car",
    destination: "Destination or itinerary",
    destinationHint: "E.g. “Airport drop-off, then meetings in Victoria Island”.",
    submitQuote: "Request quotation",
  },
  bus: {
    vehicle: "Choose a bus",
    destination: "Destination",
    destinationHint: "Where the group is going. Add stops in the notes.",
    submitQuote: "Request quotation",
  },
};

export default function HireForm({ kind }: { kind: Kind }) {
  const [categories, setCategories] = useState<HireCategory[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    categoryId: "",
    pickupLocation: "",
    destination: "",
    pickupDate: todayInLagos(kind === "bus" ? 2 : 1),
    pickupTime: "08:00",
    durationDays: 1,
    passengerCount: kind === "bus" ? 14 : 1,
    tripType: "one_way" as "one_way" | "return",
    returnDate: todayInLagos(kind === "bus" ? 2 : 1),
    returnTime: "18:00",
    notes: "",
  });
  const [contact, setContact] = useState({ fullName: "", email: "", phone: "" });
  // Signed-in customers get their details pre-filled; the booking is linked to their account.
  const { user: customer } = useCustomer();
  useEffect(() => {
    if (customer) {
      setContact((c) => ({ fullName: c.fullName || customer.fullName, email: c.email || customer.email, phone: c.phone || customer.phone || "" }));
    }
  }, [customer]);
  const [availability, setAvailability] = useState<HireAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<BookingSummary | null>(null);
  const idemKey = useRef(newIdempotencyKey());

  useEffect(() => {
    api
      .hireCategories(kind)
      .then((c) => {
        setCategories(c);
        if (c[0]) setForm((f) => ({ ...f, categoryId: c[0]!.id }));
      })
      .catch((e: ApiError) => setLoadError(e.message));
  }, [kind]);

  const category = categories?.find((c) => c.id === form.categoryId);
  const pickupAt = lagosDateTime(form.pickupDate, form.pickupTime);

  // Live availability and price for the selected vehicle and dates.
  useEffect(() => {
    if (!form.categoryId || !form.pickupDate || !form.pickupTime || form.durationDays < 1) return;
    const t = setTimeout(() => {
      setChecking(true);
      api
        .hireAvailability({ categoryId: form.categoryId, kind, pickupAt, durationDays: form.durationDays })
        .then(setAvailability)
        .catch(() => setAvailability(null))
        .finally(() => setChecking(false));
    }, 300);
    return () => clearTimeout(t);
  }, [form.categoryId, form.pickupDate, form.pickupTime, form.durationDays, kind, pickupAt]);

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!categories) return <LoadingBlock label="Loading vehicles…" />;
  if (categories.length === 0) return <EmptyState title={`No ${kind}s available for hire right now`}>Please contact us directly.</EmptyState>;
  if (created) return <BookingCreated booking={created} email={contact.email} />;

  const instant = category?.pricingMode === "instant";
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.pickupLocation.trim().length < 3) e.pickupLocation = "Enter the pickup address";
    if (form.destination.trim().length < 3) e.destination = "Tell us where you're going";
    if (category && form.passengerCount > category.capacity) e.passengerCount = `${category.name} carries up to ${category.capacity} passengers`;
    if (kind === "bus" && form.tripType === "return" && lagosDateTime(form.returnDate, form.returnTime) <= pickupAt) {
      e.returnAt = "Return must be after pickup";
    }
    if (contact.fullName.trim().length < 2) e["contact.fullName"] = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) e["contact.email"] = "Enter a valid email address";
    if (!/^\+?\d{10,15}$/.test(contact.phone.replace(/[\s\-().]/g, ""))) e["contact.phone"] = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);

    const body = {
      categoryId: form.categoryId,
      pickupLocation: form.pickupLocation.trim(),
      destination: form.destination.trim(),
      pickupAt,
      durationDays: form.durationDays,
      passengerCount: form.passengerCount,
      notes: form.notes.trim() || undefined,
      contact,
      ...(kind === "bus" && {
        tripType: form.tripType,
        ...(form.tripType === "return" && { returnAt: lagosDateTime(form.returnDate, form.returnTime) }),
      }),
    };

    let booking: BookingSummary;
    try {
      booking = kind === "car" ? await api.createCarHire(body, idemKey.current) : await api.createBusHire(body, idemKey.current);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrors(apiErr.fieldErrors);
      setError(apiErr.message);
      setSubmitting(false);
      if (apiErr.code === "NO_VEHICLE_AVAILABLE") idemKey.current = newIdempotencyKey();
      return;
    }

    if (booking.status === "pending_payment") {
      try {
        await startPayment(booking.reference, contact.email);
      } catch {
        /* fall through to the created screen with a retry button */
      }
    }
    setCreated(booking);
    setSubmitting(false);
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <Card>
          <SectionTitle>{COPY[kind].vehicle}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={COPY[kind].vehicle}>
            {categories.map((c) => (
              <button
                type="button"
                role="radio"
                aria-checked={c.id === form.categoryId}
                key={c.id}
                onClick={() => set("categoryId", c.id)}
                className={cn(
                  "flex gap-3 rounded-[10px] border p-3 text-left transition",
                  c.id === form.categoryId ? "border-primary bg-primary/5" : "border-border-stroke bg-white hover:border-primary/50",
                )}
              >
                {c.imageUrl && (
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[6px] bg-[#fdfdfd]">
                    <SmartImage src={c.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold tracking-n-3 text-black">{c.name}</span>
                  <span className="block text-[12px] text-gray-500">Up to {c.capacity} passengers</span>
                  <span className="mt-1 block text-[12px] font-semibold text-primary">
                    {c.pricingMode === "instant" ? `${naira(c.dailyRateKobo)} / day` : "Price on request"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Trip details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pickup location" htmlFor="pickup" error={errors.pickupLocation} className="sm:col-span-2">
              <Input id="pickup" placeholder="Street address, landmark or terminal" value={form.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} invalid={!!errors.pickupLocation} />
            </Field>
            <Field label={COPY[kind].destination} htmlFor="destination" error={errors.destination} hint={COPY[kind].destinationHint} className="sm:col-span-2">
              <Input id="destination" value={form.destination} onChange={(e) => set("destination", e.target.value)} invalid={!!errors.destination} />
            </Field>
            <Field label="Pickup date" htmlFor="pdate" error={errors.pickupAt}>
              <Input id="pdate" type="date" min={todayInLagos(kind === "bus" ? 1 : 0)} value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} />
            </Field>
            <Field label="Pickup time" htmlFor="ptime">
              <Input id="ptime" type="time" value={form.pickupTime} onChange={(e) => set("pickupTime", e.target.value)} />
            </Field>
            <Field label="Duration (days)" htmlFor="days">
              <Input id="days" type="number" min={1} max={30} value={form.durationDays} onChange={(e) => set("durationDays", Math.max(1, Number(e.target.value) || 1))} />
            </Field>
            <Field label="Passengers" htmlFor="passengers" error={errors.passengerCount}>
              <Input id="passengers" type="number" min={1} max={100} value={form.passengerCount} onChange={(e) => set("passengerCount", Math.max(1, Number(e.target.value) || 1))} invalid={!!errors.passengerCount} />
            </Field>

            {kind === "bus" && (
              <>
                <Field label="Trip type" htmlFor="ttype" className="sm:col-span-2">
                  <Select id="ttype" value={form.tripType} onChange={(e) => set("tripType", e.target.value as "one_way" | "return")}>
                    <option value="one_way">One way</option>
                    <option value="return">Return</option>
                  </Select>
                </Field>
                {form.tripType === "return" && (
                  <>
                    <Field label="Return date" htmlFor="rdate" error={errors.returnAt}>
                      <Input id="rdate" type="date" min={form.pickupDate} value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} />
                    </Field>
                    <Field label="Return time" htmlFor="rtime">
                      <Input id="rtime" type="time" value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} />
                    </Field>
                  </>
                )}
              </>
            )}

            <Field label={kind === "bus" ? "Additional requirements" : "Additional instructions"} htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" placeholder={kind === "bus" ? "Luggage, stops, event details…" : "Flight number, stops, child seat…"} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>Contact details</SectionTitle>
          <ContactFields value={contact} onChange={setContact} errors={errors} />
        </Card>
      </div>

      <aside>
        <Card className="lg:sticky lg:top-28">
          <SectionTitle>Summary</SectionTitle>
          <DetailList
            rows={[
              ["Vehicle", category?.name ?? "—"],
              ["Duration", `${form.durationDays} day${form.durationDays > 1 ? "s" : ""}`],
              ["Passengers", String(form.passengerCount)],
              [
                "Price",
                instant ? (checking ? "Checking…" : naira(availability?.estimatedAmountKobo ?? (category?.dailyRateKobo ?? 0) * form.durationDays)) : "By quotation",
              ],
            ]}
          />
          {availability && !availability.available && (
            <Alert tone="warning" className="mt-4">
              {instant ? "This vehicle is fully booked for those dates. Try other dates or another vehicle." : "Availability is limited for those dates — we'll confirm in your quotation."}
            </Alert>
          )}
          {!instant && (
            <p className="mt-4 text-[12px] leading-[160%] text-gray-500">
              We&apos;ll review your request and email a quotation. Nothing is charged until you accept and pay.
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={instant && availability?.available === false}
            label={instant ? `Book and pay ${naira(availability?.estimatedAmountKobo ?? null)}` : COPY[kind].submitQuote}
          />
        </Card>
      </aside>
    </form>
  );
}
