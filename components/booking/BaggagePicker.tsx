"use client";
import React from "react";
import { HiMiniMinus, HiMiniPlus } from "react-icons/hi2";
import { PiSuitcaseRolling } from "react-icons/pi";
import { Alert } from "@/components/ui/feedback";
import { allowanceText, extraBagsText, type BaggagePolicy } from "@/libs/baggage";
import { naira } from "@/libs/format";

/** The free allowance, with the admin's note. Shared by checkout and Manage Booking. */
export function BaggageAllowance({ freeBagsPerPassenger, maxBagWeightKg, note }: { freeBagsPerPassenger: number; maxBagWeightKg: number; note?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] bg-tertiary/60 p-4">
      <PiSuitcaseRolling size={26} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <p className="text-[14px] font-bold text-ink">Included: {allowanceText(freeBagsPerPassenger, maxBagWeightKg)}</p>
        {note && <p className="mt-0.5 text-[13px] text-gray-600">{note}</p>}
      </div>
    </div>
  );
}

/** Notice when extra bags are paid for at the terminal (the default). */
export function TerminalBaggageNotice() {
  return (
    <Alert tone="info" className="mt-3">
      Need more? Extra bags are paid for at the terminal before boarding. Please arrive early so we can weigh and tag them.
    </Alert>
  );
}

/** − n + stepper for extra bags with the price per bag and the running total. */
export function ExtraBagStepper({
  value,
  max,
  feePerBagKobo,
  onChange,
  disabled,
  label = "Extra bags",
}: {
  value: number;
  max: number;
  feePerBagKobo: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const btn = "flex h-10 w-10 items-center justify-center rounded-full border border-border-stroke bg-white text-ink transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border-stroke p-4">
      <div>
        <p className="text-[14px] font-bold text-ink">{label}</p>
        <p className="text-[12.5px] text-gray-500">
          {naira(feePerBagKobo)} per bag, up to {max} online{value > 0 && <> · {extraBagsText(value)}: {naira(value * feePerBagKobo)}</>}
        </p>
      </div>
      <div className="flex items-center gap-3" role="group" aria-label={label}>
        <button type="button" className={btn} onClick={() => onChange(Math.max(0, value - 1))} disabled={disabled || value <= 0} aria-label="One bag fewer">
          <HiMiniMinus size={18} />
        </button>
        <span className="font-display w-6 text-center text-[20px] font-black text-ink" aria-live="polite">
          {value}
        </span>
        <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="One more bag">
          <HiMiniPlus size={18} />
        </button>
      </div>
    </div>
  );
}

/** Checkout: the allowance, then either the terminal notice or the extra-bag stepper. */
export default function BaggagePicker({
  policy,
  passengers,
  feePerBagKobo,
  value,
  onChange,
  disabled,
}: {
  policy: BaggagePolicy;
  passengers: number;
  feePerBagKobo: number;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const max = policy.maxExtraBagsPerPassenger * passengers;
  return (
    <div>
      <BaggageAllowance freeBagsPerPassenger={policy.freeBagsPerPassenger} maxBagWeightKg={policy.maxBagWeightKg} note={policy.note} />
      {policy.extraBagPayment === "in_app" && max > 0 ? (
        <>
          <p className="mt-4 text-[14px] font-semibold text-ink">Need more baggage allowance?</p>
          <ExtraBagStepper value={value} max={max} feePerBagKobo={feePerBagKobo} onChange={onChange} disabled={disabled} />
          <p className="mt-2 text-[12px] text-gray-500">
            Each extra bag can weigh up to {policy.maxBagWeightKg} kg. You can also add bags later from Manage Booking.
          </p>
        </>
      ) : (
        <TerminalBaggageNotice />
      )}
    </div>
  );
}
