import React from "react";
import { HiOutlinePhoto } from "react-icons/hi2";
import { cn } from "@/libs/utils";
import SmartImage from "./SmartImage";

/** Small image preview for tables and lists, with a placeholder when there's no image. */
export default function MediaThumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={cn("relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-border-stroke bg-white", className)}>
      {src ? <SmartImage src={src} alt={alt} fill sizes="64px" className="object-contain p-0.5" /> : <HiOutlinePhoto size={20} className="text-gray-300" aria-label="No image" />}
    </div>
  );
}
