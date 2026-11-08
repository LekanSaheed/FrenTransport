import React from "react";
import { PaymentBadge, StatusBadge } from "@/components/ui/feedback";
import { Card, DetailList, SectionTitle } from "@/components/ui/layout";
import { BOOKING_TYPE_LABEL, formatDateTime, naira } from "@/libs/format";
import type { BookingDetails, BookingSummary } from "@/libs/types";

/** What the booking is: trip or hire details, passengers, price. Shared by Status and Manage. */
export default function BookingView({ booking }: { booking: BookingSummary | BookingDetails }) {
  const b = booking;
  const details: [React.ReactNode, React.ReactNode][] = [["Booking type", BOOKING_TYPE_LABEL[b.type]]];

  if (b.trip) {
    details.push(
      ["From", `${b.trip.origin.name}, ${b.trip.origin.city}`],
      ["To", `${b.trip.destination.name}, ${b.trip.destination.city}`],
      ["Departure", formatDateTime(b.trip.departureAt)],
      ["Vehicle", b.trip.vehicle],
      ["Seats", b.seats?.join(", ") ?? "—"],
    );
  }
  if (b.hire) {
    details.push(
      ["Vehicle", b.hire.category],
      ["Pickup", b.hire.pickupLocation],
      ["Destination", b.hire.destination],
      ["Pickup time", formatDateTime(b.hire.pickupAt)],
      ["Duration", `${b.hire.durationDays} day${b.hire.durationDays > 1 ? "s" : ""}`],
      ["Passengers", String(b.hire.passengerCount)],
    );
    if (b.hire.tripType) details.push(["Trip type", b.hire.tripType === "return" ? "Return" : "One way"]);
    if (b.hire.returnAt) details.push(["Return", formatDateTime(b.hire.returnAt)]);
    if (b.hire.notes) details.push(["Notes", b.hire.notes]);
  }
  details.push(["Amount", b.amountKobo != null ? naira(b.amountKobo) : "Awaiting quotation"]);
  if (b.confirmedAt) details.push(["Confirmed on", formatDateTime(b.confirmedAt)]);

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-n-1 text-gray-500">Booking reference</p>
          <p className="text-[26px] font-bold tracking-n-4 text-primary">{b.reference}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="flex items-center gap-2 text-[11px] text-gray-500">
            Booking <StatusBadge status={b.status} />
          </span>
          <span className="flex items-center gap-2 text-[11px] text-gray-500">
            Payment <PaymentBadge status={b.paymentStatus} />
          </span>
        </div>
      </div>

      <DetailList rows={details} />

      {b.passengers && b.passengers.length > 0 && (
        <div className="mt-5">
          <SectionTitle>Passengers</SectionTitle>
          <DetailList rows={b.passengers.map((p) => [p.fullName, `Seat ${p.seat}`])} />
        </div>
      )}

      <div className="mt-5">
        <SectionTitle>Contact</SectionTitle>
        <DetailList
          rows={[
            ["Name", b.contact.fullName],
            ["Email", b.contact.email],
            ["Phone", b.contact.phone],
            ...("nextOfKin" in b && b.nextOfKin ? [["Next of kin", `${b.nextOfKin.fullName} · ${b.nextOfKin.phone}`] as [string, string]] : []),
          ]}
        />
      </div>
    </Card>
  );
}
