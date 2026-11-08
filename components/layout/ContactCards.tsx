"use client";
import React from "react";
import { HiOutlineEnvelope, HiOutlinePhone } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import { LoadingBlock } from "@/components/ui/feedback";
import { intlPhone, useSupportContact } from "@/libs/site";

/** Support channels from Admin → Settings. */
export default function ContactCards() {
  const contact = useSupportContact();
  if (!contact) return <LoadingBlock label="Loading contact details…" />;
  const phone = intlPhone(contact.supportPhone);
  const channels = [
    { icon: HiOutlinePhone, label: "Call us", value: contact.supportPhone, href: `tel:${phone}` },
    { icon: FaWhatsapp, label: "WhatsApp", value: "Chat with support", href: `https://wa.me/${phone.replace("+", "")}`, external: true },
    { icon: HiOutlineEnvelope, label: "Email", value: contact.supportEmail, href: `mailto:${contact.supportEmail}` },
  ];
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {channels.map(({ icon: Icon, ...c }) => (
        <li key={c.label}>
          <a
            href={c.href}
            target={c.external ? "_blank" : undefined}
            rel={c.external ? "noopener noreferrer" : undefined}
            className="group flex h-full flex-col rounded-[22px] border border-border-stroke bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-tertiary text-primary transition group-hover:bg-primary group-hover:text-white">
              <Icon size={22} />
            </span>
            <span className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.12em] text-gray-400">{c.label}</span>
            <span className="font-display mt-1 text-[17px] font-black break-all text-ink">{c.value}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
