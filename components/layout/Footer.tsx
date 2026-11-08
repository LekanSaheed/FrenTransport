"use client";
import React from "react";
import Link from "next/link";
import { HiOutlineEnvelope, HiOutlinePhone } from "react-icons/hi2";
import Container from "./Container";
import Logo from "./Logo";
import { footerLinks } from "./links";
import { intlPhone, useSupportContact } from "@/libs/site";

const Footer = () => {
  const contact = useSupportContact();
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="lane-line absolute inset-x-0 top-0 opacity-80" />
      <Container className="pt-16 pb-8 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-[14px] leading-[170%] text-white/60">
              Intercity seats, car hire and bus charters across Nigeria. Book online, pay securely and manage your trip with just your
              reference and email.
            </p>
            {contact && (
              <ul className="mt-6 space-y-2.5 text-[14px]">
                <li>
                  <a href={`tel:${intlPhone(contact.supportPhone)}`} className="flex items-center gap-2.5 text-white/80 hover:text-white">
                    <HiOutlinePhone size={17} className="text-accent" /> {contact.supportPhone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${contact.supportEmail}`} className="flex items-center gap-2.5 text-white/80 hover:text-white">
                    <HiOutlineEnvelope size={17} className="text-accent" /> {contact.supportEmail}
                  </a>
                </li>
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerLinks.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/40">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.items.map((item) => (
                    <li key={item.path}>
                      <Link href={item.path} className="text-[14px] font-semibold text-white/80 transition hover:text-accent">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Obere Transport Ltd. All rights reserved.</p>
          <p>Payments are processed securely by Paystack.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
