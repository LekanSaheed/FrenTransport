"use client";
import React from "react";
import { HiMiniCheck } from "react-icons/hi2";
import SmartImage from "./SmartImage";
import { cn } from "@/libs/utils";
import { formatBytes, type MediaAsset } from "@/libs/media";

/**
 * Thumbnail grid. With `onSelect` each tile is a selectable button (picker);
 * with `actions` each tile gets its own controls (gallery page).
 */
export default function MediaGrid({
  items,
  selectedId,
  selectedUrl,
  onSelect,
  actions,
  highlight,
}: {
  items: MediaAsset[];
  /** The picked image (exact); falls back to matching the field's current URL. */
  selectedId?: string | null;
  selectedUrl?: string | null;
  onSelect?: (asset: MediaAsset) => void;
  actions?: (asset: MediaAsset) => React.ReactNode;
  /** Ids to flag as just uploaded. */
  highlight?: Set<string>;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role={onSelect ? "listbox" : undefined} aria-label={onSelect ? "Images" : undefined}>
      {items.map((a) => {
        const selected = selectedId ? a.id === selectedId : !!selectedUrl && a.url === selectedUrl;
        const thumb = (
          <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[repeating-conic-gradient(#f1f3f8_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
              <SmartImage src={a.url} alt={a.label} fill sizes="(min-width: 1024px) 240px, 45vw" className="object-contain" />
              {selected && (
                <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-card">
                  <HiMiniCheck size={16} />
                </span>
              )}
              {highlight?.has(a.id) && <span className="absolute top-2 left-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10.5px] font-extrabold text-white">New</span>}
            </div>
            <div className="px-1 pt-2">
              <p className="truncate text-[13px] font-bold text-ink" title={a.label}>
                {a.label || "Untitled"}
              </p>
              <p className="text-[11.5px] text-gray-500">
                {a.width}×{a.height} · {formatBytes(a.bytes)}
                {a.usedBy.length > 0 && <span className="ml-1 font-bold text-primary">· in use</span>}
              </p>
            </div>
          </>
        );
        return (
          <li key={a.id} role={onSelect ? "option" : undefined} aria-selected={onSelect ? selected : undefined}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(a)}
                onDoubleClick={() => onSelect(a)}
                className={cn(
                  "w-full rounded-[16px] border-2 p-1.5 text-left transition",
                  selected ? "border-accent bg-accent-soft" : "border-transparent hover:border-border-stroke hover:bg-canvas",
                )}
              >
                {thumb}
              </button>
            ) : (
              <div className="rounded-[16px] border border-border-stroke bg-white p-1.5 shadow-card">
                {thumb}
                {actions && <div className="flex flex-wrap gap-1.5 px-1 pt-2 pb-1">{actions(a)}</div>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
