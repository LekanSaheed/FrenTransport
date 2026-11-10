import Link from "next/link";
import { HiOutlineClock, HiOutlineMapPin } from "react-icons/hi2";
import Container from "@/components/layout/Container";
import { PageHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/feedback";
import ReadyToBoard from "@/components/landing-page/ReadyToBoard";
import { formatDuration, getCityRoutes, type CityRoute } from "@/libs/routes";
import { naira } from "@/libs/format";
import { SITE_URL, jsonLd, pageMetadata } from "@/libs/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Bus routes and fares",
  path: "/routes",
  description: "Every intercity bus route Obere Transport runs in Nigeria, with journey times, departure times and fares. Book your seat online.",
});

export default async function RoutesPage() {
  const routes = await getCityRoutes();
  const byOrigin = new Map<string, CityRoute[]>();
  for (const r of routes) byOrigin.set(r.from, [...(byOrigin.get(r.from) ?? []), r]);

  return (
    <>
      <Container>
        <PageHeader
          eyebrow="Where we go"
          title="Bus routes and fares"
          description="Intercity routes from our terminals, with typical journey times and the lowest fare on upcoming trips. Choose a route to see departure times and book."
        />
        {routes.length === 0 ? (
          <EmptyState title="Routes are loading">
            <Link href="/book" className="font-bold text-primary">
              Search trips
            </Link>{" "}
            to see what runs today.
          </EmptyState>
        ) : (
          <div className="space-y-10">
            {[...byOrigin.entries()].map(([city, list]) => (
              <section key={city} aria-labelledby={`from-${city}`}>
                <h2 id={`from-${city}`} className="font-display flex items-center gap-2 text-[20px] font-black text-ink">
                  <HiOutlineMapPin className="text-accent" /> From {city}
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/routes/${r.slug}`}
                        className="flex h-full flex-col rounded-[16px] border border-border-stroke bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                      >
                        <span className="font-display text-[17px] font-black text-ink">
                          {r.from} to {r.to}
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-[13px] text-gray-500">
                          <HiOutlineClock /> About {formatDuration(r.durationMinutes)}
                        </span>
                        <span className="mt-3 text-[13px] text-gray-500">
                          {r.fromPriceKobo != null ? (
                            <>
                              From <strong className="text-[15px] text-primary">{naira(r.fromPriceKobo)}</strong>
                            </>
                          ) : (
                            "See fares"
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Container>
      <ReadyToBoard />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Obere Transport bus routes",
          itemListElement: routes.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: `${r.from} to ${r.to}`, url: `${SITE_URL}/routes/${r.slug}` })),
        })}
      />
    </>
  );
}
