/** Shapes returned by the backend API (see Backend/README.md). Money is in kobo. */

export type BookingType = "seat" | "car_hire" | "bus_hire";
export type BookingStatus =
  | "pending_approval"
  | "pending_payment"
  | "payment_processing"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "completed";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refund_pending" | "refunded" | "partially_refunded";

export interface Location {
  id: string;
  code?: string;
  name: string;
  city: string;
  state: string;
  address?: string;
}

export interface TripSummary {
  id: string;
  origin: Location;
  destination: Location;
  departureAt: string;
  arrivalAt: string;
  priceKobo: number;
  vehicle: { category: string; code: string; amenities: string[]; imageUrl: string };
  totalSeats: number;
  availableSeats: number;
  bookable: boolean;
}

export interface SeatCell {
  label: string;
  row: number | null;
  column: number | null;
  available: boolean;
}

export interface TripDetails extends Omit<TripSummary, "bookable"> {
  status: string;
  bookingOpen: boolean;
  seatMap: { rows: number | null; columns: number | null; driver: { row: number; column: number } | null; seats: SeatCell[] };
}

export interface HireCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  pricingMode: "instant" | "quote";
  dailyRateKobo: number | null;
}

export interface HireAvailability {
  available: boolean;
  pricingMode: "instant" | "quote";
  estimatedAmountKobo: number | null;
  startAt: string;
  endAt: string;
}

export interface Quotation {
  id: string;
  amountKobo: number;
  validUntil: string;
  status: "pending" | "accepted" | "declined" | "expired" | "superseded";
  breakdown?: { label: string; amountKobo: number }[];
  notes?: string;
}

export interface BookingSummary {
  reference: string;
  type: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountKobo: number | null;
  currency: string;
  paymentDueAt: string | null;
  travelDate: string;
  confirmedAt: string | null;
  createdAt: string;
  contact: { fullName: string; email: string; phone: string };
  quotation: Quotation | null;
  cancellation: { status: "requested" | "approved" | "rejected"; refundAmountKobo: number; reason?: string } | null;
  trip?: {
    id: string;
    origin: { name: string; city: string; address?: string | null };
    destination: { name: string; city: string; address?: string | null };
    departureAt: string;
    arrivalAt: string;
    vehicle: string;
    /** Plate number of the vehicle on this trip (null for very old bookings). */
    plateNumber?: string | null;
  };
  seats?: string[];
  passengers?: { fullName: string; seat: string; gender?: string }[];
  unitPriceKobo?: number;
  /** Seat bookings: the free allowance and extra bags bought online. */
  baggage?: BookingBaggage;
  hire?: {
    category: string;
    pricingMode: "instant" | "quote";
    pickupLocation: string;
    destination: string;
    pickupAt: string;
    endsAt: string;
    durationDays: number;
    passengerCount: number;
    tripType?: "one_way" | "return";
    returnAt?: string | null;
    notes?: string;
  };
}

export interface BookingTicket {
  code: string;
  /** QR image on the API (SVG); swap the extension for a PNG. */
  qrUrl: string;
  checkedInAt: string | null;
}

export interface BookingDetails extends BookingSummary {
  nextOfKin?: { fullName: string; phone: string } | null;
  modificationRequests: {
    id: string;
    message: string;
    status: "open" | "resolved" | "rejected";
    requestedAt: string;
    resolvedAt: string | null;
    resolutionNote: string | null;
  }[];
  statusHistory: { status: BookingStatus; at: string; by: string; note?: string }[];
  /** Seat bookings: what the customer can change themselves, and any date change awaiting payment. */
  changes: BookingChanges | null;
  /** Boarding pass (QR) while the booking is confirmed. */
  ticket?: BookingTicket | null;
  payments: {
    purpose?: "booking" | "amendment" | "baggage";
    reference: string;
    amountKobo: number;
    status: "initialized" | "pending" | "success" | "failed";
    channel: string | null;
    paidAt: string | null;
    refunds: { amountKobo: number; status: string; requestedAt: string; processedAt: string | null }[];
  }[];
}

export interface ChangeRule {
  allowed: boolean;
  reason: string | null;
}

export interface PendingDateChange {
  id: string;
  status: "awaiting_payment" | "completed" | "expired" | "cancelled" | "failed";
  toTripId: string;
  toDepartureAt: string;
  seats: string[];
  feeKobo: number;
  chargeMode: "percentage" | "fare_difference";
  feePercent: number | null;
  holdExpiresAt: string;
}

export interface BookingChanges {
  rules: {
    names: ChangeRule;
    seats: ChangeRule;
    dateChange: ChangeRule & { closesAt: string; chargeMode: "percentage" | "fare_difference"; feePercent: number };
  };
  pending: PendingDateChange | null;
  /** Buying extra bags: paid at the terminal, or online while allowed. */
  baggage?: { payAt: "terminal" | "in_app"; allowed: boolean; reason: string | null; feePerBagKobo: number; remaining: number };
}

export interface BookingBaggage {
  freeBagsPerPassenger: number;
  maxBagWeightKg: number;
  note: string | null;
  passengers: number;
  freeBags: number;
  extraBags: number;
  extraFeesKobo: number;
}

/** A later departure the booking can move to, with what the move costs. */
export interface DateChangeOption extends TripSummary {
  feeKobo: number;
  chargeMode: "percentage" | "fare_difference";
  feePercent: number | null;
}

export interface CancellationQuote {
  allowed: boolean;
  mode: "immediate" | "review" | null;
  refundAmountKobo: number;
  message: string;
}

export interface PaymentStatusView {
  payment: { reference: string; status: "initialized" | "pending" | "success" | "failed"; amountKobo: number; paidAt: string | null; purpose?: "booking" | "amendment" | "baggage"; refunding?: boolean };
  booking: { reference: string; type: BookingType; status: BookingStatus; paymentStatus: PaymentStatus } | null;
}
