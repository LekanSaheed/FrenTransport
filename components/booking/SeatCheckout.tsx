"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import SeatMap from "./SeatMap";
import BookingCreated from "./BookingCreated";
import { ContactFields, Field, Input, Select } from "@/components/ui/form";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { Card, DetailList, SectionTitle, Steps } from "@/components/ui/layout";
import { api, ApiError, newIdempotencyKey } from "@/libs/api";
import { durationLabel, formatDateTime, naira } from "@/libs/format";
import { startPayment } from "@/libs/payment";
import { useCustomer } from "@/libs/customer";
import { reloadPublicConfig, useBaggagePolicy } from "@/libs/site";
import { extraBagFeeKobo, extraBagsText } from "@/libs/baggage";
import BaggagePicker from "./BaggagePicker";
import type { BookingSummary, TripDetails } from "@/libs/types";

type Passenger = { fullName: string; gender: "" | "male" | "female" };
const STEPS = ["Choose seats", "Passenger details", "Review & pay"];

export default function SeatCheckout({ tripId }: { tripId: string }) {
  const params = useSearchParams();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [pax, setPax] = useState(Math.min(10, Math.max(1, Number(params.get("pax") ?? 1))));
  const [seats, setSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contact, setContact] = useState({ fullName: "", email: "", phone: "" });
  // Signed-in customers get their details pre-filled; the booking is linked to their account.
  const { user: customer } = useCustomer();
  useEffect(() => {
    if (customer) {
      setContact((c) => ({ fullName: c.fullName || customer.fullName, email: c.email || customer.email, phone: c.phone || customer.phone || "" }));
    }
  }, [customer]);
  const [nextOfKin, setNextOfKin] = useState({ fullName: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const baggage = useBaggagePolicy();
  const [extraBags, setExtraBags] = useState(0);
  // One key per checkout attempt; a retry after an error reuses it so no second hold is created.
  const idemKey = useRef(newIdempotencyKey());

  const load = useCallback(() => {
    return api
      .trip(tripId)
      .then((t) => {
        setTrip(t);
        setSeats((current) => current.filter((l) => t.seatMap.seats.find((s) => s.label === l)?.available));
      })
      .catch((e: ApiError) => setLoadError(e.status === 404 ? "This trip could not be found." : e.message));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  // Each step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    setPassengers((p) => Array.from({ length: pax }, (_, i) => p[i] ?? { fullName: "", gender: "" }));
    setSeats((s) => s.slice(0, pax));
  }, [pax]);

  if (loadError) return <Alert tone="error" title="Trip unavailable">{loadError} <Link className="underline" href="/book">Search again</Link></Alert>;
  if (!trip) return <LoadingBlock label="Loading trip…" />;
  if (booking) return <BookingCreated booking={booking} email={contact.email} />;

  if (!trip.bookingOpen) {
    return (
      <Alert tone="warning" title="Booking closed">
        Online booking for this departure has closed. <Link className="underline" href="/book">Find another trip</Link>
      </Alert>
    );
  }

  const available = trip.seatMap.seats.filter((s) => s.available).length;
  // Extra bags only when Settings lets customers pay for them here; the API re-checks the price.
  const inAppBags = baggage?.extraBagPayment === "in_app";
  const bagFee = baggage ? extraBagFeeKobo(baggage, trip.priceKobo) : 0;
  const bags = inAppBags ? Math.min(extraBags, baggage!.maxExtraBagsPerPassenger * pax) : 0;
  const total = trip.priceKobo * pax + bags * bagFee;

  function toggleSeat(label: string) {
    setError(null);
    setSeats((s) => {
      if (s.includes(label)) return s.filter((x) => x !== label);
      if (s.length < pax) return [...s, label];
      return [...s.slice(1), label]; // At the limit: swap out the earliest pick.
    });
  }

  function validateDetails(): boolean {
    const e: Record<string, string> = {};
    passengers.forEach((p, i) => {
      if (p.fullName.trim().length < 2) e[`passengers.${i}.fullName`] = "Enter the passenger's full name";
    });
    if (contact.fullName.trim().length < 2) e["contact.fullName"] = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) e["contact.email"] = "Enter a valid email address";
    if (!/^\+?\d{10,15}$/.test(contact.phone.replace(/[\s\-().]/g, ""))) e["contact.phone"] = "Enter a valid phone number";
    if (nextOfKin.fullName || nextOfKin.phone) {
      if (nextOfKin.fullName.trim().length < 2) e["nextOfKin.fullName"] = "Enter their full name";
      if (!/^\+?\d{10,15}$/.test(nextOfKin.phone.replace(/[\s\-().]/g, ""))) e["nextOfKin.phone"] = "Enter a valid phone number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pay() {
    setSubmitting(true);
    setError(null);
    let created: BookingSummary;
    try {
      created = await api.createSeatBooking(
        {
          tripId,
          seats,
          passengers: passengers.map((p) => ({ fullName: p.fullName.trim(), ...(p.gender && { gender: p.gender }) })),
          contact,
          ...(nextOfKin.fullName && { nextOfKin }),
          ...(bags > 0 && { extraBags: bags }),
        },
        idemKey.current,
      );
    } catch (e) {
      const err = e as ApiError;
      setSubmitting(false);
      if (err.code === "SEATS_UNAVAILABLE") {
        idemKey.current = newIdempotencyKey();
        await load();
        setStep(0);
        setError("Sorry — one of your seats was just taken. Please choose another seat.");
        return;
      }
      if (err.code === "EXTRA_BAGS_AT_TERMINAL" || err.code === "TOO_MANY_BAGS") {
        // Baggage settings changed while they were booking: show the current rules.
        reloadPublicConfig();
        setExtraBags(0);
        setError(`${err.message} We've removed the extra bags; please review and pay again.`);
        return;
      }
      if (err.code === "VALIDATION_ERROR") {
        setErrors(err.fieldErrors);
        setStep(1);
      }
      setError(err.message);
      return;
    }

    try {
      await startPayment(created.reference, contact.email);
    } catch {
      // The booking exists and seats are held; show it with a retry button.
      setBooking(created);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <Steps steps={STEPS} current={step} />
        {error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {step === 0 && (
          <Card>
            <SectionTitle
              aside={
                <div className="flex items-center gap-2 text-[12px] text-gray-600">
                  <label htmlFor="pax">Passengers</label>
                  <Select id="pax" className="h-9 w-[72px]" value={pax} onChange={(e) => setPax(Number(e.target.value))}>
                    {Array.from({ length: Math.min(10, available) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </Select>
                </div>
              }
            >
              Choose {pax} seat{pax > 1 ? "s" : ""}
            </SectionTitle>
            <SeatMap {...trip.seatMap} selected={seats} max={pax} onToggle={toggleSeat} />
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-[13px] text-gray-500">
                {seats.length ? `Selected: ${seats.join(", ")}` : "Tap a seat to select it."}
              </p>
              <Button label="Continue" disabled={seats.length !== pax} onClick={() => setStep(1)} />
            </div>
          </Card>
        )}

        {step === 1 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (validateDetails()) setStep(2);
            }}
            className="space-y-4"
          >
            <Card>
              <SectionTitle>Passengers</SectionTitle>
              <div className="space-y-4">
                {passengers.map((p, i) => (
                  <div key={i} className="grid gap-3 sm:grid-cols-[1fr_150px]">
                    <Field label={`Passenger ${i + 1} — seat ${seats[i]}`} htmlFor={`p-${i}`} error={errors[`passengers.${i}.fullName`]}>
                      <Input
                        id={`p-${i}`}
                        value={p.fullName}
                        autoComplete={i === 0 ? "name" : "off"}
                        onChange={(e) => setPassengers((ps) => ps.map((x, j) => (j === i ? { ...x, fullName: e.target.value } : x)))}
                        invalid={!!errors[`passengers.${i}.fullName`]}
                      />
                    </Field>
                    <Field label="Gender (optional)" htmlFor={`g-${i}`}>
                      <Select
                        id={`g-${i}`}
                        value={p.gender}
                        onChange={(e) =>
                          setPassengers((ps) => ps.map((x, j) => (j === i ? { ...x, gender: e.target.value as Passenger["gender"] } : x)))
                        }
                      >
                        <option value="">—</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </Select>
                    </Field>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle>Contact details</SectionTitle>
              <ContactFields value={contact} onChange={setContact} errors={errors} />
            </Card>
            <Card>
              <SectionTitle>Next of kin (optional)</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="nok-name" error={errors["nextOfKin.fullName"]}>
                  <Input id="nok-name" value={nextOfKin.fullName} onChange={(e) => setNextOfKin({ ...nextOfKin, fullName: e.target.value })} />
                </Field>
                <Field label="Phone number" htmlFor="nok-phone" error={errors["nextOfKin.phone"]}>
                  <Input id="nok-phone" type="tel" value={nextOfKin.phone} onChange={(e) => setNextOfKin({ ...nextOfKin, phone: e.target.value })} />
                </Field>
              </div>
            </Card>
            <div className="flex justify-between">
              <Button variant="secondary" label="Back" onClick={() => setStep(0)} />
              <Button type="submit" label="Review booking" />
            </div>
          </form>
        )}

        {step === 2 && (
          <Card>
            <SectionTitle>Review your booking</SectionTitle>
            <DetailList
              rows={[
                ["Passengers", passengers.map((p, i) => `${p.fullName} (seat ${seats[i]})`).join(", ")],
                ["Contact", `${contact.fullName} · ${contact.email} · ${contact.phone}`],
                ...(nextOfKin.fullName ? [["Next of kin", `${nextOfKin.fullName} · ${nextOfKin.phone}`] as [string, string]] : []),
              ]}
            />
            {baggage && (
              <div className="mt-5 border-t border-border-stroke pt-5">
                <SectionTitle>Baggage</SectionTitle>
                <BaggagePicker policy={baggage} passengers={pax} feePerBagKobo={bagFee} value={bags} onChange={setExtraBags} disabled={submitting} />
              </div>
            )}
            <Alert tone="info" className="mt-4">
              Your seats are held for 15 minutes once you continue. Payment is handled securely by Paystack.
            </Alert>
            <div className="mt-6 flex justify-between gap-3">
              <Button variant="secondary" label="Back" onClick={() => setStep(1)} disabled={submitting} />
              <Button label={`Pay ${naira(total)}`} onClick={pay} loading={submitting} />
            </div>
          </Card>
        )}
      </div>

      <aside>
        <Card className="lg:sticky lg:top-28">
          <SectionTitle>Trip summary</SectionTitle>
          <DetailList
            rows={[
              ["From", `${trip.origin.name}, ${trip.origin.city}`],
              ["To", `${trip.destination.name}, ${trip.destination.city}`],
              ["Departure", formatDateTime(trip.departureAt)],
              ["Duration", `~${durationLabel(trip.departureAt, trip.arrivalAt)}`],
              ["Vehicle", trip.vehicle.category],
              ["Seats", seats.length ? seats.join(", ") : "—"],
              ["Fare", `${naira(trip.priceKobo)} × ${pax}`],
              ...(bags > 0 ? [[extraBagsText(bags), `${naira(bagFee)} × ${bags}`] as [string, string]] : []),
              [<span key="t" className="font-semibold text-black">Total</span>, <span key="v" className="text-[16px]">{naira(total)}</span>],
            ]}
          />
        </Card>
      </aside>
    </div>
  );
}
