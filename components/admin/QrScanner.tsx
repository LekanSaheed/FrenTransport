"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScanBarcode } from "iconsax-react";
import Button from "@/components/Button";

/** Browser QR reader where available (Chrome, Edge, Android); jsQR decodes frames elsewhere (Safari, Firefox). */
interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: { new (opts: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };
  }
}

async function makeDecoder(): Promise<(video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<string | null>> {
  const BD = window.BarcodeDetector;
  if (BD && (await BD.getSupportedFormats?.())?.includes("qr_code")) {
    const detector = new BD({ formats: ["qr_code"] });
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
  }
  const jsQR = (await import("jsqr")).default;
  return async (video, canvas) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, w, h);
    return jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

/**
 * Camera QR scanner. Calls `onResult` once per code and stops; mount it again to scan the next one.
 * The camera only starts when staff tap "Start camera" (browsers ask for permission then).
 */
export default function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  async function start() {
    setError(null);
    setState("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("This browser can't use the camera here. Type the booking reference below, or open the site over https.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      const v = video.current!;
      v.srcObject = stream.current;
      await v.play();
      setState("scanning");
      const decode = await makeDecoder();
      let busy = false;
      const tick = async () => {
        if (!stream.current) return;
        if (!busy && v.readyState >= 2) {
          busy = true;
          const text = await decode(v, canvas.current!).catch(() => null);
          busy = false;
          if (text) {
            stop();
            setState("idle");
            onResult(text);
            return;
          }
        }
        setTimeout(tick, 200);
      };
      tick();
    } catch (e) {
      stop();
      setState("error");
      const name = (e as DOMException).name;
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Allow the camera for this site in the browser settings, or type the reference below."
          : name === "NotFoundError"
            ? "No camera found on this device. Type the booking reference below."
            : "The camera couldn't start. Type the booking reference below.",
      );
    }
  }

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-[18px] bg-ink">
        <video ref={video} muted playsInline className={state === "scanning" ? "h-full w-full object-cover" : "hidden"} />
        <canvas ref={canvas} className="hidden" />
        {state === "scanning" ? (
          <>
            {/* Aiming frame */}
            <div className="pointer-events-none absolute inset-[18%] rounded-[14px] border-[3px] border-white/85 shadow-[0_0_0_9999px_rgba(10,18,48,0.35)]" />
            <p className="absolute inset-x-0 bottom-3 text-center text-[12.5px] font-semibold text-white">Point at the QR code</p>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <ScanBarcode size={54} color="currentColor" variant="Bulk" />
            <Button label={state === "starting" ? "Starting camera…" : "Start camera"} loading={state === "starting"} onClick={start} />
          </div>
        )}
      </div>
      {error && <p className="mx-auto mt-3 max-w-[360px] text-center text-[13px] text-red-600">{error}</p>}
      {state === "scanning" && (
        <div className="mt-3 text-center">
          <button
            type="button"
            className="text-[13px] font-semibold text-gray-500 underline-offset-2 hover:underline"
            onClick={() => {
              stop();
              setState("idle");
            }}
          >
            Stop camera
          </button>
        </div>
      )}
    </div>
  );
}
