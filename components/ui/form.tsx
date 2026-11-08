import React from "react";
import { cn } from "@/libs/utils";

const control =
  "h-12 w-full rounded-[12px] border border-border-stroke bg-white px-3.5 text-[14.5px] font-medium text-black outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-canvas disabled:text-gray-400";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-bold text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, invalid && "border-red-400", className)} {...props} />;
  },
);

/** Custom dropdown (see ./Select.tsx); same props as a native <select>. */
export { Select } from "./Select";
export type { SelectGroup, SelectItems, SelectOption } from "./Select";

export function Textarea({ className, invalid, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(control, "h-auto min-h-[96px] py-2.5 leading-[150%]", invalid && "border-red-400", className)}
      {...props}
    />
  );
}

/** Contact details shared by every booking form. */
export function ContactFields({
  value,
  onChange,
  errors = {},
  prefix = "contact",
}: {
  value: { fullName: string; email: string; phone: string };
  onChange: (v: { fullName: string; email: string; phone: string }) => void;
  errors?: Record<string, string>;
  prefix?: string;
}) {
  const set = (k: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" htmlFor={`${prefix}-name`} error={errors[`${prefix}.fullName`]} className="sm:col-span-2">
        <Input id={`${prefix}-name`} autoComplete="name" value={value.fullName} onChange={set("fullName")} required />
      </Field>
      <Field
        label="Email address"
        htmlFor={`${prefix}-email`}
        error={errors[`${prefix}.email`]}
        hint="Your booking confirmation and reference are sent here."
      >
        <Input id={`${prefix}-email`} type="email" autoComplete="email" value={value.email} onChange={set("email")} required />
      </Field>
      <Field label="Phone number" htmlFor={`${prefix}-phone`} error={errors[`${prefix}.phone`]}>
        <Input
          id={`${prefix}-phone`}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0803 123 4567"
          value={value.phone}
          onChange={set("phone")}
          required
        />
      </Field>
    </div>
  );
}
