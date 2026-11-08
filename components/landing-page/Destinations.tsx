"use client";
import React from "react";
import Link from "next/link";
import { HiOutlineMapPin } from "react-icons/hi2";
import Container from "../layout/Container";
import Heading from "../typography/Heading";
import { Eyebrow } from "../ui/layout";
import { useCities } from "@/libs/site";

/** Cities served, read from the live route network (Admin → Routes & terminals). */
const Destinations = () => {
  const cities = useCities();
  if (cities && cities.length === 0) return null;
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
            <Link href="/book" className="mt-6 inline-flex items-center gap-2 text-[14px] font-extrabold text-primary hover:gap-3 transition-all">
              Search all routes <span aria-hidden>→</span>
            </Link>
          </div>
          <ul className="flex flex-wrap gap-3" aria-busy={!cities}>
            {(cities ?? Array.from({ length: 9 }, () => "")).map((city, i) =>
              city ? (
                <li
                  key={city}
                  className="flex items-center gap-2.5 rounded-full border border-border-stroke bg-white py-2.5 pr-5 pl-2.5 text-[15px] font-bold text-ink shadow-card"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary text-primary">
                    <HiOutlineMapPin size={16} />
                  </span>
                  {city}
                </li>
              ) : (
                <li key={i} className="h-[54px] w-36 animate-pulse rounded-full bg-canvas" />
              ),
            )}
          </ul>
        </div>
      </Container>
    </section>
  );
};

export default Destinations;
