import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowsRightLeft, HiOutlineCalendarDays, HiOutlineClock, HiOutlineTicket } from "react-icons/hi2";
import Button from "@/components/Button";
import Container from "@/components/layout/Container";
import { Card, PageHeader } from "@/components/ui/layout";
import ReadyToBoard from "@/components/landing-page/ReadyToBoard";
import { formatDuration, getCityRoute, getCityRoutes, type CityRoute } from "@/libs/routes";
import { naira } from "@/libs/format";
import { SITE_NAME, SITE_URL, jsonLd, pageMetadata } from "@/libs/seo";

/**
 * One page per city pair ("Lagos to Abuja"), the searches people make. Server-rendered so
 * search engines read the times and fares, and cached for an hour. Pages are generated on
 * first visit (nothing at build time, so a build never depends on the API being up).
 */
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

function summary(r: CityRoute) {
  const parts = [`about ${formatDuration(r.durationMinutes)}`];
  if (r.departureTimes.length) parts.push(`departures at ${listTimes(r.departureTimes)}`);
  if (r.fromPriceKobo != null) parts.push(`fares from ${naira(r.fromPriceKobo)}`);
  return parts.join(", ");
}

function listTimes(times: string[]) {
  const t = times.slice(0, 4);
  return t.length > 1 ? `${t.slice(0, -1).join(", ")} and ${t.at(-1)}` : t[0]!;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = await getCityRoute((await params).slug);
  if (!r) return { title: "Route not found", robots: { index: false } };
  const price = r.fromPriceKobo != null ? `: tickets from ${naira(r.fromPriceKobo)}` : "";
  return pageMetadata({
    title: `${r.from} to ${r.to} bus${price}`,
    path: `/routes/${r.slug}`,
    ownImage: true,
    description: `Book a bus from ${r.from} to ${r.to} with ${SITE_NAME}: ${summary(r)}. Pick your seat and pay online.`,
  });
}

