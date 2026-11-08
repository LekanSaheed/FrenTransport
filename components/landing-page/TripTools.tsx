import React from "react";
import Link from "next/link";
import { HiOutlineMagnifyingGlass, HiOutlinePencilSquare, HiOutlineUserCircle } from "react-icons/hi2";
import Container from "../layout/Container";

const TOOLS = [
  {
    icon: HiOutlineMagnifyingGlass,
    title: "Check booking status",
    text: "See whether your booking is confirmed using your reference and email.",
    href: "/booking-status",
  },
  {
    icon: HiOutlinePencilSquare,
    title: "Manage a booking",
    text: "Pay, cancel or request a change. We'll email you a one-time code.",
    href: "/manage",
  },
  {
    icon: HiOutlineUserCircle,
    title: "Create an account",
    text: "Keep every trip in one place and skip the code when managing bookings.",
    href: "/register",
  },
];

/** Already booked? Quick links for travellers. */
const TripTools = () => {
  return (
    <section className="pb-20 md:pb-28">
      <Container>
        <div className="grid gap-px overflow-hidden rounded-[24px] border border-border-stroke bg-border-stroke md:grid-cols-3">
          {TOOLS.map(({ icon: Icon, ...t }) => (
            <Link key={t.href} href={t.href} className="group flex gap-4 bg-white p-6 transition hover:bg-canvas md:p-7">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
                <Icon size={22} />
              </span>
              <span>
                <span className="font-display flex items-center gap-2 text-[16px] font-black text-ink">
                  {t.title}
                  <span aria-hidden className="text-primary opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
                </span>
                <span className="mt-1 block text-[14px] leading-[160%] text-gray-500">{t.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default TripTools;
