import React from "react";
import Link from "next/link";
import { HiOutlineMapPin } from "react-icons/hi2";
import Container from "../layout/Container";
import Heading from "../typography/Heading";
import { Eyebrow } from "../ui/layout";
import { getCityRoutes } from "@/libs/routes";
import { naira } from "@/libs/format";

/**
 * Cities served and popular routes, from the live route network (Admin → Routes & terminals).
 * Server-rendered (cached with the page) so search engines see the cities and follow the
 * links to each route page.
 */
const Destinations = async () => {
  const routes = await getCityRoutes();
  if (routes.length === 0) return null;
  const cities = [...new Set(routes.flatMap((r) => [r.from, r.to]))].sort();
  const popular = [...routes].sort((a, b) => b.departuresThisWeek - a.departuresThisWeek).slice(0, 8);
  return (
    <section className="py-20 md:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <Eyebrow>Where we go</Eyebrow>
            <Heading level={2} className="mt-3 text-[30px] md:text-[40px]">
              Connecting the East to the rest of Nigeria.
            </Heading>
            <p className="mt-4 max-w-md text-[15px] leading-[165%] text-gray-500">
              Departures from dedicated terminals in every city we serve. Not every pair is connected in both directions, so search
              your exact route to see what runs.
            </p>
            <Link href="/routes" className="mt-6 inline-flex items-center gap-2 text-[14px] font-extrabold text-primary hover:gap-3 transition-all">
              See all routes and fares <span aria-hidden>→</span>
            </Link>
          </div>
          <div>
            <ul className="flex flex-wrap gap-3" aria-label="Cities we serve">
              {cities.map((city) => (
                <li
                  key={city}
                  className="flex items-center gap-2.5 rounded-full border border-border-stroke bg-white py-2.5 pr-5 pl-2.5 text-[15px] font-bold text-ink shadow-card"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary text-primary">
                    <HiOutlineMapPin size={16} />
                  </span>
                  {city}
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-[12px] font-extrabold uppercase tracking-[0.12em] text-gray-500">Popular routes</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {popular.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/routes/${r.slug}`}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-border-stroke bg-white px-4 py-3 text-[14px] font-bold text-ink transition hover:border-primary/40"
                  >
                    <span>
                      {r.from} to {r.to}
                    </span>
                    {r.fromPriceKobo != null && <span className="text-[13px] font-semibold text-primary">from {naira(r.fromPriceKobo)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Destinations;
