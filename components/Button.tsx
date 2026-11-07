"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/libs/utils";

interface buttonProps {
  label: string;
  variant?: "primary" | "secondary" | "tertiary";
  className?: string;
  fullWidth?: boolean;
}
interface variantsProps {
  primary: string;
  secondary: string;
  tertiary: string;
}

const Button = ({
  label,
  variant = "primary",
  className,
  fullWidth,
}: buttonProps) => {
  let variants: variantsProps = {
    primary: "bg-black text-white",
    secondary: "!border-black text-black",
    tertiary: "",
  };
  return (
    <motion.button
      className={cn(
        `h-11 text-[14px] tracking-n-2 border border-transparent rounded-[10px] px-4 text-center`,
        variants[variant],
        className,
        { "w-full": fullWidth },
      )}
    >
      <label>{label}</label>
    </motion.button>
  );
};

export default Button;
