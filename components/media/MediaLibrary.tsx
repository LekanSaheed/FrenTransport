"use client";
import React, { useCallback, useEffect, useState } from "react";
import { HiMiniMagnifyingGlass } from "react-icons/hi2";
import { DataState, Pagination, SmallButton } from "@/components/admin/ui";
import { Input } from "@/components/ui/form";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { useAdminData } from "@/libs/admin";
import { mediaApi, type MediaAsset, type MediaList } from "@/libs/media";
import type { ApiError } from "@/libs/api";
import MediaDropzone from "./MediaDropzone";
import MediaGrid from "./MediaGrid";

const PAGE_SIZE = 24;

/**
 * The gallery: search, upload and browse images. One component, two modes:
 *  - "manage" (Admin → Gallery): rename, copy link, delete
 *  - "pick" (floating picker): choose an image; new uploads are selected automatically
 */
export default function MediaLibrary({
  mode,
  selectedId,
  selectedUrl,
  onSelect,
}: {
  mode: "manage" | "pick";
  selectedId?: string | null;
  selectedUrl?: string | null;
  onSelect?: (asset: MediaAsset) => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const list = useAdminData<MediaList>("/media", { search: query || undefined, page, pageSize: PAGE_SIZE });

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => (setQuery(search.trim()), setPage(1)), 300);
    return () => clearTimeout(t);
  }, [search]);

  const onUploaded = useCallback(
    (assets: MediaAsset[]) => {
      setFresh((s) => new Set([...s, ...assets.map((a) => a.id)]));
      setSearch("");
      setQuery("");
      setPage(1);
      list.reload();
      if (mode === "pick" && assets.length === 1) onSelect?.(assets[0]!);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, onSelect],
  );

  async function run(fn: () => Promise<unknown>, success: string) {
    setMessage(null);
    try {
      await fn();
      setMessage({ tone: "success", text: success });
      list.reload();
    } catch (e) {
      setMessage({ tone: "error", text: (e as ApiError).message });
    }
  }

  const storage = list.data?.storage;

  return (
    <div className="space-y-4">
      {storage && !storage.enabled && (
        <Alert tone="warning" title="Uploads aren't set up yet">
          Add <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> to the backend environment and restart it.
        </Alert>
      )}
      {storage && <MediaDropzone rules={storage} onUploaded={onUploaded} compact={mode === "pick"} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-xs">
          <HiMiniMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={16} />
          <Input aria-label="Search images" placeholder="Search images" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
        </label>
        {list.data && (
          <p className="text-[12.5px] text-gray-500">
            {list.data.total} image{list.data.total === 1 ? "" : "s"}
            {query && ` matching “${query}”`}
          </p>
        )}
      </div>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <DataState loading={list.loading} error={list.error} hasData={!!list.data}>
        {list.data && list.data.items.length === 0 ? (
          <EmptyState title={query ? "No images match" : "No images yet"}>{query ? "Try another name." : "Upload your first image above."}</EmptyState>
        ) : (
          list.data && (
            <>
              <MediaGrid
                items={list.data.items}
                highlight={fresh}
                selectedId={selectedId}
                selectedUrl={selectedUrl}
                onSelect={mode === "pick" ? onSelect : undefined}
                actions={mode === "manage" ? (a) => <ManageActions asset={a} run={run} /> : undefined}
              />
              <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onPage={setPage} />
            </>
          )
        )}
      </DataState>
    </div>
  );
}

function ManageActions({ asset, run }: { asset: MediaAsset; run: (fn: () => Promise<unknown>, success: string) => void }) {
  const [copied, setCopied] = useState(false);
  const inUse = asset.usedBy.length > 0;
  return (
    <>
      <SmallButton
        onClick={() => {
          const label = window.prompt("Image name", asset.label);
          if (label && label.trim() && label.trim() !== asset.label) run(() => mediaApi.rename(asset.id, label.trim()), "Image renamed.");
        }}
      >
        Rename
      </SmallButton>
      <SmallButton
        onClick={async () => {
          await navigator.clipboard?.writeText(asset.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </SmallButton>
      <SmallButton
        tone="danger"
        disabled={inUse}
        onClick={() => {
          if (window.confirm(`Delete "${asset.label}" from the gallery and Cloudinary? This can't be undone.`)) run(() => mediaApi.remove(asset.id), "Image deleted.");
        }}
      >
        Delete
      </SmallButton>
      {inUse && <p className="w-full text-[11.5px] text-gray-500">Used by {asset.usedBy.map((u) => u.name).join(", ")}</p>}
    </>
  );
}
