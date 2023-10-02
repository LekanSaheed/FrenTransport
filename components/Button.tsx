import React from "react";
import { motion } from "framer-motion";

interface buttonProps {
  label: string;
  variant: "primary" | "secondary" | "tertiary";
  className: string;
}
interface variantsProps {
  primary: string;
  secondary: string;
  tertiary: string;
}

const Button = ({ label, variant = "primary", className }: buttonProps) => {
  let variants: variantsProps = {
    primary: "bg-black text-white",
    secondary: "!border-black text-black",
    tertiary: "",
  };
  return (
    <motion.button
      className={`h-[44px] text-[14px] tracking-n-2 border border-transparent rounded-[10px] px-4 inline-flex items-center ${variants[variant]} ${className}`}
    >
      <label>{label}</label>
    </motion.button>
  );
};

export default Button;
