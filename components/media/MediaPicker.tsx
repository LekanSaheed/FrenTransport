"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/Button";
import { Modal } from "@/components/admin/ui";
import type { MediaAsset } from "@/libs/media";
import MediaLibrary from "./MediaLibrary";

/**
 * Floating gallery: browse or upload images, pick one, and get its URL back.
 * Opens on top of whatever form needs an image.
 */
export default function MediaPicker({
  open,
  value,
  onClose,
  onPick,
  title = "Choose an image",
}: {
  open: boolean;
  value?: string | null;
  onClose: () => void;
  onPick: (url: string, asset: MediaAsset) => void;
  title?: string;
}) {
  const [chosen, setChosen] = useState<MediaAsset | null>(null);
  useEffect(() => {
    if (open) setChosen(null);
  }, [open]);

  return (
    <Modal open={open} title={title} onClose={onClose} size="xl">
      <MediaLibrary mode="pick" selectedId={chosen?.id} selectedUrl={value} onSelect={setChosen} />
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex items-center justify-between gap-3 rounded-b-[20px] border-t border-border-stroke bg-white/95 px-5 py-3.5 backdrop-blur">
        <p className="min-w-0 truncate text-[13px] text-gray-500">{chosen ? <>Selected: <strong className="text-ink">{chosen.label}</strong></> : "Click an image to select it."}</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" label="Cancel" onClick={onClose} className="h-10" />
          <Button
            label="Use this image"
            className="h-10"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              onPick(chosen.url, chosen);
              onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
