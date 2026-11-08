import React from "react";
import { cn } from "@/libs/utils";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/libs/format";
import type { BookingStatus, PaymentStatus } from "@/libs/types";

const TONES = {
  info: "bg-tertiary/60 text-primary-dark border-primary/15",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-orange-50 text-orange-800 border-orange-200",
  error: "bg-red-50 text-red-700 border-red-200",
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[12px] border p-4 text-[13.5px] leading-[155%]", TONES[tone], className)}>
      {title && <p className="font-extrabold">{title}</p>}
      {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-[13px] text-gray-500" role="status">
      <Spinner className="text-primary" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border-2 border-dashed border-border-stroke bg-white px-6 py-12 text-center">
      <p className="font-display text-[17px] font-extrabold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-sm text-[13px] text-gray-500">{children}</div>}
    </div>
  );
}

const STATUS_TONE: Record<BookingStatus, string> = {
  pending_approval: "bg-orange-50 text-orange-700",
  pending_payment: "bg-orange-50 text-orange-700",
  payment_processing: "bg-primary/10 text-primary",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-600",
  expired: "bg-gray-100 text-gray-500",
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  unpaid: "bg-gray-100 text-gray-600",
  pending: "bg-primary/10 text-primary",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-red-50 text-red-600",
  refund_pending: "bg-orange-50 text-orange-700",
  refunded: "bg-gray-100 text-gray-600",
  partially_refunded: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge className={STATUS_TONE[status]}>{BOOKING_STATUS_LABEL[status]}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge className={PAYMENT_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ring-black/5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']", className)}>{children}</span>;
}
