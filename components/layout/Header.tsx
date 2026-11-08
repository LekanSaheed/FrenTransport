"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { HiMiniBars3, HiMiniXMark } from "react-icons/hi2";
import { cn } from "@/libs/utils";
import containerClass from "./containerClass";
import links from "./links";
import Logo from "./Logo";
import AccountLink from "./AccountLink";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-white/85 backdrop-blur-md transition-shadow",
        scrolled ? "border-border-stroke shadow-[0_8px_24px_-16px_rgba(11,22,64,0.25)]" : "border-transparent",
      )}
    >
      <div className={cn(containerClass, "flex h-[72px] items-center justify-between gap-6 !py-0")}>
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              aria-current={isActive(link.path) ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-[13.5px] font-bold transition",
                isActive(link.path) ? "bg-tertiary text-primary" : "text-gray-600 hover:bg-canvas hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <AccountLink className="rounded-full px-3.5 py-2 text-[13.5px] font-bold text-gray-700 hover:text-primary" />
          <Link
            href="/book"
            className="rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-extrabold text-white shadow-[0_6px_16px_-8px_rgba(242,107,29,0.9)] transition hover:brightness-95"
          >
            Book now
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white lg:hidden"
        >
          {open ? <HiMiniXMark size={22} /> : <HiMiniBars3 size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Main"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full border-b border-border-stroke bg-white shadow-lift lg:hidden"
          >
            <ul className={cn(containerClass, "grid gap-1 !pb-6")}>
              {links.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    aria-current={isActive(link.path) ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-[12px] px-4 py-3.5 text-[15px] font-bold",
                      isActive(link.path) ? "bg-tertiary text-primary" : "text-ink hover:bg-canvas",
                    )}
                  >
                    {link.label}
                    <span aria-hidden className="text-gray-300">→</span>
                  </Link>
                </li>
              ))}
              <li className="mt-3 grid grid-cols-2 gap-2">
                <AccountLink className="flex h-12 items-center justify-center rounded-[12px] border border-border-stroke text-[14px] font-bold text-ink" />
                <Link href="/book" className="flex h-12 items-center justify-center rounded-[12px] bg-accent text-[14px] font-extrabold text-white">
                  Book now
                </Link>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
