"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/libs/utils";

interface buttonProps {
  label: string;
  variant?: "primary" | "secondary" | "tertiary" | "accent";
  className?: string;
  fullWidth?: boolean;
  /** Renders a Next.js link styled as a button. */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}
interface variantsProps {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
}

const Button = ({
  label,
  variant = "primary",
  className,
  fullWidth,
  href,
  onClick,
  type = "button",
  disabled,
  loading,
}: buttonProps) => {
  const variants: variantsProps = {
    primary: "bg-primary text-white shadow-[0_6px_16px_-8px_rgba(23,42,107,0.7)] hover:bg-primary-dark",
    secondary: "border-border-stroke bg-white text-black hover:border-primary hover:text-primary",
    tertiary: "text-primary hover:bg-tertiary",
    accent: "bg-accent text-white shadow-[0_6px_16px_-8px_rgba(242,107,29,0.8)] hover:brightness-95",
  };
  const classes = cn(
    `h-11 text-[14px] font-bold tracking-n-2 border border-transparent rounded-[12px] px-5 text-center whitespace-nowrap inline-flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed`,
    variants[variant],
    className,
    { "w-full": fullWidth },
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      className={classes}
    >
      {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      <span>{label}</span>
    </motion.button>
  );
};

export default Button;
