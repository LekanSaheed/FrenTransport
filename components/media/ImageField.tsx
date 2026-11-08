"use client";
import React, { useState } from "react";
import { HiOutlinePhoto } from "react-icons/hi2";
import { SmallButton } from "@/components/admin/ui";
import SmartImage from "./SmartImage";
import MediaPicker from "./MediaPicker";

/**
 * Form control for an image URL: shows a preview and opens the floating
 * gallery to pick (or upload) one. The value is the image's URL string.
 */
export default function ImageField({
  id,
  value,
  onChange,
  pickerTitle,
}: {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  pickerTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div id={id} className="flex items-center gap-3 rounded-[12px] border border-border-stroke bg-white p-2.5">
      <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-canvas">
        {value ? <SmartImage src={value} alt="Selected image" fill sizes="96px" className="object-contain" /> : <HiOutlinePhoto size={24} className="text-gray-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] text-gray-500" title={value}>
          {value ? value.split("/").pop() : "No image selected"}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <SmallButton tone="primary" onClick={() => setOpen(true)}>
            {value ? "Change image" : "Choose from gallery"}
          </SmallButton>
          {value && <SmallButton onClick={() => onChange("")}>Remove</SmallButton>}
        </div>
      </div>
      <MediaPicker open={open} value={value} onClose={() => setOpen(false)} onPick={(url) => onChange(url)} title={pickerTitle} />
    </div>
  );
}
