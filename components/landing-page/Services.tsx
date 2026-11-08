import React from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "../layout/Container";
import Heading from "../typography/Heading";
import { Eyebrow } from "../ui/layout";

const SERVICES = [
  {
    title: "Book a seat",
    text: "Daily departures on fixed routes. Search by date, pick your seat on the map and pay online in minutes.",
    img: "/fleet/sienna.jpg",
    href: "/book",
    cta: "Find a trip",
    tag: "Most popular",
  },
  {
    title: "Hire a car",
    text: "A private car with a professional driver for airport runs, business days or intercity trips. Priced per day.",
    img: "/fleet/spider.jpg",
    href: "/hire/car",
    cta: "Hire a car",
  },
  {
    title: "Hire a bus",
    text: "A whole bus for weddings, church and school trips or staff transport. Tell us the plan and we'll send a quote.",
    img: "/fleet/hiace.png",
    href: "/hire/bus",
    cta: "Request a quote",
  },
];

const Services = () => {
  return (
    <section id="services" className="scroll-mt-24 py-20 md:py-28">
      <Container>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Eyebrow>Ways to travel</Eyebrow>
            <Heading level={2} className="mt-3 text-[30px] md:text-[40px]">
              One trip or the whole group.
            </Heading>
          </div>
          <p className="max-w-sm text-[15px] leading-[165%] text-gray-500">
            Every vehicle is air-conditioned, insured and driven by trained, professional drivers.
          </p>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-border-stroke bg-white transition hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative m-2 mb-0 h-[196px] overflow-hidden rounded-[18px] bg-gradient-to-b from-canvas to-white">
                  <Image src={s.img} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-[1.04]" />
                  {s.tag && (
                    <span className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold text-white">{s.tag}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6 pt-5">
                  <h3 className="font-display text-[20px] font-black text-ink">{s.title}</h3>
                  <p className="mt-2 flex-1 text-[14.5px] leading-[165%] text-gray-500">{s.text}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-extrabold text-primary">
                    {s.cta}
                    <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
};

export default Services;
