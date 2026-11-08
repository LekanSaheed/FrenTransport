import Image from "next/image";
import Link from "next/link";
import { cn } from "@/libs/utils";

/** Logo mark + wordmark (the mark alone is too small to read the text at header size). */
export default function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Obere Transport home">
      <span className={cn("relative h-11 w-9 shrink-0", tone === "light" && "rounded-[8px] bg-white p-1")}>
        <Image src="/logo.png" alt="" fill sizes="36px" className="object-contain" priority />
      </span>
      <span className="leading-none">
        <span className={cn("font-display block text-[19px] font-black tracking-n-2", tone === "dark" ? "text-primary" : "text-white")}>OBERE</span>
        <span className={cn("block text-[9px] font-extrabold uppercase tracking-[0.42em]", tone === "dark" ? "text-accent" : "text-white/70")}>Transport</span>
      </span>
    </Link>
  );
}
