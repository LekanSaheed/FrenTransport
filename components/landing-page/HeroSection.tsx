import React from "react";
import Image from "next/image";
import {
  HiOutlineCreditCard,
  HiOutlineTicket,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import Container from "../layout/Container";
import { Eyebrow } from "../ui/layout";
import HeroSearch from "./HeroSearch";

const PERKS = [
  { icon: HiOutlineSquares2X2, label: "Pick your own seat" },
  { icon: HiOutlineCreditCard, label: "Secure card & transfer payments" },
  { icon: HiOutlineTicket, label: "Manage with reference + email" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-4 md:pt-6">
      <Container className="!py-0">
        <div className="bg-grid relative overflow-hidden rounded-[28px] bg-primary px-6 pt-10 pb-28 text-white sm:px-10 md:rounded-[36px] md:pt-14 md:pb-32 lg:px-14">
          {/* Soft light so the dark panel has depth */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#3a57c4] opacity-30 blur-[110px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-10 -bottom-40 h-[360px] w-[360px] rounded-full bg-accent opacity-20 blur-[120px]"
          />
          {/* Road curving through the panel, echoing the logo */}
          <svg
            aria-hidden
            viewBox="0 0 600 400"
            className="pointer-events-none absolute -right-24 -bottom-10 h-[420px] w-[640px] opacity-90 max-md:opacity-30"
          >
            <path
              d="M40 400 C 220 300, 380 220, 620 40"
              fill="none"
              stroke="#0f1d4d"
              strokeWidth="120"
              strokeLinecap="round"
            />
            <path
              d="M40 400 C 220 300, 380 220, 620 40"
              fill="none"
              stroke="#f26b1d"
              strokeWidth="4"
              strokeDasharray="18 16"
            />
          </svg>
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <Eyebrow tone="light">Intercity travel across Nigeria</Eyebrow>
              <h1 className="font-display mt-5 text-[38px] leading-[1.02] font-black tracking-n-3 sm:text-[50px] lg:text-[60px]">
                Move safely.
                <br />
                <span className="text-accent">Arrive in comfort.</span>
              </h1>
              <p className="mt-5 max-w-lg text-[15.5px] leading-[165%] text-white/70 md:text-[17px]">
                Book a seat on our daily routes between the South-East, Lagos,
                Abuja, Port Harcourt and beyond, or hire a car or a whole bus
                for your group.
              </p>
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {PERKS.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-2 text-[12.5px] font-bold text-white/90 ring-1 ring-white/10 ring-inset backdrop-blur-sm"
                  >
                    <Icon size={16} className="text-accent" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative mx-auto aspect-4/3 w-full max-w-[460px] rotate-[-2deg] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-8 ring-white/10">
                <Image
                  src="/fleet/hiace.png"
                  alt="Obere Transport minibus"
                  fill
                  priority
                  sizes="460px"
                  className="object-contain p-4"
                />
              </div>
              <div className="absolute -bottom-5 left-2 flex items-center gap-3 rounded-[16px] bg-white px-4 py-3 text-ink shadow-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <HiOutlineSquares2X2 size={20} />
                </span>
                <span>
                  <span className="block font-display text-[15px] font-black">
                    Live seat map
                  </span>
                  <span className="block text-[12px] text-gray-500">
                    Choose your seat before you pay
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 -mt-20 px-2 sm:px-6 lg:px-10">
          <HeroSearch />
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
