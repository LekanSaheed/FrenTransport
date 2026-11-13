import type { PublicConfig } from "./api";

export type BaggagePolicy = PublicConfig["baggage"];

/**
 * Price of one extra bag for a seat at this fare. Mirrors the API (which has the final
 * say): a % of the fare with a minimum, or a flat price, rounded to whole naira.
 */
export function extraBagFeeKobo(p: BaggagePolicy, unitPriceKobo: number): number {
  const raw = p.extraBagCharge === "flat" ? p.extraBagFlatKobo : Math.max(p.extraBagMinKobo, (unitPriceKobo * p.extraBagPercent) / 100);
  return Math.round(raw / 100) * 100;
}

const bags = (n: number) => `${n} bag${n === 1 ? "" : "s"}`;

/** "1 bag up to 23 kg per passenger". */
export function allowanceText(freeBagsPerPassenger: number, maxBagWeightKg: number): string {
  return freeBagsPerPassenger ? `${bags(freeBagsPerPassenger)} up to ${maxBagWeightKg} kg per passenger` : "No free checked bags";
}

export const extraBagsText = (n: number) => `${n} extra ${n === 1 ? "bag" : "bags"}`;