export default async function CityRoutePage({ params }: Params) {
  const slug = (await params).slug;
  const all = await getCityRoutes();
  const r = all.find((x) => x.slug === slug);
  if (!r) notFound();

  const back = all.find((x) => x.from === r.to && x.to === r.from);
  const more = all.filter((x) => x.from === r.from && x.slug !== r.slug).slice(0, 6);
  const first = r.routes[0]!;
  const searchHref = `/book?${new URLSearchParams({ from: first.origin.id, to: first.destination.id })}`;

  const facts: { icon: typeof HiOutlineClock; label: string; value: string }[] = [
    { icon: HiOutlineTicket, label: "Fares from", value: r.fromPriceKobo != null ? naira(r.fromPriceKobo) : "See trips" },
    { icon: HiOutlineClock, label: "Journey time", value: `About ${formatDuration(r.durationMinutes)}` },
    { icon: HiOutlineCalendarDays, label: "Departures this week", value: r.departuresThisWeek ? String(r.departuresThisWeek) : "Check dates" },
  ];

  const faqs = [
    { q: `How long is the bus from ${r.from} to ${r.to}?`, a: `The trip takes about ${formatDuration(r.durationMinutes)}, depending on traffic and road conditions.` },
    {
      q: `How much is a bus ticket from ${r.from} to ${r.to}?`,
      a:
        r.fromPriceKobo != null
          ? `Fares on upcoming trips start from ${naira(r.fromPriceKobo)} per seat. The exact fare for each departure is shown when you search.`
          : "Search your travel date to see the fare for each departure.",
    },
    ...(r.departureTimes.length
      ? [{ q: `What time does the bus leave ${r.from}?`, a: `Buses usually leave at ${listTimes(r.departureTimes)} (Nigerian time). Search your date for the exact departures.` }]
      : []),
    { q: "Can I change my seat or travel date?", a: "Yes. Change passenger names and seats for free, or move to a later trip on the same route, from Manage Booking." },
  ];

  return (
    <>
      <Container>
        <nav aria-label="Breadcrumb" className="pt-4 text-[13px] text-gray-500 md:pt-8">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/routes" className="hover:text-primary">
            Routes
          </Link>{" "}
          / <span className="text-ink">{r.from} to {r.to}</span>
        </nav>
        <PageHeader
          className="pt-3 md:pt-4"
          eyebrow="Intercity bus"
          title={`${r.from} to ${r.to} bus`}
          description={`Travel from ${r.from} to ${r.to} with ${SITE_NAME}: ${summary(r)}. Choose your seat and pay online in minutes.`}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <Card key={label} className="!p-4">
                  <Icon className="text-accent" size={22} />
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.08em] text-gray-500">{label}</p>
                  <p className="font-display mt-0.5 text-[20px] font-black text-ink">{value}</p>
                </Card>
              ))}
            </div>

            <Card>
              <h2 className="font-display text-[19px] font-black text-ink">Terminals and departures</h2>
              <ul className="mt-4 divide-y divide-border-stroke">
                {r.routes.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div>
                      <p className="font-bold text-ink">
                        {x.origin.name} → {x.destination.name}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        About {formatDuration(x.durationMinutes)}
                        {x.departureTimes.length > 0 && <> · leaves {x.departureTimes.slice(0, 4).join(", ")}</>}
                        {x.fromPriceKobo != null && <> · from {naira(x.fromPriceKobo)}</>}
                      </p>
                    </div>
                    <Link
                      href={`/book?${new URLSearchParams({ from: x.origin.id, to: x.destination.id })}`}
                      className="text-[13.5px] font-extrabold text-primary hover:underline"
                    >
                      See trips →
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <section aria-labelledby="faq">
              <h2 id="faq" className="font-display text-[19px] font-black text-ink">
                {r.from} to {r.to}: common questions
              </h2>
              <div className="mt-3 space-y-2">
                {faqs.map((f) => (
                  <details key={f.q} className="group rounded-[14px] border border-border-stroke bg-white px-5 py-4">
                    <summary className="cursor-pointer list-none font-bold text-ink">{f.q}</summary>
                    <p className="mt-2 text-[14px] leading-[160%] text-gray-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <Card>
              <p className="font-display text-[18px] font-black text-ink">Book this trip</p>
              <p className="mt-1 text-[13.5px] text-gray-500">See today&apos;s and upcoming departures, pick your seat and pay online.</p>
              <Button href={searchHref} label={`Search ${r.from} to ${r.to}`} fullWidth className="mt-4" />
            </Card>
            {back && (
              <Card>
                <p className="flex items-center gap-2 font-bold text-ink">
                  <HiOutlineArrowsRightLeft className="text-accent" /> Return trip
                </p>
                <Link href={`/routes/${back.slug}`} className="mt-1 block text-[14px] font-semibold text-primary hover:underline">
                  {back.from} to {back.to}
                  {back.fromPriceKobo != null && <> from {naira(back.fromPriceKobo)}</>}
                </Link>
              </Card>
            )}
            {more.length > 0 && (
              <Card>
                <p className="font-bold text-ink">More routes from {r.from}</p>
                <ul className="mt-2 space-y-1.5">
                  {more.map((m) => (
                    <li key={m.slug}>
                      <Link href={`/routes/${m.slug}`} className="text-[14px] font-semibold text-primary hover:underline">
                        {m.from} to {m.to}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </aside>
        </div>
      </Container>
      <div className="mt-12">
        <ReadyToBoard />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd([
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Routes", item: `${SITE_URL}/routes` },
              { "@type": "ListItem", position: 3, name: `${r.from} to ${r.to}`, item: `${SITE_URL}/routes/${r.slug}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "BusTrip",
            name: `${r.from} to ${r.to} bus`,
            provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            departureBusStop: { "@type": "BusStation", name: first.origin.name, address: `${first.origin.city}, ${first.origin.state}, Nigeria` },
            arrivalBusStop: { "@type": "BusStation", name: first.destination.name, address: `${first.destination.city}, ${first.destination.state}, Nigeria` },
            ...(r.fromPriceKobo != null && {
              offers: { "@type": "AggregateOffer", priceCurrency: "NGN", lowPrice: r.fromPriceKobo / 100, url: `${SITE_URL}/routes/${r.slug}`, availability: "https://schema.org/InStock" },
            }),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ])}
      />
    </>
  );
}
