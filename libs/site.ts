"use client";
import { useEffect, useState } from "react";
import { api, type PublicConfig } from "./api";

/*
 * Public data used by the site chrome (footer, contact page).
 * Fetched once per page load and shared between components.
 */
let configPromise: Promise<PublicConfig | null> | null = null;

function loadConfig() {
  configPromise ??= api.config().catch(() => null);
  return configPromise;
}

/** Support contacts from Admin → Settings (null while loading or if unavailable). */
export function useSupportContact() {
  const [contact, setContact] = useState<PublicConfig["contact"] | null>(null);
  useEffect(() => {
    let live = true;
    loadConfig().then((c) => live && setContact(c?.contact ?? null));
    return () => {
      live = false;
    };
  }, []);
  return contact;
}

/** "08031234567" → "+2348031234567" for tel: and WhatsApp links. */
export function intlPhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return digits;
}
