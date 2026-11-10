import { OG_SIZE, ogCard } from "@/libs/og";
import { formatDuration, getCityRoute } from "@/libs/routes";
import { naira } from "@/libs/format";

export const alt = "Obere Transport bus route";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const r = await getCityRoute((await params).slug);
  if (!r) return ogCard({ eyebrow: "Intercity bus", title: "Obere Transport routes", subtitle: "Book your seat online." });
  const bits = [`About ${formatDuration(r.durationMinutes)}`];
  // The image font has no ₦ sign.
  if (r.fromPriceKobo != null) bits.push(`from ${naira(r.fromPriceKobo).replace("₦", "NGN ")}`);
  return ogCard({ eyebrow: "Intercity bus", title: `${r.from} to ${r.to}`, subtitle: `${bits.join(" · ")}. Pick your seat and pay online.` });
}
