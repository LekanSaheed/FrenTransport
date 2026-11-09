"use client";
import React from "react";
import { HiMiniCheckBadge } from "react-icons/hi2";
import { Card, SectionTitle } from "@/components/ui/layout";
import { formatDateTime } from "@/libs/format";
import type { BookingDetails } from "@/libs/types";

/** The QR code staff scan at check-in. Shown while the booking is confirmed. */
export default function BoardingPass({ booking }: { booking: BookingDetails }) {
  const t = booking.ticket;
  if (!t) return null;
  const where = booking.type === "seat" ? "at the terminal" : "to your driver at pickup";
  return (
    <Card>
      <SectionTitle>Boarding pass</SectionTitle>
      {t.checkedInAt ? (
        <div className="flex items-start gap-3 rounded-[12px] bg-emerald-50 p-4 text-emerald-800">
          <HiMiniCheckBadge size={22} className="shrink-0" />
          <p className="text-[13.5px] font-semibold">Checked in {formatDateTime(t.checkedInAt)}. Have a good trip!</p>
        </div>
      ) : (
        <>
          <div className="mx-auto w-full max-w-[220px] rounded-[14px] border border-border-stroke bg-white p-3">
            {/* SVG from the API; plain <img> so it prints and saves as is. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.qrUrl} alt={`QR code for booking ${booking.reference}`} width={196} height={196} className="block h-auto w-full" />
          </div>
          <p className="font-display mt-3 text-center text-[18px] font-extrabold tracking-[0.08em] text-ink">{booking.reference}</p>
          <p className="mt-1 text-center text-[12.5px] leading-[150%] text-gray-500">
            Show this code {where}, with a valid ID. It works once, and stays the same if you change your seat or date.
          </p>
          <a
            href={t.qrUrl.replace(/\.svg$/, ".png")}
            target="_blank"
            rel="noopener"
            download={`obere-${booking.reference}.png`}
            className="mt-3 block text-center text-[13px] font-bold text-primary underline-offset-2 hover:underline"
          >
            Save QR code
          </a>
        </>
      )}
    </Card>
  );
}
