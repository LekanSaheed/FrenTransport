"use client";
import React, { useRef, useState } from "react";
import { HiMiniArrowUpTray, HiMiniCheckCircle, HiMiniExclamationCircle, HiMiniXMark } from "react-icons/hi2";
import { cn } from "@/libs/utils";
import { acceptAttr, formatBytes, useMediaUpload, type MediaAsset, type MediaRules } from "@/libs/media";

/**
 * Drag-and-drop / click-to-choose uploader with per-file progress. Used by the
 * Gallery page and by the floating picker, so uploading works the same way
 * wherever an image is needed.
 */
export default function MediaDropzone({
  rules,
  onUploaded,
  compact,
}: {
  rules: MediaRules;
  onUploaded: (assets: MediaAsset[]) => void;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const { items, upload, dismiss, busy } = useMediaUpload(rules, onUploaded);
  const disabled = !rules.enabled;

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    if (!disabled && e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }

  const formats = rules.formats.filter((f) => f !== "jpeg").map((f) => f.toUpperCase()).join(", ");

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed text-center transition",
          compact ? "px-4 py-5 sm:flex-row sm:gap-4 sm:text-left" : "px-6 py-10",
          over ? "border-primary bg-tertiary/60" : "border-border-stroke bg-canvas/60",
          disabled && "opacity-60",
        )}
      >
        <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-card", compact ? "h-10 w-10" : "h-12 w-12")}>
          <HiMiniArrowUpTray size={compact ? 18 : 22} />
        </span>
        <div className={cn(!compact && "mt-1")}>
          <p className="text-[14px] font-bold text-ink">
            Drag images here or{" "}
            <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="text-primary underline-offset-4 hover:underline disabled:no-underline">
              choose files
            </button>
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {formats} · up to {formatBytes(rules.maxBytes)} each · several at once
          </p>
        </div>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={acceptAttr(rules.formats)}
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-live="polite" aria-busy={busy}>
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3 rounded-[10px] bg-canvas px-3 py-2 text-[13px]">
              {i.status === "done" ? (
                <HiMiniCheckCircle className="shrink-0 text-emerald-600" size={18} />
              ) : i.status === "error" ? (
                <HiMiniExclamationCircle className="shrink-0 text-red-600" size={18} />
              ) : (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-r-transparent" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{i.name}</p>
                {i.status === "error" ? (
                  <p className="text-[12px] text-red-600">{i.error}</p>
                ) : (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className={cn("h-full rounded-full transition-all", i.status === "done" ? "bg-emerald-500" : "bg-primary")} style={{ width: `${i.progress}%` }} />
                  </div>
                )}
              </div>
              {i.status !== "uploading" && (
                <button type="button" aria-label={`Dismiss ${i.name}`} onClick={() => dismiss(i.key)} className="text-gray-400 hover:text-ink">
                  <HiMiniXMark size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
